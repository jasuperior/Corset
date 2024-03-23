import {
    Path,
    Patch,
    assertCantSetReferences,
    deleteSlice,
    CURRENT,
    DRAFT,
    ORIGINAL,
    PATCHES,
    Controllable,
} from "./matter.types";

export const Draft = <T extends Record<any, any>>(
    original: T
): Controllable<T> => {
    let patches = new Map<Path, Patch>();
    let isArray = Array.isArray(original) || original instanceof Array;
    let deleted = new Set();
    //not sure if this should operate on a copy or the original. think it might be ok to mutate the orginal
    //NOTE: we change this from Object.create(original) to original to allow for the draft to be mutated. but maybe we shouldnt do this. 
    return new Proxy(original, {
        get(target, prop, receiver) {
            switch (prop) {
                case DRAFT:
                    return true;
                case CURRENT:
                    return target;
                case ORIGINAL:
                    return original;
                case PATCHES:
                    return [...patches.values()];
            }
            return Reflect.get(target, prop, receiver);
        },
        set(target, prop, value, receiver) {
            assertCantSetReferences(prop);
            let patch;
            if (Reflect.has(original, prop) && target[prop] !== null) {
                // console.log("updating", target)
                patch = Patch.update(
                    prop,
                    value,
                    Reflect.get(target, prop, receiver)
                );
                if (isArray) {
                    if (prop === "length") {
                        if (value < target.length && value >= original.length) {
                            deleteSlice(patches, value, target.length);
                        }
                    }
                }
            } else {
                patch = Patch.add(prop, value);
                deleted.delete(prop);
            }
            patches.set(prop, patch);
            return Reflect.set(target, prop, value, receiver);
        },
        deleteProperty(target, prop) {
            assertCantSetReferences(prop);

            if (Reflect.has(original, prop)) {
                patches.set(
                    prop,
                    Patch.remove(prop, Reflect.get(target, prop))
                );
                Reflect.set(target, prop, null);
                return true;
            } else {
                patches.delete(prop);
            }
            // console.log("delte props", patches)
            return Reflect.deleteProperty(target, prop);
        },
    }) as Controllable<T>;
};
export const patches = <T extends Record<any, any>>(draft: Controllable<T>) => {
    return draft[PATCHES];
};
export const original = <T extends Record<any, any>>(
    draft: Controllable<T>
) => {
    return draft[ORIGINAL] || draft;
};
export const current = <T extends Record<any, any>>(draft: Controllable<T>) => {
    return draft[CURRENT] || draft;
};
export const commit = <T extends Record<any, any>>(
    currentDraft: Controllable<T>
) => {
    return [Draft(current(currentDraft)), patches(currentDraft)] as const;
};
