import { makeFunctionReference } from "convex/server";
import { expectTypeOf, it } from "vitest";
import { createTypedAdapter } from './create-typed-adapter.js';
import type { AdapterFunctions } from './create-typed-adapter.js';
import type { Doc } from "../component/_generated/dataModel.js";
import schema from "../component/schema.js";

const fns = {
  findOne: makeFunctionReference<"query">("adapter:findOne"),
  findMany: makeFunctionReference<"query">("adapter:findMany"),
  create: makeFunctionReference<"mutation">("adapter:create"),
  updateOne: makeFunctionReference<"mutation">("adapter:updateOne"),
  updateMany: makeFunctionReference<"mutation">("adapter:updateMany"),
  deleteOne: makeFunctionReference<"mutation">("adapter:deleteOne"),
  deleteMany: makeFunctionReference<"mutation">("adapter:deleteMany"),
} satisfies AdapterFunctions;

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

  const session = await adapter.findOne(queryCtx, {
    model: "session",
    where: [{ field: "userId", value: "u1" }],
  });
  expectTypeOf(session).toEqualTypeOf<Doc<"session"> | null>();
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
    model: "account",
    paginationOpts: { cursor: null, numItems: 10 },
  });
  expectTypeOf(result.page).toEqualTypeOf<Array<Doc<"account">>>();
});
