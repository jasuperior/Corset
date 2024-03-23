import { unit, when } from "@corset/time";
import { Draft, commit } from "./draft";
import { Controllable, Patch } from "./matter.types";
import htm from "htm";
const collection = <T extends any[]>(
    value: T,
    handler?: Controllable.Handler<T>
) => {
    let draft: Controllable<T>;
    let changes = unit<Patch[]>([]);
    let u = unit<T>(value);
    when(() => {
        draft = Draft(u());
    });

    when(() => {
        if (changes().length) {
            changes().forEach((patch) => {
                handler?.[patch.op](patch.path, patch.value);
            });
            changes([]);
        }
    });
    return (mutx?: Controllable.Mutation<T>) => {
        if (mutx) {
            mutx(draft);
            let [newDraft, patches] = commit(draft);
            changes(patches);
            draft = newDraft;
            return u(); //is there a way to only return patches isntead of the whole draft?
        }
        return u();
    };
};

const element = (tag: any, props: any, ...children: any[]) => {
    return { tag, props, children };
};
let c = collection([1, 2, 3], {
    add: (path, value) => {
        console.log("add", path, value);
    },
    remove: (path, value) => {
        console.log("remove", path, value);
    },
    update: (path, value) => {
        console.log("update", path, value);
    },
});

let html = htm.bind(element);

html`
    <${Symbol()} ${[1,2,3]}>
        ${c}
        ${[]}
    </$>`; //?
