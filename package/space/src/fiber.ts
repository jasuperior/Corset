import { Space, Step, Walkable } from "./space.types";

/**
 * @namespace Walkable
 *
 * @description
 * A class that stores a value and its neighbors.
 *
 * @link {Walkable}
 */
export class Knot<T> implements Walkable<T> {
    constructor(
        public value: T,
        public next: Step<T> = null,
        public prev: Step<T> = null
    ) {}

    copy(value: T) {
        return new Knot(value, this.next, this.prev);
    }
    append(value: Step<T>) {
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
    prepend(value: Step<T>) {
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
 * A class that stores a collection of walkable values.
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

    append(value: T) {
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
    prepend(value: T) {
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

    unappend() {
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
        return knot;
    }
    unprepend() {
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
        return knot;
    }

    after(value: T) {
        return this.postfix(this.now, value);
    }
    before(value: T) {
        return this.prefix(this.now, value);
    }

    prefix(node: Step<T>, value: T) {
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
    postfix(node: Step<T>, value: T) {
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
    next(value?: T) {
        // console.log("next", value);
        if (value !== undefined) {
            let next = this.now?.next || null;
            this.remove(next);
            this.now = this.postfix(this.now, value);
            return next;
        }
        return (this.now = this.now?.next ?? null);
    }
    prev(value?: T) {
        if (value !== undefined) {
            let prev = this.now?.prev || null;
            this.remove(prev);
            this.now = this.prefix(this.now, value);
            return prev;
        }
        return (this.now = this.now?.prev ?? null);
    }

    remove(node: Step<T>) {
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
    swap(node: Walkable.Step<T>) {
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
    point(node: Step<T>) {
        return (this.now = node);
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
