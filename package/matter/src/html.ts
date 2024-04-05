import {
    $here,
    Step,
    bottom,
    define,
    drag,
    get,
    goto,
    head,
    here,
    mark,
    next,
    now,
    place,
    prev,
    pull,
    recall,
    remove,
    set,
    tail,
    to,
    top,
} from "@corset/space";
import { Detectable, when } from "@corset/time";
import { Controllable } from "./matter.types";
import { system } from "./primitives";
type Styles = Omit<
    CSSStyleDeclaration,
    | "length"
    | "parentRule"
    | "getPropertyPriority"
    | "getPropertyValue"
    | "item"
    | "removeProperty"
    | "setProperty"
    | number
    | typeof Symbol.iterator
>;
const element = (tag: string | TemplateStringsArray) =>
    place((props: any, ...children: any[]) => {
        let element = document.createElement(tag.toString());
        style(element, props.style || {});
        props.style && delete props.style;
        attributes(element, props);
        children.forEach((child) => appendChild(element, child));
        return element;
    });
const text = (content: string) => document.createTextNode(content);
const style = (element: HTMLElement, props: Styles) => {
    for (const [style, value] of Object.entries(props) as [
        keyof Styles,
        any
    ][]) {
        if (Detectable.isUnit(value)) {
            when(() => {
                element.style[style] = value() as string;
            });
        } else {
            element.style[style] = value;
        }
    }
};
const attributes = (element: HTMLElement, props: any) => {
    for (const [attr, value] of Object.entries(props) as [string, any][]) {
        if (Detectable.isUnit(value)) {
            when(() => {
                element.setAttribute(attr, value()?.toString() || "");
            });
        } else {
            element.setAttribute(attr, value);
        }
    }
};

const appendChild = (element: HTMLElement, child: any): any => {
    if (Controllable.isUnit(child)) {
        set(
            child,
            child.as(
                place((patch) => {
                    if (patch.type === "add") {
                        return appendChild(element, patch.value);
                    } else if (patch.type === "remove") {
                        removeChild(element, patch.last);
                        return;
                    } else if (patch.type === "update") {
                        if (patch.path === "length") {
                            set("length", patch.value);
                            return;
                        }
                        let newChild =
                            patch.value instanceof Node
                                ? patch.value
                                : text(patch.value);
                        element.replaceChild(newChild, patch.last);
                        return newChild;
                    } else {
                        if (!get("node")) {
                            set("node", $here());
                        }
                    }
                })
            )
        );
        let cursor = prev<any>(true);
    } else if (Detectable.isUnit(child)) {
        when(() => {
            appendChild(element, child());
        });
    } else if (Array.isArray(child)) {
        return child.map((kid) => appendChild(element, kid));
    } else if (typeof child === "string") {
        return appendChild(element, text(child)) as Text;
    } else if (child instanceof HTMLElement || child instanceof Text) {
        // console.log(child)
        if (get("node")) {
            let node = get<Step>("node")!;
            let { prev, next } = node;
            if (next && isElement(next.value)) {
                next.value.before(child);
                to(child);
                set(child, mark());
                return child;
            }
        }

        element.appendChild(child);
        to(child);
        set(child, mark());

        return child as HTMLElement | Text;
    }
};
const removeChild = (element: HTMLElement, child: Node): any => {
    element.removeChild(child);
    goto(get(child)!);
    pull();
    remove(child);
};
const isElement = (child: any): child is HTMLElement => {
    return child instanceof HTMLElement || child instanceof Text;
};
// const replaceChild = (element: HTMLElement, child: any): any => {
//     if (Controllable.isUnit(child)) {
//         console.log("is a unit");
//         child.as((patch) => {
//             console.log("patching")
//             if (patch.type === "add") {
//                 console.log(patch.value);
//                 return appendChild(element, patch.value);
//             } else if (patch.type === "remove") {
//                 element.removeChild(patch.last);
//             } else if (patch.type === "update" && patch.path !== "length") {
//                 return replaceChild(patch.value, patch.last);
//             } else {
//                 console.log(patch);
//             }
//             return child;
//         });
//     } else if (Detectable.isUnit(child)) {
//         when(() => {
//             appendChild(element, child());
//         });
//     } else if (Array.isArray(child)) {
//         return child.map((kid) => appendChild(element, kid));
//     } else if (typeof child === "string") {
//         return appendChild(element, text(child)) as Text;
//     } else if (child instanceof HTMLElement || child instanceof Text) {
//         element.appendChild(child);
//         return child as HTMLElement | Text;
//     }
// };
const createElement = (tag: string, props: any, ...children: any[]) => {
    return element(tag)(props, ...children);
};

let kids = system(["hello", "world", "goodbye", "planet"]);
// let kids2 = system([""])
let e = element`div`({}, "first : ", kids, " : last", kids, " -- just some words  -- ");
e.outerHTML; //?

kids((draft) => {
    draft.splice(0, 3);
    return true;
});
kids((draft) => {
    draft.push(" my", "world");
    return true;
});
// kids((draft) => {
//     draft[0] = "goodbye ";
//     return true;
// });
e.outerHTML; //?
