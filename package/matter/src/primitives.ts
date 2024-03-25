import {
    Detectable,
    Signal,
    createUnitAccessor,
    event,
    moment,
    product,
    unit,
    when,
} from "@corset/time";
import { Compound, Controllable, Patch } from "./matter.types";
import { Actor, MapProxy, Puppet } from "./draft";
import { get, place, set, space } from "@corset/space";

const project = <T extends Controllable.Value<any, any>, U>(
    prtx: Controllable.Projection<T, U>
) => {
    let entries = get<[Controllable.Key<T>, Controllable.Member<T>][]>(
        "entries",
        2
    );
    let patches = get<Detectable.Unit<Patch[]>>("patches")!; //?
    if (!entries) return unit<U>(prtx(new Patch("done", ""))!);
    for (let [key, value] of entries) {
        prtx(new Patch("add", key, value));
    }
    let value = prtx(new Patch("done", ""));
    let u = unit<U>();
    if (value) u(value);

    when(() => {
        if (patches().length > 0) {
            patches().forEach((patch) => {
                let v = prtx(patch);
                if (v) {
                    u(v);
                }
            });
        }
    });

    return u; //probably shouldnt cause change and shouldnt be a unit.
};


const templ = (constant: TemplateStringsArray, ...args: any) => {
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

let system = <T extends Controllable.Value<any, any>>(value: T) =>
    place(() => {
        let Constructor = value instanceof Map ? Actor : Puppet;
        let draft: Controllable<T>;
        let u = unit(value, (newValue) => value === newValue);
        let patches = unit<Patch[]>([]);

        set("draft", u);
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

        accessor.as = <U>(prtx: Controllable.Projection<T, U>) => {
            set("entries", draft.entries());
            set("patches", patches);
            return project(prtx);
        };
        return accessor;
    });
let member = <T extends Controllable.Value<any, any>>(value: T) => space(() => {

});
let c = system<any[]>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
let map = new Map();
