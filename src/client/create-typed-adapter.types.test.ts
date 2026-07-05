import { expectTypeOf, it } from "vitest";
import { createTypedAdapter } from "./create-typed-adapter.js";
import type { Doc } from "../component/_generated/dataModel.js";
import schema from "../component/schema.js";

const fns = {
  findOne: "adapter:findOne",
  findMany: "adapter:findMany",
  create: "adapter:create",
  updateOne: "adapter:updateOne",
  updateMany: "adapter:updateMany",
  deleteOne: "adapter:deleteOne",
  deleteMany: "adapter:deleteMany",
} as Parameters<typeof createTypedAdapter>[1];

const adapter = createTypedAdapter(schema, fns);

const queryCtx = {
  runQuery: async () =>
    ({ page: [] as never, isDone: true as const, continueCursor: "" }) as never,
};

const mutationCtx = {
  runMutation: async () => ({}) as never,
};

it("infers doc type from model on findOne", async () => {
  const user = await adapter.findOne(queryCtx, {
    model: "user",
    where: [{ field: "email", value: "a@b.c" }],
  });
  expectTypeOf(user).toEqualTypeOf<Doc<"user"> | null>();

  const member = await adapter.findOne(queryCtx, {
    model: "member",
    where: [{ field: "userId", value: "u1" }],
  });
  expectTypeOf(member).toEqualTypeOf<Doc<"member"> | null>();
});

it("infers doc type from model on create", async () => {
  const created = await adapter.create(mutationCtx, {
    input: {
      model: "session",
      data: {
        expiresAt: 0,
        token: "t",
        createdAt: 0,
        updatedAt: 0,
        userId: "u" as Doc<"user">["_id"],
      },
    },
  });
  expectTypeOf(created).toEqualTypeOf<Doc<"session">>();
});

it("infers page doc type from model on findMany", async () => {
  const result = await adapter.findMany(queryCtx, {
    model: "invitation",
    paginationOpts: { cursor: null, numItems: 10 },
  });
  expectTypeOf(result.page).toEqualTypeOf<Array<Doc<"invitation">>>();
});
