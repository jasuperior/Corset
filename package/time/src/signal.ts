import { Fiber } from "@corset/space";
import { Channel } from "./channel";

const isPending = Symbol("pending");
/**
 * The `Signal` class extends `Promise` and represents a unit of work that is awaited and then never changes.
 * A `Signal` has a value, an error, and two channels for success and failure.
 * The `Signal` is initially in a pending state.
 * When the success channel receives a value, the `Signal`'s value is updated and it is no longer pending.
 * When the failure channel receives an error, the `Signal`'s error is updated and it is no longer pending.
 *
 * @template T The type of the value.
 */
export class Signal<T = any> extends Promise<T> {
    #value?: T;
    #error?: Error;
    #success = new Channel<T>();
    #failure = new Channel<Error>();
    #pending = true;
    /**
     * Creates a new `Signal`.
     * @param value The initial value of the `Signal`.
     */
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
    /**
     * Returns whether the `Signal` is pending.
     */
    get pending(): boolean {
        return this.#pending;
    }
    get value(): T | undefined {
        return this.#value;
    }
    get error(): any {
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
    /**
     * Publishes a new value to the success channel of the Signal.
     * If the Signal is still pending, it updates the value and sets the Signal as no longer pending.
     * @param value - The new value to publish.
     */
    next(value: T) {
        if (this.#pending) {
            this.#success.publish(value);
        }
        // this.#pending ?? this.#success.publish(value);
    }
    /**
     * Publishes a new error to the failure channel of the Signal.
     * If the Signal is still pending, it updates the error and sets the Signal as no longer pending.
     * @param error - The new error to publish.
     */
    throw(error: Error) {
        if (this.#pending) this.#failure.publish(error);
    }
}
