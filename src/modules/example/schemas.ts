import { type Static, Type } from "@fastify/type-provider-typebox";

// Core entity
export const ExampleSchema = Type.Object({
  id: Type.Number(),
  name: Type.String(),
  email: Type.String({ format: "email" }),
  age: Type.Optional(Type.Number()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

// Request bodies
export const CreateExampleBody = Type.Object({
  name: Type.String({ minLength: 1 }),
  email: Type.String({ format: "email" }),
  age: Type.Optional(Type.Number()),
});

export const UpdateExampleBody = Type.Partial(CreateExampleBody);

// Route params
export const ExampleParams = Type.Object({
  id: Type.Number(),
});

// Response envelopes
export const ExampleResponse = Type.Object({
  success: Type.Boolean(),
  data: ExampleSchema,
  message: Type.Optional(Type.String()),
});

export const ExampleListResponse = Type.Object({
  success: Type.Boolean(),
  data: Type.Array(ExampleSchema),
  count: Type.Optional(Type.Number()),
  message: Type.Optional(Type.String()),
});

export const MessageResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.Optional(Type.String()),
});

export const ErrorResponse = Type.Object({
  success: Type.Boolean(),
  error: Type.String(),
  message: Type.Optional(Type.String()),
  details: Type.Optional(Type.Array(Type.Unknown())),
});

// Inferred types
export type Example = Static<typeof ExampleSchema>;
export type ExampleInput = Static<typeof CreateExampleBody>;
export type ExampleUpdate = Static<typeof UpdateExampleBody>;
