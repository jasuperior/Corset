export const DRAFT = Symbol("draft");
export const ORIGINAL = Symbol("original");
export const CURRENT = Symbol("current");
export const PATCHES = Symbol("patches");

export type Controllable<T extends Record<any, any>, U extends T = any> = T & {
    [DRAFT]: true;
    [CURRENT]: U;
    [ORIGINAL]: T;
    [PATCHES]: Patch[];
};
export namespace Controllable {
    export const isDraft = (value: any): value is Controllable<any> => {
        return !!(value && value[DRAFT]);
    };
    export type Mutation<T extends Record<any, any>> = (
        draft: Controllable<T>
    ) => void;
    export type Handler<T> = {
        [Key in PatchOp]: (path: Path, value?: T) => void;
    };
}
export type PatchOp = "add" | "remove" | "update";
export type Path = string | number;
export interface Patch<T extends PatchOp> {
    op: T;
    path: Path;
    value?: any;
    last?: any;
}

export class Patch<T extends PatchOp = PatchOp> {
    constructor(op: T, path: Path, value?: any, last?: any) {
        this.op = op;
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
export class Is extends Boolean {
    constructor(public label: string, public value: boolean) {
        super(value);
    }
    [Symbol.toPrimitive]() {
        return this.value;
    }
    static deleted = new Is("deleted", false);
    static Draft = new Is("draft", false);
    static Original = new Is("original", false);
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
