import { Detectable } from "@corset/time";

export const DRAFT = Symbol("draft");
export const ORIGINAL = Symbol("original");
export const CURRENT = Symbol("current");
export const PATCHES = Symbol("patches");

export interface Controllable<
    T extends Controllable.Value<any, any>,
    U extends T = any
> {
    original: T;
    draft: U;
    proxy: U;

    commit(): Patch[];
    entries(): [Controllable.Key<T>, Controllable.Member<T>][];
}
export namespace Controllable {
    export type Value<T, U> = T extends string | symbol | number
        ? Map<T, U> | Record<T, U>
        : Map<T, U>;
    export type Mutation<T extends Value<any, any>> = (
        draft: T & Value<any, any>
    ) => boolean | void;
    export type Projection<T extends Value<any, any>, U = any> = (
        draft: Patch<any, Member<T>>
    ) => U | void;

    export type Member<T extends Value<any, any>> = T extends Array<infer U>
        ? U
        : T extends Value<any, infer U>
        ? U
        : never;
    export type Key<T extends Value<any, any>> = T extends Array<infer U>
        ? number
        : T extends Value<infer U, any>
        ? U
        : never;
    export type Unit<T extends Value<any, any>> = ((mutx: Mutation<T>) => T) & {
        as: <U>(prtx: Projection<T, U>) => Detectable.Unit<U>;
    };
}
export type PatchOp = "add" | "remove" | "update" | "done";
export type Path = any;
export interface Patch<T extends PatchOp, Value = any> {
    type: T;
    path: Path;
    value?: Value;
    last?: Value;
}

export class Patch<T extends PatchOp = PatchOp> {
    constructor(op: T, path: Path, value?: any, last?: any) {
        this.type = op;
        this.path = path;
        this.value = value;
        this.last = last;
    }
    static add(path: Path, value: any) {
        return new Patch("add", path, value);
    }
    static remove(path: Path, value?: any) {
        return new Patch("remove", path, value);
    }
    static update(path: Path, value: any, last?: any) {
        return new Patch("update", path, value, last);
    }
    static isPatch(value: any): value is Patch<any> {
        return value instanceof Patch;
    }
}

export function assertCantSetReferences(
    prop: Path | symbol
): asserts prop is Path {
    if (prop === DRAFT || prop === ORIGINAL || prop === PATCHES) {
        throw new Error(`Cannot set reference properties`);
    }
}
export function deleteSlice(target: Map<any, any>, start: number, end: number) {
    for (let i = start; i < end; i++) {
        target.delete(i.toString());
    }
}

export type Compound<T extends Record<any, any>> = Detectable.Unit<T>;
