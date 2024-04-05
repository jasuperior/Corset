import { Fiber, Walkable } from "@corset/space";
import { Detectable, TYPE } from "./time.types";
import { Signal } from "./signal";

export class Channel<T = any> implements Detectable<T> {
    #queue: Walkable.Space<Promise<T> | T> = new Fiber();
    #pending?: Promise<void>;
    #current: T = null as T;
    readonly listeners: Set<Detectable.Listener<T>> = new Set<
        Detectable.Listener<T>
    >();
    #pendingListeners = new Set<Detectable.Listener<T>>();
    #closed = false;
    #running = false;

    constructor(
        public eq: Detectable.Equality<T> = (next: T, prev: T) =>
            next !== undefined && next !== prev
    ) {}
    get length(): number {
        return this.#queue.length;
    }
    get size(): number {
        return this.listeners.size;
    }
    get isPending(): boolean {
        return this.#queue.length > 0 || !!this.#pending;
    }
    get now(): T {
        //untracked value change
        return this.#current;
    }
    set now(value: T) {
        this.#current = value;
    }
    subscribe = (listener: Detectable.Listener<T>): Detectable.Unsubscriber => {
        let listeners = this.#running ? this.#pendingListeners : this.listeners;
        listeners.add(listener);
        this.now;
        return () => {
            this.listeners.delete(listener);
        };
    };
    unsubscribe = (listener: Detectable.Listener<T>): void => {
        this.listeners.delete(listener);
    };
    publish = (value: T | Promise<T>): void => {
        if (!this.#closed) {
            if (this.isPending) {
                this.#queue.append(value);
                return;
            }
            this.#queue.append(value);
            this.#trigger();
        }
    };

    throw = (error: Error): void => {
        this.publish(Promise.reject(error));
    };
    then = <U>(listener: Detectable.Transformation<T, U>): this => {
        let schedule = ((value: T) => {
            listener(value);
            this.unsubscribe(schedule);
        }) as Detectable.Listener<T>;
        this.subscribe(schedule);
        return this;
    };
    catch = (listener: Detectable.Listener<Error>): this => {
        // this.
        throw new Error("Method not implemented.");
    };
    #trigger = (): void => {
        this.#running = true;
        if (this.#queue.length) {
            let value = this.#queue.unprepend();
            while (
                (this.#queue.length || value !== null) &&
                value?.value instanceof Promise == false
            ) {
                if (!this.eq(value?.value as T, this.#current)) {
                    // console.log("skipped", this.#current, value);
                    value = this.#queue.unprepend();
                    continue;
                }
                this.#current = value?.value as T;

                for (let listener of this.listeners) {
                    // listener !== effects.top &&
                    if (listener.identity) {
                        listener.identity.call(this, this.#current);
                    } else listener.call(this, this.#current);
                }
                value = this.#queue.unprepend();
            }
            if (value?.value instanceof Promise) {
                this.#triggerPromise(value.value as Promise<T>);
            }
        }
        this.#running = false;
        if (this.#pendingListeners.size) {
            this.#pendingListeners.forEach((listener) => {
                this.listeners.add(listener);
            });
            this.#pendingListeners.clear();
        }
    };
    #triggerPromise = (value: Promise<T>): void => {
        this.#pending = value.then((resolvedValue) => {
            this.#queue.prepend(resolvedValue);
            this.#pending = undefined;
            this.#trigger();
        }) as Promise<void>;
    };
    close = (): void => {
        this.#closed = true;
    };

    [TYPE] = true;
}
