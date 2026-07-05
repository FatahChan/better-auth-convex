import { createApi } from "../client/index.js";
import { options } from "../auth-options.js";
import schema from "./schema.js";

const api = createApi(schema, () => options);

export const {
  create,
  findOne,
  findMany,
  updateOne,
  updateMany,
  deleteOne,
  deleteMany,
} = api;

export const typed = api.typed;
