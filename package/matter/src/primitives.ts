import { Controllable, Patch, TYPE } from "./matter.types";
import { Actor, Puppet } from "./draft";
import { Detectable, createUnitAccessor, unit, when } from "@corset/time";
import { get, place, set } from "@corset/space";

export const project = <T extends Controllable.Value<any, any>, U>(
    prtx: Controllable.Projection<T, U>
) => {
    let entries = get<[Controllable.Key<T>, Controllable.Member<T>][]>(
        "entries",
        2
    );
    let patches = get<Detectable.Unit<Patch[]>>("patches")!;
    if (!entries) return unit<U>(prtx(Patch.done())!);
    let index = new Map();
    for (let [key, value] of entries) {
        index.set(key, prtx(Patch.add(key, value)) ?? value);
    }
    let value = prtx(Patch.done());
    let u = unit<U>();
    if (value) u(value);

    when(() => {
        if (patches().length > 0) {
            patches().forEach((patch) => {
                patch.last = index.get(patch.path);
                index.set(patch.path, prtx(patch) ?? patch.value);
            });
        }
        let value = prtx(Patch.done());
        if (value !== undefined) u(value);
    });

    return u; //probably shouldnt cause change and shouldnt be a unit.
};

/**
 * Creates a template string unit. The unit will update when the values of the units in the template string change.
 * @param constant - The template string array.
 * @param args - The units to be interpolated into the template string.
 * @returns A unit that represents the template string.
 */
export const templ = (constant: TemplateStringsArray, ...args: any) => {
    let u = unit("");
    when(() => {
        u(
            constant.reduce((acc, curr, index) => {
                if (args[index] instanceof unit) {
                    return acc + curr + args[index]();
                }
                return acc + curr + (args[index] ?? "");
            }, "")
        );
    });
    return u;
};

/**
 * Creates a controllable system of values. A system can be formed from a Map or an Object.
 * A system allows for the controlled mutation of its values.
 * @param value - The value to be controlled.
 * @returns A controllable unit.
 */
export const system = <T extends Controllable.Value<any, any>>(value: T) => {
    let Constructor = value instanceof Map ? Actor : Puppet;
    let draft: Controllable<T>;
    let u = unit(value, (newValue) => value === newValue);
    let patches = unit<Patch[]>([]);
    when(() => {
        //@ts-expect-error: the class constructor is correct as per the condition above.
        draft = new Constructor(u() as any);
    });
    let accessor = createUnitAccessor<Controllable.Mutation<T>>(
        (mtx?: Controllable.Mutation<T>) => {
            if (mtx) {
                if (mtx(draft.proxy)) {
                    patches([...draft.commit()]);
                    // patches([])
                    return u(draft.original);
                }
            }
            return u();
        },
        new Set()
    ) as unknown as Controllable.Unit<T>;

    accessor.as = place(
        <U extends any>(prtx: Controllable.Projection<T, U>) => {
            set("entries", draft.entries());
            set("patches", patches);
            return project(prtx) as Detectable.Unit<U>;
        }
    ) as Controllable.Unit<T>["as"];

    accessor[TYPE] = "unit";
    return accessor as Controllable.Unit<T>;
};
