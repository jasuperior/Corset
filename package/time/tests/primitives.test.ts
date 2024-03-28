import { describe, expect, jest, test } from "@jest/globals";
import {
    moment,
    product,
    unit,
    event,
    when,
    whenever,
} from "../src/primitives";

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
                let u = unit(Promise.resolve(1));
                expect(u()).toBe(null);
                await u;
                expect(u()).toBe(1);
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

    describe("moment", () => {
        test("creates a getter setter", () => {
            let m = moment();
            expect(m()).toBe(undefined);
            m(1);
            expect(m()).toBe(1);
        });
        test("value can only be set once", () => {
            let m = moment();
            m(1);
            m(2);
            expect(m()).toBe(1);
        });
        test("value can be awaited", async () => {
            let m = moment();
            setTimeout(() => m(1), 100);
            let start = Date.now();
            await m;
            let end = Date.now();
            expect(m()).toBe(1);
            expect(end - start).toBeCloseTo(100, -10);
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

    describe("whenever", () => {
        test("like when, but async", async () => {
            // expect.assertions(3);
            let a = unit(0);
            let b = unit(0);
            let m = moment();
            let oper = whenever(async () => {
                let awaited = await m;
                expect(awaited).toBe(1);
                expect(a()).toBe(1);
                b(100);
            });
            a(1);
            m(1);
            expect(b()).toBe(0);
            await oper;
            expect(b()).toBe(100);
        });
    });
    test("returns the promise of an unsubscription function", () => {
        let oper = whenever(async () => {});
        return oper.then(async (unsub) => {
            expect(unsub).toBeInstanceOf(Function);
        });
    });
});
