import { buildApp } from "@/app";
import { resetExamples } from "@/modules/example/services";
import type { FastifyInstance } from "fastify";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Example Routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    resetExamples();
  });

  it("GET /api/example returns an empty list", async () => {
    const res = await app.inject({ method: "GET", url: "/api/example" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ success: true, data: [], count: 0 });
  });

  it("POST /api/example creates an example", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/example",
      payload: { name: "Alice", email: "alice@example.com" },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe(1);
    expect(body.data.name).toBe("Alice");
  });

  it("POST /api/example rejects an invalid body with the error envelope", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/example",
      payload: { email: "not-an-email" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Validation Error");
  });

  it("GET /api/example/:id returns 404 for an unknown id", async () => {
    const res = await app.inject({ method: "GET", url: "/api/example/999" });
    expect(res.statusCode).toBe(404);
    expect(res.json().success).toBe(false);
  });

  it("supports a full CRUD round-trip", async () => {
    const created = await app.inject({
      method: "POST",
      url: "/api/example",
      payload: { name: "Bob", email: "bob@example.com", age: 40 },
    });
    const id = created.json().data.id;

    const updated = await app.inject({
      method: "PUT",
      url: `/api/example/${id}`,
      payload: { name: "Bobby" },
    });
    expect(updated.statusCode).toBe(200);
    expect(updated.json().data.name).toBe("Bobby");

    const deleted = await app.inject({
      method: "DELETE",
      url: `/api/example/${id}`,
    });
    expect(deleted.statusCode).toBe(200);
    expect(deleted.json().success).toBe(true);

    const list = await app.inject({ method: "GET", url: "/api/example" });
    expect(list.json().count).toBe(0);
  });

  it("returns the 404 envelope for unknown routes", async () => {
    const res = await app.inject({ method: "GET", url: "/does-not-exist" });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({
      success: false,
      error: "Route not found",
    });
  });
});
