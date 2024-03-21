import { Fiber, Knot } from "./fiber";
import { Space, Step, Storable, Walkable } from "./space.types";

/**
 * @namespace Storable
 *
 * @description
 * A class that stores a value and its age.
 *
 * @link {Storable}
 */
export class Deposit<T, N extends number = 1> implements Storable<T, N> {
    #now: T | null = null;
    #age: number = 0;
    #offset: number = 0;
    #life: N;
    bank: Space<T> = new Fiber();
    constructor(value: T, life: N = 1 as N) {
        this.#life = life;
        this.bank.append(value);
        this.#age = this.bank.length;
    }
    get now() {
        return this.#now || this.bank.now?.value!;
    }
    get age() {
        return this.bank.length - this.#age;
    }
    get life() {
        return this.#life;
    }
    lock(value: T): T | number {
        if (this.age < this.#life && value !== undefined) {
            this.bank.append(value);
            return this.age;
        }
        this.#offset++;
        return this.age;
    }
    release(value?: T): T | null {
        if (this.#now) {
            let now = this.#now;
            this.#now = null;
            return now;
        }
        if (this.age > 0) {
            if (this.#offset > 0) {
                this.#offset--;
                return this.#now;
            }
            return this.bank.unappend()?.value!;
        }
        return this.now;
    }
    borrow(value: T, age: number = 0) {
        this.#now = value;
        return this.now;
    }
}
