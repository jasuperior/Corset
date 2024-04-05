import { describe, expect, jest, test } from "@jest/globals";
import { product, unit, event, when, how } from "../src/primitives";
import exp from "constants";

describe("Detectable Units", () => {
    describe("unit", () => {
        test("creates a reactive value with a getter setter interface", () => {
            let u = unit(0);
            expect(u()).toBe(0);
            u(1);
            expect(u()).toBe(1);
        });
        test("can optionally define a comparison function", () => {
            let u = unit(0, (curr, last) => curr > last || curr == 0);
            expect(u(0)).toBe(0);
            expect(u(2)).toBe(2);
            expect(u(1)).toBe(2);
        });
        describe("when given a promise", () => {
            test("awaits the promise and sets the value to the resolved value", async () => {
                expect.assertions(2);
                let promise = Promise.resolve(1);
                let u = unit(promise);
                expect(u()).toBe(null);
                await promise.then(() => {
                    expect(u()).toBe(1);
                });
            });
        });
    });

    describe("product", () => {
        test("creates a reactive value that is the product of other reactive values", () => {
            let a = unit(2);
            let b = unit(3);
            let p = product(() => a() * b());
            expect(p()).toBe(6);
            a(3);
            expect(p()).toBe(9);
        });
        test("can be used to create a reactive value that is the product of a constant and a reactive value", () => {
            let a = unit(2);
            let b = product(() => a() * 3);
            expect(b()).toBe(6);
            a(3);
            expect(b()).toBe(9);
        });
        test("can optionally be bidirectional", () => {
            let a = unit(2);
            let b = product(
                () => a() * 3,
                (value) => a(value / 3)
            );
            expect(b()).toBe(6);
            b(9);
            expect(a()).toBe(3);
        });
    });

    describe("event", () => {
        test("creates a unit over a callback", () => {
            let e = event((value: number) => value + 1);
            expect(e(1)).toBe(2);
        });
    });
});

describe("Detectable Operations", () => {
    describe("when", () => {
        test("implicitly runs when defined", () => {
            let cb = jest.fn();
            when(cb as any);
            expect(cb).toBeCalledTimes(1);
        });
        test("runs whenever a unit in the callback changes", () => {
            let u = unit(0);
            let cb = jest.fn(() => u());
            when(cb as any);
            expect(cb).toBeCalledTimes(1);
            u(1);
            expect(cb).toBeCalledTimes(2);
        });
        test("runs even if unit is called in a conditional", () => {
            let a = unit(0);
            let b = unit("jupiter");
            let cb = jest.fn(() => (a() ? b() : "hello"));
            when(cb as any);
            expect(cb).toBeCalledTimes(1);
            b("venus");
            a(1);
            expect(cb).toBeCalledTimes(2);
            b("mars");
            expect(cb).toBeCalledTimes(3);
        });
        test("returns an unsubscribe function", () => {
            let u = unit(0);
            let cb = jest.fn(() => u());
            let unsub = when(cb as any);
            expect(cb).toBeCalledTimes(1);
            unsub();
            u(1);
            expect(cb).toBeCalledTimes(1);
        });
    });

    describe("how", () => {
        test("subscribes to yielded units in the order they are received", () => {
            const u = unit(0);
            how(function* () {
                expect(yield u).toBe(1);
                expect(yield u).toBe(2);
                expect(yield u).toBe(3);
            });
            expect(u()).toBe(0);
            u(1);
            u(2);
            u(3);
        });
        test("starts over once the generator is complete", () => {
            const u = unit(0);
            let cursor = 0;
            how(function* () {
                expect(yield u).toBe(++cursor);
                expect(yield u).toBe(++cursor);
                expect(yield u).toBe(++cursor);
            });
            expect(u()).toBe(0);
            u(1);
            u(2);
            u(3);
            u(4);
            expect(u()).toBe(4);
            expect(cursor).toBe(4);
        });

        test("returns an unsubscribe function", () => {
            expect.assertions(2);
            let u = unit(0);
            let unsub = how(function* () {
                yield u;
                expect(u()).toBe(1);
            });
            expect(unsub).toBeInstanceOf(Function);
            expect(u()).toBe(0);
            unsub();
            u(1);
        });

        describe("when an operator is yielded", () => {
            test("unsubscribes to them when it restarts", () => {
                let yielded = unit(0),
                    detected = unit(0);
                let yields = 0;
                let spy = jest.fn(() => {
                    detected();
                });
                how(function* () {
                    yields++;
                    expect(yield yielded).toBe(yields);
                    yield when(spy);
                    yield yielded;
                    yields++;
                });
                expect(spy).toBeCalledTimes(0);
                yielded(1);
                expect(spy).toBeCalledTimes(1);
                detected(1);
                detected(2);
                expect(spy).toBeCalledTimes(3);
                yielded(2);
                expect(spy).toBeCalledTimes(3);
                detected(3);
                expect(spy).toBeCalledTimes(3);
            });
        });
    });


});
