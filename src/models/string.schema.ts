import { z } from "zod";

export const stringSchema_POST = z.object({
  value: z.string().min(1),
});

export const stringSchema_GET = z.object({
  id: z.string(),
  value: z.string(),
  properties: z.object({
    length: z.number(),
    is_palindrome: z.boolean(),
    unique_characters: z.number(),
    word_count: z.number(),
    sha256_hash: z.string(),
    character_frequency_map: z.record(z.string(), z.number()),
  }),
  created_at: z.string(),
});

export type Strings_POST = z.infer<typeof stringSchema_POST>;
export type Strings_GET = z.infer<typeof stringSchema_GET>;

export const stringSchema_GET_query = z.object({
  is_palindrome: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  min_length: z.coerce.number().int().positive().optional(),
  max_length: z.coerce.number().int().positive().optional(),
  word_count: z.coerce.number().int().positive().optional(),
  contains_character: z.string().optional(),
}).strict();
