import type { FastifyInstance } from "fastify";
import {
  createExampleController,
  deleteExampleController,
  getAllExamplesController,
  getExampleByIdController,
  updateExampleController,
} from "./controllers";
import {
  CreateExampleBody,
  ExampleListResponse,
  ExampleParams,
  ExampleResponse,
  MessageResponse,
  UpdateExampleBody,
} from "./schemas";

const exampleRoutes = async (fastify: FastifyInstance): Promise<void> => {
  // GET / - Get all examples
  fastify.get(
    "/",
    {
      schema: {
        tags: ["example"],
        response: { 200: ExampleListResponse },
      },
    },
    getAllExamplesController,
  );

  // POST / - Create a new example
  fastify.post(
    "/",
    {
      schema: {
        tags: ["example"],
        body: CreateExampleBody,
        response: { 201: ExampleResponse },
      },
    },
    createExampleController,
  );

  // GET /:id - Get a specific example by ID
  fastify.get(
    "/:id",
    {
      schema: {
        tags: ["example"],
        params: ExampleParams,
        response: { 200: ExampleResponse },
      },
    },
    getExampleByIdController,
  );

  // PUT /:id - Update an existing example
  fastify.put(
    "/:id",
    {
      schema: {
        tags: ["example"],
        params: ExampleParams,
        body: UpdateExampleBody,
        response: { 200: ExampleResponse },
      },
    },
    updateExampleController,
  );

  // DELETE /:id - Delete an example by ID
  fastify.delete(
    "/:id",
    {
      schema: {
        tags: ["example"],
        params: ExampleParams,
        response: { 200: MessageResponse },
      },
    },
    deleteExampleController,
  );
};

export default exampleRoutes;
