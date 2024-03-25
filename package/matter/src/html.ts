import { place } from "@corset/space";
import { Detectable, when } from "@corset/time";
import h from "htm";

const element = (tag: string) =>
    place((props: any, ...children: any[]) => {
        let element = document.createElement(tag);
        style(element, props.style || {});
        props.style && delete props.style;
        attributes(element, props);
        children.forEach(appendChild);
    });
const text = (content: string) => document.createTextNode(content);
const style = (element: HTMLElement, props: Partial<CSSStyleDeclaration>) => {
    for (const [style, value] of Object.entries(props) as [
        keyof Partial<CSSStyleDeclaration>,
        any
    ][]) {
        if (Detectable.isUnit(value)) {
            when(() => {
                element.style[style] = value();
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

const appendChild = (element: HTMLElement, child: any) => {
    if (child instanceof HTMLElement || child instanceof Text) {
        element.appendChild(child);
        return child as HTMLElement | Text;
    } else if (Detectable.isUnit(child)) {
        when(() => {
            appendChild(element, child());
        });
    } else if (typeof child === "string") {
        return appendChild(element, text(child)) as Text;
    }
};
const createElement = (tag: string, props: any, ...children: any[]) => {
    return element(tag)(props, ...children);
};

export const html = h.bind(createElement);
