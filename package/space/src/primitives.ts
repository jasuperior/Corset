import { Deposit } from "./deposit";
import { Fiber } from "./fiber";
import { Scope, Walkable } from "./space.types";

const common: { globe: Fiber; world: Walkable.Plain } = {
    globe: new Fiber(),
    world: new Map() as Walkable.Plain,
};
const scope: Deposit<Walkable.Space> = new Deposit<Walkable.Space>(
    common.globe
); //holds the scope of the highest function call
const locale: Walkable.Globe = new Fiber<Walkable.Space>([common.globe]);
const world: Walkable.World = new Fiber<Walkable.Plain>([common.world]);

/**
 * Returns the head value of the current scope.
 * The head is the first value in the parent most scope.
 * @param getNode - If true, returns the node instead of the value.
 * @returns The head value or node.
 *
 * ```ts
 * space(() => {
 *  push(1);
 *  space(() => {
 *    push(2);
 *    let node = head(); // Outputs: 1
 *  });
 *  push(3);
 *  let node = head(); // Outputs: 1
 * })
 * ```
 */
export const head = <T, U extends boolean = false>(
    getNode: U = false as U
): T | undefined => {
    let { head } = scope.now!;
    return head?.value as T;
};

/**
 * Returns the tail value of the current scope.
 * The tail is the last value in the parent most scope.
 * @param getNode - If true, returns the node instead of the value.
 * @returns The tail value or node.
 * ```ts
 * space(() => {
 *  push(1);
 *  space(() => {
 *    push(2);
 *    let node = tail(); // Outputs: 1
 *  });
 *  push(3);
 *  let node = tail(); // Outputs: 3
 * })
 * ```
 */
export const tail = <T>(getNode?: boolean): T | undefined => {
    let { tail } = scope.now!;
    return tail?.value as T;
};

/**
 * Returns the current value of the current scope.
 * @returns The current value.
 *
 * ```ts
 * space(() => {
 *   push(1);
 *   push(2);
 *   let node = here(); // Outputs: 2
 * });
 * ```
 * ```ts
 * space(() => {
 *   push(1);
 *   push(2);
 *   space(()=>{
 *      push(3);
 *      let node = here(); // Outputs: 2
 *   })
 * });
 * ```
 */
export const here = <T>(): T | undefined => {
    let { now } = scope.now!;
    return now?.value as T;
};

export const $here = <T>(): Walkable.Step<T> => {
    return scope.now!.now;
};
/**
 * Returns the top value of the local scope. (top is the head of the local scope)
 * @param move - If true, moves the pointer to the top.
 * @returns The top value.
 *
 * ```ts
 * space(() => {
 *  push(1);
 *  space(() => {
 *    push(2);
 *    let node = top(); // Outputs: 2
 *  });
 *  push(3);
 *  let node = top(); // Outputs: 1
 * })
 * ```
 */
export const top = <T>(move?: boolean): T | undefined => {
    let { value: local } = locale.now!;
    if (move) local.point(local.head);
    return local.head?.value as T;
};

/**
 * Returns the bottom value of the local scope. (bottom is the tail of the local scope)
 * @param move - If true, moves the pointer to the bottom.
 * @returns The bottom value.
 *
 * ```ts
 * space(() => {
 *  push(1);
 *  space(() => {
 *    push(2);
 *    let node = bottom(); // Outputs: 2
 *  });
 *  push(3);
 *  let node = bottom(); // Outputs: 3
 * })
 * ```
 */
export const bottom = <T>(move?: boolean): T | undefined => {
    let { value: local } = locale.now!;
    if (move) local.point(local.tail);
    return local.tail?.value as T;
};

/**
 * Returns the current value of the local scope.
 * @returns The current value.
 * ```ts
 * space(() => {
 *  push(1);
 *  push(2);
 *  let node = now(); // Outputs: 2
 *  space(()=>{
 *    push(3);
 *    let node = now(); // Outputs: 3
 *  });
 * });
 * ```
 */
export const now = <T>(): T | undefined => {
    let { value: local } = locale.now!;
    return local.now?.value as T;
};

/**
 * Returns the next value of the local scope. (only useful when used with a `place`)
 * @param move - If true, moves the pointer to the next value.
 * @returns The next value.
 */
export const next = <T>(move?: boolean): Walkable.Step<T> => {
    let { value: local } = locale.now!;
    return move ? local.next() : local.now?.next?.value;
};
/**
 * Returns the previous value of the local scope.
 * @param move - If true, moves the pointer to the previous value.
 * @returns The previous value.
 */
export const prev = <T>(move?: boolean): Walkable.Step<T> => {
    let { value: local } = locale.now!;
    return move ? local.prev() : local.now?.prev?.value;
};
/**
 * Sets the value as the next value in the local scope.
 * @param value - The value to set.
 */
export const to = <T>(value: T): T => {
    let { value: local } = locale.now!;
    local.postfix(local.now, value);
    return value;
};
/**
 * Sets the value as the previous value in the local scope.
 * @param value - The value to set.
 */
export const from = <T>(value: T): T => {
    let { value: local } = locale.now!;
    local.prefix(local.now, value);
    return value;
};

/**
 * Moves the pointer to the top of the local scope and sets the value as the current value.
 * @param value - The value to set.
 * @returns The value of the current node.
 */
export const prepend = <T>(value: T): T => {
    return goto(top), from(value);
};
/**
 * Moves the pointer to the bottom of the local scope and sets the value as the current value.
 * @param value - The value to set.
 * @returns The value of the current node.
 */
export const append = <T>(value: T): T => {
    return goto(bottom), to(value);
};
/**
 * Moves the pointer to the location of a pointer
 * @returns The value of the top node.
 */
export const goto = <T>(point: typeof top): T | undefined => {
    return point<T>(true);
};
/**
 * saves the current state of the scope into the common world. can be accessed by all functions within the common scope.
 * @param label - The label for the snapshot.
 */
export const expose = <T>(label: any): T => {
    let { value: local } = locale.now!;
    let now = mark<T>(label);
    common.world.set(label, Fiber.from(local.now, local.head, local.tail));
    return now as T;
};
/**
 * saves the current state of the scope to the local world. can only be accessed by functions within the local scope.
 * @param label - The label for the snapshot.
 */
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

/**
 * Retrieves a value from the common world.
 * @param label - The label for the value.
 * @returns The value.
 */
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
/**
 * Retrieves a value up to a provided depth. The depth is the number of scopes above to search.
 * @param label - The label for the value.
 * @param depth - The depth to search. Default is 1.
 */
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

/**
 * Sets a value at a given depth. If the value already exists, it is replaced.
 * @param label - The label for the value.
 * @param value - The value to set.
 * @param depth - The depth to set. Default is 1.
 */
export const set = <T>(label: any, value: T, depth: number = 1) => {
    if (get(label, depth)) {
        pull();
    }
    to(value);
    mark(label);
};

export const remove = <T>(label: any, depth: number = 1) => {
    let { value: local } = locale.now!;
    let plain = world.now;
    for (let i = 0; i < depth && plain; i++) {
        let fiber = plain.value.get(label);
        if (fiber) {
            local.point(fiber.now);
            local.remove(fiber.now);
            plain.value.delete(label);
            return true;
        }
        plain = plain.prev;
    }
};
/**
 * Defines a value as a constant within the current scope.
 * This is mostly useful for the persistent state in a place.
 * @param label - The label for the constant.
 * @param value - The value of the constant.
 * @returns The value of the constant.
 */
export const define = <T>(label: any, value: T, depth: number = 1) => {
    return get(label, depth) ?? set(label, value, depth);
};
/**
 * Retrieves the current value and moves the pointer to the previous or next value in the local scope.
 * @returns The current value.
 */
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
/**
 * Retrieves the current value and moves the pointer to the next or previous value in the local scope.
 * @returns The current value.
 */
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
/**
 * Clears all values from the local scope.
 * @returns The value of the last item removed from the local scope.
 */
export const clear = <T>() => {
    let { value: local } = locale.now!;
    let { head, tail } = local;
    while (head) {
        local.remove(head);
        local.point(head);
    }
    return local.now?.value as T;
};

/**
 * Creates a new local scope and executes the provided callback within that scope.
 * The function appends a new Fiber to the locale and a new Map to the world, and locks the scope to the current locale.
 * It then executes the callback and, if the result is a Promise, waits for it to resolve before releasing the scope and removing the last items from the world and locale.
 * If the result is not a Promise, it immediately releases the scope and removes the last items from the world and locale.
 * @param cb - The callback to execute within the new local scope.
 * @returns The result of the callback.
 */
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
/**
 * Creates a new place within the current scope.
 * The function creates a new local scope and a new world scope, and locks the scope to the current locale.
 * The map in a place is perminent and can be accessed by all functions within the place.
 * It then executes the callback and, if the result is a Promise, waits for it to resolve before releasing the scope and removing the last items from the world and locale.
 * If the result is not a Promise, it immediately releases the scope and removes the last items from the world and locale.
 * @param cb - The callback to execute within the new place.
 * @returns The result of the callback.
 */
export const place = <T extends Scope>(cb: T) => {
    let map = new Map();
    return (...args: Parameters<T>): ReturnType<T> => {
        return space(() => {
            world.unappend();
            world.append(map);
            let result = cb(...args);
            return result;
        }) as ReturnType<T>;
    };
};
