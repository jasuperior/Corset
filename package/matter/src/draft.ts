import {
    Patch,
    assertCantSetReferences,
    deleteSlice,
    Controllable,
} from "./matter.types";

export type Accessor = Pick<
    typeof Reflect,
    "get" | "has" | "deleteProperty" | "set"
>;
export class Puppet<
    T extends Record<any, any> = any,
    U extends T & Record<any, any> = any
> implements Controllable<T, U>
{
    draft: U;
    proxy: U;
    patches = new Map<keyof T, Patch>();
    #isDrafting = false;
    readonly isArray;
    constructor(public original: T, public accessor: Accessor = Reflect) {
        this.isArray =
            Array.isArray(this.original) || this.original instanceof Array;
        this.draft = Object.create(original);
        this.proxy = new Proxy(this.original, {
            get: (target, prop, receiver) => {
                let value =
                    this.accessor.get(this.draft, prop, receiver) ||
                    this.accessor.get(this.original, prop, receiver);
                if (value !== null) {
                    return value;
                }
            },
            set: (target, prop, value, receiver) => {
                assertCantSetReferences(prop);
                this.#isDrafting = true;
                let patch;
                let currentValue = this.accessor.get(this.original, prop);
                // &&this.accessor.get(this.next, prop);
                if (currentValue !== undefined) {
                    // console.log("updating", target)
                    patch = Patch.update(
                        prop,
                        value,
                        this.accessor.get(this.original, prop)
                    );
                    if (this.isArray) {
                        if (prop === "length") {
                            if (
                                value < this.draft.length! &&
                                value >= this.original.length
                            ) {
                                deleteSlice(
                                    this.patches,
                                    value,
                                    this.draft.length!
                                );
                            }
                        }
                    }
                } else {
                    patch = Patch.add(prop, value);
                }
                this.patches.set(prop, patch);
                return this.accessor.set(this.draft, prop, value, receiver);
            },
            deleteProperty: (target, prop) => {
                assertCantSetReferences(prop);
                this.#isDrafting = true;
                if (this.accessor.has(this.original, prop)) {
                    this.patches.set(
                        prop,
                        Patch.remove(prop, this.accessor.get(this.draft, prop))
                    );
                    // this.accessor.set(this.next, prop, null);
                    return true;
                } else {
                    this.patches.delete(prop);
                }
                // console.log("delte props", patches)
                return this.accessor.deleteProperty(this.draft, prop);
            },
        });
    }
    commit() {
        let patches = [...this.patches.values()];
        let length: number;
        for (let { type, path, value } of patches) {
            if (path === "length") {
                length = value;
            }
            if (type === "remove") {
                this.accessor.deleteProperty(this.original, path);
            } else {
                this.accessor.set(this.original, path, value);
            }
        }
        if (length! !== undefined) {
            //@ts-expect-error: if length has a patch, length must be defined.
            this.original.length! = length;
        }
        this.patches.clear();
        this.#isDrafting = false;
        return patches;
    }

    entries(): [Controllable.Key<T>, Controllable.Member<T>][] {
        return Object.entries(this.original) as any;
    }
    get drafting() {
        return this.#isDrafting;
    }
}

export class Actor<
    T extends Map<any, any> = any,
    U extends T & Map<any, any> = any
> implements Controllable<T, U>
{
    draft: U;
    proxy: U;
    patches = new Map<keyof T, Patch>();
    #isDrafting = false;
    constructor(public original: T, public accessor: Accessor = Reflect) {
        this.draft = new Map() as U;
        this.proxy = new MapProxy(this.original, this.patches) as unknown as U;
    }
    commit() {
        let patches = [...this.patches.values()];
        for (let { type, path, value } of patches) {
            if (type === "remove") {
                this.original.delete(path);
            } else {
                this.original.set(path, value);
            }
        }
        this.patches.clear();
        this.#isDrafting = false;
        return patches;
    }
    entries(): [Controllable.Key<T>, Controllable.Member<T>][] {
        return [...this.original.entries()] as any;
    }
    get drafting() {
        return this.#isDrafting;
    }
}

export class MapProxy<T = any, V = any> extends Map<T, V> {
    #isDrafting = false;
    constructor(public original: Map<T, V>, public patches: Map<T, Patch>) {
        super();
    }
    get(key: T): V | undefined {
        let value = super.get(key) || this.original.get(key);
        if (value !== null) {
            return value;
        }
        return;
    }
    set(prop: T, value: V): this {
        this.#isDrafting = true;
        let patch;
        let currentValue = this.original.get(prop);
        // &&this.accessor.get(this.next, prop);
        if (currentValue !== undefined) {
            // console.log("updating", target)
            if (Object.is(value, currentValue)) {
                if (this.patches.has(prop)) {
                    super.delete(prop);
                    this.patches.delete(prop);
                }
                return this;
            }
            patch = Patch.update(prop, value, this.original.get(prop));
        } else {
            patch = Patch.add(prop, value);
        }
        this.patches.set(prop, patch);
        return super.set(prop, value);
    }
    delete(prop: T): boolean {
        this.#isDrafting = true;
        if (this.original.has(prop)) {
            this.patches.set(prop, Patch.remove(prop, this.original.get(prop)));
            return true;
        } else {
            this.patches.delete(prop);
        }
        // console.log("delte props", patches)
        return super.delete(prop);
    }
    has(key: T): boolean {
        return this.original.has(key) || super.has(key);
    }
}
