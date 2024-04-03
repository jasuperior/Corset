import { Fiber, Walkable } from "@corset/space";
import { Detectable, TYPE } from "./time.types";
import { Signal } from "./signal";

export class Channel<T = any> implements Detectable<T> {
    #queue: Walkable.Space<Promise<T> | T> = new Fiber();
    #pending?: Promise<void>;
    #current: T = null as T;
    readonly listeners = new Set<Detectable.Listener<T>>();
    #pendingListeners = new Set<Detectable.Listener<T>>();

    #closed = false;
    #running = false;
    constructor(
        public eq: Detectable.Equality<T> = (next: T, prev: T) =>
            next !== undefined && next !== prev
    ) {}
    get length() {
        return this.#queue.length;
    }
    get size() {
        return this.listeners.size;
    }
    get isPending() {
        return this.#queue.length > 0 || !!this.#pending;
    }
    get now() {
        //untracked value change
        return this.#current;
    }
    set now(value: T) {
        this.#current = value;
    }
    subscribe = (listener: Detectable.Listener<T>) => {
        let listeners = this.#running ? this.#pendingListeners : this.listeners;
        listeners.add(listener);
        this.now;
        return () => {
            this.listeners.delete(listener);
        };
    };
    unsubscribe = (listener: Detectable.Listener<T>) => {
        this.listeners.delete(listener);
    };
    publish = (value: T | Promise<T>) => {
        if (!this.#closed) {
            if (this.isPending) {
                this.#queue.append(value);
                return;
            }
            this.#queue.append(value);
            this.#trigger();
        }
    };

    throw = (error: Error) => {
        this.publish(Promise.reject(error));
    }
    then = <U>(listener: Detectable.Transformation<T, U>) => {
        // let signal = new Signal<U>();
        // let promise = new Promise<U>((res, rej) => {
        //     let schedule = ((value: T) => {
        //         console.log("scheduled", value);
        //         res(listener(value));
        //         this.unsubscribe(schedule);
        //     }) as Detectable.Listener<T>;
        //     this.subscribe(schedule);
        // });
        // return promise;
        let schedule = ((value: T) => {
            listener(value);
            this.unsubscribe(schedule);
        }) as Detectable.Listener<T>;
        this.subscribe(schedule);
        return this;
    };
    catch = (listener: Detectable.Listener<Error>) => {
        // this.
        throw new Error("Method not implemented.");
    };
    #trigger = () => {
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
    #triggerPromise = (value: Promise<T>) => {
        this.#pending = value.then((resolvedValue) => {
            this.#queue.prepend(resolvedValue);
            this.#pending = undefined;
            this.#trigger();
        }) as Promise<void>;
    };
    close = () => {
        this.#closed = true;
    };

    [TYPE] = true;
}
