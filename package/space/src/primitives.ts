import { Deposit } from "./deposit";
import { Fiber } from "./fiber";
import { Scope, Walkable } from "./space.types";

const common = {
    globe: new Fiber(),
    world: new Map() as Walkable.Plain,
};
const scope = new Deposit<Walkable.Space>(common.globe); //holds the scope of the highest function call
const locale: Walkable.Globe = new Fiber<Walkable.Space>([common.globe]);
const world: Walkable.World = new Fiber<Walkable.Plain>([common.world]);

export const head = <T, U extends boolean = false>(getNode: U = false as U) => {
    let { head } = scope.now!;
    return head?.value as T;
};
export const tail = <T>(getNode?: boolean) => {
    let { tail } = scope.now!;
    return tail?.value as T;
};
export const here = <T>() => {
    let { now } = scope.now!;
    return now?.value as T;
};

export const top = <T>(move?: boolean) => {
    let { value: local } = locale.now!;
    if (move) local.point(local.head);
    return local.head?.value as T;
};
export const bottom = <T>(move?: boolean) => {
    let { value: local } = locale.now!;
    if (move) local.point(local.tail);
    return local.tail?.value as T;
};
export const now = <T>() => {
    let { value: local } = locale.now!;
    return local.now?.value as T;
};

export const next = <T>(move?: boolean) => {
    let { value: local } = locale.now!;
    return move ? local.next() : (local.now?.next?.value as T);
};
export const prev = <T>(move?: boolean) => {
    let { value: local } = locale.now!;
    return move ? local.prev() : (local.now?.prev?.value as T);
};
export const to = <T>(value: T) => {
    let { value: local } = locale.now!;
    local.postfix(local.now, value);
    return value;
};
export const from = <T>(value: T) => {
    let { value: local } = locale.now!;
    local.prefix(local.now, value);
    return value;
};

export const prepend = <T>(value: T) => {
    return goto(top), from(value);
};
export const append = <T>(value: T) => {
    return goto(bottom), to(value);
};
export const goto = <T>(point: typeof top) => {
    return point<T>(true);
};
export const expose = <T>(label: any) => {
    let { value: local } = locale.now!;
    let now = mark<T>(label);
    common.world.set(label, Fiber.from(local.now, local.head, local.tail));
    return now;
};
export const mark = <T>(label?: any) => {
    let { value: local } = locale.now!;
    let { now } = local;
    if (label) {
        world.now!.value.set(
            label,
            Fiber.from(local.now, local.head, local.tail)
        );
    }
    return (move?: boolean) =>
        move ? local.point(now)?.value : (now as Walkable.Step<T>)?.value;
};

export const recall = <T>(label: any) => {
    let { value: local } = locale.now!;
    let plain = world.now;
    while (plain) {
        //replace with an iterator function when i get a chance
        let fiber = plain.value.get(label);
        if (fiber) {
            return local.point(fiber.now)?.value as T;
        }
        plain = plain.prev;
    }
};

export const get = <T>(label: any, depth: number = 1) => {
    let { value: local } = locale.now!;
    let plain = world.now;
    for (let i = 0; i < depth && plain; i++) {
        let fiber = plain.value.get(label);
        if (fiber) {
            return local.point(fiber.now)?.value as T;
        }
        plain = plain.prev;
    }
};

export const set = <T>(label: any, value: T, depth: number = 1) => {
    if (get(label, depth)) {
        pull();
    }
    to(value);
    mark(label);
};
/**
 * define a value as a constant within the current scope
 * mostly useful for the persistent space of a place.
 */
export const define = <T>(label: any, value: T) => {
    return get(label) ?? set(label, value);
};
export const drag = <T>() => {
    let { value: local } = locale.now!;
    let { now } = local;
    if (now) {
        let { prev, next } = now;
        local.remove(now);
        local.point(now);
        prev ? local.point(prev) : local.point(next);
    }
    return now?.value as T;
};
export const pull = <T>() => {
    let { value: local } = locale.now!;
    let { now } = local;
    if (now) {
        let { prev, next } = now;
        local.remove(now);
        local.point(now);
        next ? local.point(next) : local.point(prev);
    }
    return now?.value as T;
};

export const clear = <T>() => {
    let { value: local } = locale.now!;
    let { head, tail } = local;
    while (head) {
        local.remove(head);
        local.point(head);
    }
    return local.now?.value as T;
};
export const space = <T = any>(cb: Scope<T>) => {
    locale.append(new Fiber());
    world.append(new Map());
    scope.lock(locale.now?.value!);
    let result = cb();
    if (result instanceof Promise) {
        result.then((value) => {
            scope.release();
            world.unappend();
            locale.unappend();
            return value;
        });
    } else {
        scope.release();
        world.unappend();
        locale.unappend();
    }
    return result;
};

export const place = <T extends Scope>(cb: T) => {
    let map = new Map();
    return (...args: Parameters<T>): T => {
        return space(() => {
            world.unappend();
            world.append(map);
            let result = cb(...args);
            return result;
        }) as T;
    };
};
