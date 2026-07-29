import type { UseMutationResult } from "@tanstack/react-query";
import type { components } from "./api-types";

type Entry = components["schemas"]["Entry"];

export type CreateEntryMutation = UseMutationResult<
  Entry,
  Error,
  { parameterId: string; value: number; note?: string },
  unknown
>;

export type UpdateEntryMutation = UseMutationResult<
  Entry,
  Error,
  { id: string; value: number; note?: string },
  unknown
>;
