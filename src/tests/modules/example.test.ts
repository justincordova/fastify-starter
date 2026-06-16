import {
  createExample,
  deleteExample,
  getAllExamples,
  getExampleById,
  resetExamples,
  updateExample,
} from "@/modules/example/services";
import { beforeEach, describe, expect, it } from "vitest";

describe("Example Services", () => {
  beforeEach(() => {
    resetExamples();
  });

  describe("getAllExamples", () => {
    it("should return empty array initially", () => {
      expect(getAllExamples()).toEqual([]);
    });

    it("should return all examples", () => {
      createExample({ name: "Test", email: "test@example.com" });
      createExample({ name: "Test2", email: "test2@example.com" });
      expect(getAllExamples().length).toBe(2);
    });
  });

  describe("getExampleById", () => {
    it("should return null for non-existent example", () => {
      expect(getExampleById(999)).toBeNull();
    });

    it("should return example by ID", () => {
      const created = createExample({ name: "Test", email: "test@example.com" });
      expect(getExampleById(created.id)).toEqual(created);
    });
  });

  describe("createExample", () => {
    it("should create example with auto-incrementing ID", () => {
      const first = createExample({ name: "Test1", email: "test1@example.com" });
      const second = createExample({
        name: "Test2",
        email: "test2@example.com",
      });
      expect(second.id).toBe(first.id + 1);
    });

    it("should create example with ISO timestamps", () => {
      const before = Date.now();
      const example = createExample({ name: "Test", email: "test@example.com" });
      const after = Date.now();
      const created = Date.parse(example.createdAt);
      expect(created).toBeGreaterThanOrEqual(before);
      expect(created).toBeLessThanOrEqual(after);
      expect(example.createdAt).toBe(example.updatedAt);
    });
  });

  describe("updateExample", () => {
    it("should return null for non-existent example", () => {
      expect(updateExample(999, { name: "Updated" })).toBeNull();
    });

    it("should update existing example", () => {
      const created = createExample({
        name: "Test",
        email: "test@example.com",
        age: 25,
      });
      const updated = updateExample(created.id, { name: "Updated", age: 30 });
      expect(updated?.name).toBe("Updated");
      expect(updated?.age).toBe(30);
      expect(updated?.email).toBe("test@example.com");
    });

    it("should advance updatedAt timestamp", async () => {
      const created = createExample({ name: "Test", email: "test@example.com" });
      await new Promise((resolve) => setTimeout(resolve, 10));
      const updated = updateExample(created.id, { name: "Updated" });
      expect(Date.parse(updated?.updatedAt ?? "")).toBeGreaterThan(Date.parse(created.updatedAt));
    });
  });

  describe("deleteExample", () => {
    it("should return false for non-existent example", () => {
      expect(deleteExample(999)).toBe(false);
    });

    it("should delete existing example", () => {
      const created = createExample({ name: "Test", email: "test@example.com" });
      expect(deleteExample(created.id)).toBe(true);
      expect(getExampleById(created.id)).toBeNull();
    });

    it("should remove example from getAll", () => {
      const created = createExample({ name: "Test", email: "test@example.com" });
      deleteExample(created.id);
      expect(getAllExamples().length).toBe(0);
    });
  });
});
