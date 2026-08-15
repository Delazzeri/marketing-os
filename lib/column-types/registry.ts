"use client";

import { dateColumnType } from "./date";
import { linkColumnType } from "./link";
import { personColumnType } from "./person";
import { statusColumnType } from "./status";
import { textColumnType } from "./text";
import type { ColumnTypeDefinition } from "./types";

export type { ColumnType } from "./schemas";
import type { ColumnType } from "./schemas";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- registry is intentionally type-erased; each entry keeps its own TValue at the point of use via `columnTypeRegistry[column.type]`.
export const columnTypeRegistry: Record<ColumnType, ColumnTypeDefinition<any>> = {
  text: textColumnType,
  status: statusColumnType,
  date: dateColumnType,
  link: linkColumnType,
  person: personColumnType,
};

export type { ColumnTypeDefinition } from "./types";
