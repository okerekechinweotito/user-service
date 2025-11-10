/* import { createFactory } from "hono/factory";
import { zValidator } from "@hono/zod-validator";
import { customLogger } from "../utils/logger.ts"; //
import {
  stringSchema_POST,
  stringSchema_GET_query,
} from "../models/string.schema.ts";
import * as stringService from "../services/string.service.ts";

import * as nlpService from "../services/nlp.service.ts";

const factory = createFactory();

export const create_string = factory.createHandlers(
  zValidator("json", stringSchema_POST, (result, c) => {
    if (!result.success) {
      const isInvalidType = result.error.issues.some(
        (issue) => issue.path.includes("value") && issue.code === "invalid_type"
      );
      if (isInvalidType) {
        return c.json(
          { message: 'Invalid data type for "value" (must be string)' },
          422
        );
      }
    }
  }),
  async (c) => {
    try {
      const { value } = c.req.valid("json");
      const analyzer = new stringService.StringFactory(value);
      const result = await analyzer.analyzeString();
      return c.json(result, 201);
    } catch (error) {
      if (error instanceof stringService.StringConflictError) {
        return c.json({ message: error.message }, 409);
      }
      customLogger(error, "create_string");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const read_string = factory.createHandlers(
  zValidator("param", stringSchema_POST.pick({ value: true })),
  async (c) => {
    try {
      const { value } = c.req.valid("param");
      const result = stringService.getStringByValue(value);
      return c.json(result, 200);
    } catch (error) {
      if (error instanceof stringService.StringNotFoundError) {
        return c.json({ message: error.message }, 404);
      }
      customLogger(error, "read_string");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const get_all_strings = factory.createHandlers(
  zValidator("query", stringSchema_GET_query, (result, c) => {
    if (!result.success) {
      return c.json({ message: "Invalid query parameter values or types" }, 400);
    }
  }),
  async (c) => {
    try {
      const {
        is_palindrome,
        min_length,
        max_length,
        word_count,
        contains_character,
      } = c.req.valid("query");

      const filters = {
        is_palindrome,
        min_length,
        max_length,
        word_count,
        contains_character,
      };

      const result = stringService.getAllStrings(filters);
      return c.json(
        {
          data: result,
          count: result.length,
          filters_applied: filters,
        },
        200
      );
    } catch (error) {
      customLogger(error, "get_all_strings");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const delete_string = factory.createHandlers(
  zValidator("param", stringSchema_POST.pick({ value: true })),
  async (c) => {
    try {
      const { value } = c.req.valid("param");
      stringService.deleteStringByValue(value);
      return c.body(null, 204);
    } catch (error) {
      if (error instanceof stringService.StringNotFoundError) {
        return c.json({ message: error.message }, 404);
      }
      customLogger(error, "delete_string");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
);

export const filter_by_natural_language = factory.createHandlers(
  async (c) => {
    const query = c.req.query("query");
    if (!query) {
      return c.json({ message: "Query parameter is required" }, 400);
    }

    try {
      const parsedFilters = nlpService.parseNaturalLanguageQuery(query);
      const result = stringService.getAllStrings(parsedFilters);

      return c.json({
        data: result,
        count: result.length,
        interpreted_query: {
          original: query,
          parsed_filters: parsedFilters,
        },
      });
    } catch (error) {
      if (error instanceof nlpService.QueryParseError) {
        return c.json({ message: error.message }, 400);
      }
      if (error instanceof nlpService.ConflictingFiltersError) {
        return c.json({ message: error.message }, 422);
      }
      customLogger(error, "filter_by_natural_language");
      return c.json({ status: 500, message: "Something went wrong" }, 500);
    }
  }
); */
