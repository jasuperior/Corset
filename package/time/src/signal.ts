import { Fiber } from "@corset/space";
import { Channel } from "./channel";

const isPending = Symbol("pending");
export class Signal<T = any> extends Promise<T> {
    #value?: T;
    #error?: Error;
    #success = new Channel<T>();
    #failure = new Channel<Error>();
    #pending = true;
    constructor(value?: T) {
        super((res, rej) => {});
        this.#value = value;
        this.#success.subscribe((value) => {
            this.#value = value;
            this.#pending = false;
        });
        this.#failure.subscribe((error) => {
            this.#error = error;
            this.#pending = false;
        });
    }
    get pending() {
        return this.#pending;
    }
    get value() {
        return this.#value;
    }
    get error() {
        return this.#error?.message;
    }
    then<TResult1 = T, TResult2 = never>(
        onfulfilled?:
            | ((value: T) => TResult1 | PromiseLike<TResult1>)
            | null
            | undefined,
        onrejected?:
            | ((reason: any) => TResult2 | PromiseLike<TResult2>)
            | null
            | undefined
    ): Signal<TResult1 | TResult2> {
        let sig = new Signal<TResult1 | TResult2>();
        if (this.#pending) {
            // sig.then(onfulfilled, onrejected);
            this.#success.subscribe((value) => {
                value && sig.next(onfulfilled?.(this.#value!) as TResult1);
            });
            this.#failure.subscribe((error) => {
                //sig.next should take the result of on rejected ?
                onrejected?.(this.#error!.message);
                sig.throw(this.#error!);
            });
            //give a new Signal for the next value
        } else {
            if (this.#value) {
                sig.next(onfulfilled?.(this.#value) as TResult1);
            } else {
                onrejected?.(this.#error!.message);
                sig.throw(this.#error!);
            }
        }

        return sig;
    }

    catch<TResult = never>(
        onrejected?:
            | ((reason: any) => TResult | PromiseLike<TResult>)
            | null
            | undefined
    ): Promise<T | TResult> {
        let sig = new Signal<T | TResult>();
        if (this.#pending) {
            this.#failure.subscribe((error) => {
                onrejected?.(this.#error!.message);
                sig.throw(this.#error!);
            });
        } else {
            if (this.#value) {
                sig.next(this.#value);
            } else {
                onrejected?.(this.#error!.message);
                sig.throw(this.#error!);
            }
        }
        return sig;
    }
    next(value: T) {
        if (this.#pending) {
            this.#success.publish(value);
        }
        // this.#pending ?? this.#success.publish(value);
    }
    throw(error: Error) {
        if (this.#pending) this.#failure.publish(error);
    }
}
