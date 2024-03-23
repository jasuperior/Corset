import { describe, expect, test } from "@jest/globals";
import { Fiber } from "../src/fiber";
describe("Fiber", () => {
    describe("#append", () => {
        test("should add a value to the tail of the fiber", () => {
            let fiber = new Fiber();
            expect(fiber.tail).toBeNull();
            fiber.append(1);
            expect(fiber.tail?.value).toBe(1);
        });
        test("should add value to head when one doesnt exist", () => {
            let fiber = new Fiber();
            expect(fiber.head).toBeNull();
            fiber.append(1);
            expect(fiber.head?.value).toBe(1);
        });
    });
    describe("#prepend", () => {
        test("should add a value to the head of the fiber", () => {
            let fiber = new Fiber();
            expect(fiber.head).toBeNull();
            fiber.prepend(1);
            expect(fiber.head?.value).toBe(1);
        });
        test("should add value to tail when one doesnt exist", () => {
            let fiber = new Fiber();
            expect(fiber.tail).toBeNull();
            fiber.prepend(1);
            expect(fiber.tail?.value).toBe(1);
        });
    });

    describe("#unappend", () => {
        test("should remove the tail of the fiber", () => {
            let fiber = new Fiber([1, 2, 3]);
            expect(fiber.tail?.value).toBe(3);
            fiber.unappend();
            expect(fiber.tail?.value).toBe(2);
        });
    });

    describe("#unprepend", () => {
        test("should remove the head of the fiber", () => {
            let fiber = new Fiber([1, 2, 3]);
            expect(fiber.head?.value).toBe(1);
            fiber.unprepend();
            expect(fiber.head?.value).toBe(2);
        });
    });

    describe("#after", () => {
        test("should add a value after the current value", () => {
            let fiber = new Fiber([1, 2, 3]);
            fiber.prev();
            fiber.after(4);
            expect(fiber.now?.value).toBe(4);
            expect(fiber.now?.prev?.value).toBe(2);
            expect(fiber.now?.next?.value).toBe(3);
        });
    });

    describe("#before", () => {
        test("should add a value before the current value", () => {
            let fiber = new Fiber([1, 2, 3]);
            fiber.before(4);
            expect(fiber.now?.value).toBe(4);
            expect(fiber.now?.prev?.value).toBe(2);
            expect(fiber.now?.next?.value).toBe(3);
        });
    });

    describe("#[iterator]", () => {
        test("should iterate over the fiber", () => {
            let fiber = new Fiber([1, 2, 3]);
            let values = [...fiber];
            expect(values).toEqual([1, 2, 3]);
        });
    });
});
