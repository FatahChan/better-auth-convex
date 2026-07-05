import type { BetterAuthPlugin } from "better-auth";
import { getAuthTables } from "@better-auth/core/db";
import { organization } from "better-auth/plugins";
import { describe, expect, it } from "vitest";
import { createSchema } from "./create-schema.js";

describe("createSchema", () => {
  it("emits v.id() for core FK fields", async () => {
    const tables = getAuthTables({});
    const { code } = await createSchema({ tables, file: "generatedSchema.ts" });

    expect(code).toMatch(/session: defineTable[\s\S]*userId: v\.id\("user"\)/);
    expect(code).toMatch(/account: defineTable[\s\S]*userId: v\.id\("user"\)/);
    expect(code).toContain("accountId: v.string()");
    expect(code).toContain("providerId: v.string()");
    expect(code).toContain("token: v.string()");
  });

  it("keeps user.userId as v.string() without references metadata", async () => {
    const tables = getAuthTables({
      user: {
        additionalFields: {
          userId: { type: "string", required: false },
        },
      },
    });
    const { code } = await createSchema({ tables, file: "generatedSchema.ts" });

    expect(code).toMatch(
      /user: defineTable[\s\S]*userId: v\.optional\(v\.union\(v\.null\(\), v\.string\(\)\)\)/
    );
  });

  it("emits v.id() for organization plugin FK fields", async () => {
    const tables = getAuthTables({
      plugins: [organization()],
    });
    const { code } = await createSchema({ tables, file: "generatedSchema.ts" });

    expect(code).toMatch(
      /member: defineTable[\s\S]*organizationId: v\.id\("organization"\)/
    );
    expect(code).toMatch(/member: defineTable[\s\S]*userId: v\.id\("user"\)/);
    expect(code).toMatch(
      /invitation: defineTable[\s\S]*organizationId: v\.id\("organization"\)/
    );
    expect(code).toMatch(
      /invitation: defineTable[\s\S]*inviterId: v\.id\("user"\)/
    );
    expect(code).toContain(
      "activeOrganizationId: v.optional(v.union(v.null(), v.string()))"
    );
  });

  it("uses renamed modelName in v.id()", async () => {
    const tables = getAuthTables({
      user: { modelName: "users" },
    });
    const { code } = await createSchema({ tables, file: "generatedSchema.ts" });

    expect(code).toContain('userId: v.id("users")');
    expect(code).toMatch(/users: defineTable/);
  });

  it("keeps v.string() when referenced table is absent from schema", async () => {
    const plugin = {
      id: "external-ref-test",
      schema: {
        widget: {
          fields: {
            ownerId: {
              type: "string",
              required: true,
              references: { field: "id", model: "externalAppUser" },
            },
          },
        },
      },
    } satisfies BetterAuthPlugin;
    const tables = getAuthTables({ plugins: [plugin] });
    const { code } = await createSchema({ tables, file: "generatedSchema.ts" });

    expect(code).toContain("ownerId: v.string()");
  });

  it("wraps optional FKs with v.optional(v.union(v.null(), v.id(...)))", async () => {
    const plugin = {
      id: "optional-fk-test",
      schema: {
        optionalRef: {
          fields: {
            userId: {
              type: "string",
              required: false,
              references: { field: "id", model: "user" },
            },
          },
        },
      },
    } satisfies BetterAuthPlugin;
    const tables = getAuthTables({ plugins: [plugin] });
    const { code } = await createSchema({ tables, file: "generatedSchema.ts" });

    expect(code).toContain(
      'userId: v.optional(v.union(v.null(), v.id("user")))'
    );
  });
});
