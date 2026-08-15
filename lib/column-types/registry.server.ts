import {
  dateValueSchema,
  linkValueSchema,
  personValueSchema,
  statusValueSchema,
  textValueSchema,
} from "./schemas";
import type { z } from "zod";

export type { ColumnType } from "./schemas";
import type { ColumnType } from "./schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry is intentionally type-erased; each entry keeps its own value type at the point of use.
export const columnValueSchemaRegistry: Record<ColumnType, z.ZodType<any>> = {
  text: textValueSchema,
  status: statusValueSchema,
  date: dateValueSchema,
  link: linkValueSchema,
  person: personValueSchema,
};
