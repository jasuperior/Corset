import { Space, Step, Walkable } from "./space.types";

/**
 * A class that stores a value and its neighbors.
 *
 * @namespace Walkable
 * @link {Walkable}
 */
export class Knot<T> implements Walkable<T> {
    constructor(
        public value: T,
        public next: Step<T> = null,
        public prev: Step<T> = null
    ) {}
    /**
     * Creates a copy of the current step with a new value.
     * @param value - The new value for the copied step.
     * @returns A new step with the new value and the same next and previous steps as the current step.
     */
    copy(value: T): Knot<T> {
        return new Knot(value, this.next, this.prev);
    }
    /**
     * Appends a step to the current step.
     * @param value - The step to append.
     * @returns The appended step.
     */
    append(value: Step<T>): Step<T> {
        if (value) {
            this.next = value;
            let { prev } = value;
            if (prev) {
                prev.next = value;
                this.prev = prev;
            }
            value.prev = this;
        }
        return value;
    }
    /**
     * Prepends a step to the current step.
     * @param value - The step to prepend.
     * @returns The prepended step.
     */
    prepend(value: Step<T>): Step<T> {
        this.prev = value;
        if (value) {
            let { next } = value;
            if (next) {
                next.prev = value;
                this.next = next;
            }
            value.next = this;
        }
        return value;
    }
}

/**
 * @namespace Space
 *
 * @description
 * Represents a collection of walkable values.
 *
 * @link {Space}
 */
export class Fiber<T = any> implements Space<T> {
    head: Knot<T> | Step<T> = null;
    tail: Knot<T> | Step<T> = null;
    now: Knot<T> | Step<T> = null;
    length: number = 0;

    constructor(values: T[] = []) {
        for (const value of values) {
            this.append(value);
        }
    }

    append(value: T): Knot<T> {
        const knot = new Knot(value, null, null);
        this.length++;
        if (this.tail) {
            (this.tail as Knot<T>).append(knot);
        }
        this.tail = knot;
        if (!this.head) {
            this.head = knot;
        }
        return (this.now = knot);
    }
    prepend(value: T): Knot<T> {
        const knot = new Knot(value, this.head);
        this.length++;
        if (this.head) {
            this.head.prev = knot;
        }
        this.head = knot;
        if (!this.tail) {
            this.tail = knot;
        }
        return (this.now = knot);
    }

    unappend(): Step<T> {
        if (!this.tail) {
            //NOTE: should i change "now" on null also?
            return null;
        }
        const knot = this.tail;
        this.length--;
        this.tail = knot.prev;
        if (this.tail) {
            this.tail.next = null;
        } else {
            this.head = null;
        }
        this.now = this.tail;
        return knot as Knot<T>;
    }
    unprepend(): Step<T> {
        if (!this.head) {
            return null;
        }
        const knot = this.head;
        this.length--;
        this.head = knot.next;
        if (this.head) {
            this.head.prev = null;
        } else {
            this.tail = null;
        }
        this.now = this.head;
        return knot as Knot<T>;
    }

    after(value: T): Step<T> {
        return this.postfix(this.now, value);
    }
    before(value: T): Step<T> {
        return this.prefix(this.now, value);
    }

    prefix(node: Step<T>, value: T): Step<T> {
        if (!node) {
            return this.prepend(value);
        }
        this.length++;
        const knot = new Knot(value);
        if (!node.prev) {
            this.head = knot;
        }
        knot.append(node);
        return (this.now = knot);
    }
    postfix(node: Step<T>, value: T): Step<T> {
        if (!node) {
            return this.append(value);
        }
        this.length++;
        const knot = new Knot(value);
        if (!node.next) {
            this.tail = knot;
        }
        knot.prepend(node);
        return (this.now = knot);
    }
    next(value?: T): Step<T> {
        // console.log("next", value);
        if (value !== undefined) {
            let next = this.now?.next || null;
            this.remove(next);
            this.now = this.postfix(this.now, value);
            return next;
        }
        return (this.now = this.now?.next ?? null);
    }
    prev(value?: T): Step<T> {
        if (value !== undefined) {
            let prev = this.now?.prev || null;
            this.remove(prev);
            this.now = this.prefix(this.now, value);
            return prev as Knot<T>;
        }
        return (this.now = this.now?.prev ?? null) as Knot<T>;
    }

    remove(node: Step<T>): void {
        if (!node) {
            return;
        }
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }
        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }
        //not sure if this cleanup is necessary
        //and it might get in the way when trying to revisit nodes that have been transplanted
        node.next = null;
        node.prev = null;
        if (this.now === node) {
            this.now = node.prev || node.next;
        }
    }
    swap(node: Walkable.Step<T>): Step<T> {
        if (!node) return null;
        if (!this.now) return (this.now = node);

        let { next, prev } = node;
        let { next: n, prev: p } = this.now;
        if (next) next.prev = this.now;
        if (prev) prev.next = this.now;
        if (n) n.prev = node;
        if (p) p.next = node;
        this.now.next = n;
        this.now.prev = p;
        node.next = next;
        node.prev = prev;

        return (this.now = node);
    }
    point(node: Step<T>): Step<T> {
        return (this.now = node);
    }

    [Symbol.iterator]() {
        let node = this.head;
        return {
            next: () => {
                if (!node || node === this.tail?.next) {
                    return { done: true, value: node?.value || null };
                }
                let value = node.value;
                node = node.next;
                return { done: false, value };
            },
        };
    }
    [Symbol.toStringTag]() {
        return "Fiber";
    }
    static from<T>(
        now: Walkable.Step<T>,
        head: Walkable.Step<T>,
        tail: Walkable.Step<T>
    ) {
        const fiber = new Fiber<T>();
        fiber.now = now;
        fiber.head = head;
        fiber.tail = tail;
        return fiber;
    }
}
