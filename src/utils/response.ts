import { HTTP_STATUS } from "@/constants";
import type { FastifyReply } from "fastify";

// Standard API response format
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
  details?: unknown[];
}

// Generic function to send any type of response
export const sendResponse = <T>(
  reply: FastifyReply,
  statusCode: number,
  response: ApiResponse<T>,
): void => {
  reply.code(statusCode).send(response);
};

// Send successful response (200 OK)
export const sendSuccess = <T>(
  reply: FastifyReply,
  data: T,
  message?: string,
  count?: number,
): void => {
  sendResponse(reply, HTTP_STATUS.OK, { success: true, data, message, count });
};

// Send created response (201 Created)
export const sendCreated = <T>(reply: FastifyReply, data: T, message: string): void => {
  sendResponse(reply, HTTP_STATUS.CREATED, { success: true, data, message });
};

// Send error response
export const sendError = (
  reply: FastifyReply,
  statusCode: number,
  error: string,
  message?: string,
  details?: unknown[],
): void => {
  sendResponse(reply, statusCode, { success: false, error, message, details });
};
