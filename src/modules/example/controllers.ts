import type { Static } from "@fastify/type-provider-typebox";
import type { FastifyReply, FastifyRequest } from "fastify";
import { HTTP_STATUS } from "@/constants";
import { sendCreated, sendError, sendSuccess } from "@/utils/response";
import type { CreateExampleBody, ExampleParams, UpdateExampleBody } from "./schemas";
import {
  createExample,
  deleteExample,
  getAllExamples,
  getExampleById,
  updateExample,
} from "./services";

type ParamsType = Static<typeof ExampleParams>;
type CreateBody = Static<typeof CreateExampleBody>;
type UpdateBody = Static<typeof UpdateExampleBody>;

export const getAllExamplesController = async (
  _request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> => {
  const examples = getAllExamples();
  sendSuccess(reply, examples, undefined, examples.length);
};

export const getExampleByIdController = async (
  request: FastifyRequest<{ Params: ParamsType }>,
  reply: FastifyReply,
): Promise<void> => {
  const example = getExampleById(request.params.id);
  if (!example) {
    sendError(
      reply,
      HTTP_STATUS.NOT_FOUND,
      "Not Found",
      `Example with ID ${request.params.id} not found`,
    );
    return;
  }
  sendSuccess(reply, example);
};

export const createExampleController = async (
  request: FastifyRequest<{ Body: CreateBody }>,
  reply: FastifyReply,
): Promise<void> => {
  const example = createExample(request.body);
  sendCreated(reply, example, "Example created successfully");
};

export const updateExampleController = async (
  request: FastifyRequest<{ Params: ParamsType; Body: UpdateBody }>,
  reply: FastifyReply,
): Promise<void> => {
  const example = updateExample(request.params.id, request.body);
  if (!example) {
    sendError(
      reply,
      HTTP_STATUS.NOT_FOUND,
      "Not Found",
      `Example with ID ${request.params.id} not found`,
    );
    return;
  }
  sendSuccess(reply, example);
};

export const deleteExampleController = async (
  request: FastifyRequest<{ Params: ParamsType }>,
  reply: FastifyReply,
): Promise<void> => {
  const deleted = deleteExample(request.params.id);
  if (!deleted) {
    sendError(
      reply,
      HTTP_STATUS.NOT_FOUND,
      "Not Found",
      `Example with ID ${request.params.id} not found`,
    );
    return;
  }
  sendSuccess(reply, undefined, "Example deleted successfully");
};
