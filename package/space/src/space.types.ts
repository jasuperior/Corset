/**
 * @alias Walkable.Step
 */
export type Step<T = any> = Walkable.Step<T>;
/**
 * @alias Walkable.Space
 */
export type Space<T = any> = Walkable.Space<T>;

/**
 * @alias Walkable.Plain
 */
export type Plain<T = any> = Walkable.Plain<T>;

/**
 * @alias Walkable.World
 */
export type World<T = any> = Walkable.World<T>;

/**
 * @alias Walkable.Globe
 */
export type Globe = Walkable.Globe;

/**
 * @alias Storable.Axis
 */
export type Axis = Storable.Axis;

/**
 * @alias Storable.Setting
 */
export type Setting = Storable.Setting;

/**
 * @namespace Walkable
 * @description
 * A walkable is a collection of values that can be walked through bidirectionally. It is a linked list.
 */
export namespace Walkable {
    /**
     * A step is a single value in a space.
     * @property {T} value - The value of the step.
     * @property  next - The next step in the space.
     * @property  prev - The previous step in the space.
     */
    export type Step<T = any> = Walkable<T> | null;

    export type Plain<T = any> = Map<any, Space<T>>;

    /**
     * a world tracks markers momentary scope. preserves the state at that point in time.
     * state is popped into state when it a function is called and popped out when it returns.
     * @link {Space}
     */
    export type World<T = any> = Space<Plain<T>>;

    /**
     * a globe tracks a function's momentary state.
     * state is popped into state when it a function is called and popped out when it returns.
     *
     * @link {Space}
     */
    export type Globe = Space<Space>;

    /**
     * A space is a collection of steps. it operates on walkable values.
     * @property {number} length - The number of steps in the space.
     */
    export interface Space<T = any> {
        length: number;
        head: Step<T>;
        tail: Step<T>;
        now: Step<T>;

        /**
         * append a value to the end of the space.
         * @param {T} value - The value to be appended.
         * @returns  - The new step.
         */
        append: (value: T) => Step<T>;
        /**
         * prepend a value to the start of the space.
         * @param {T} value - The value to be prepended.
         * @returns  - The new step.
         */
        prepend: (value: T) => Step<T>;

        /**
         * insert a value after the current step.
         * @param  node - The step to insert after.
         * @param  {T} value - The value to be inserted.
         * @returns  - The new step.
         */
        after: (value: T) => Step<T>;
        /**
         * insert a value before the current step.
         * @param  node - The step to insert before.
         * @param  {T} value - The value to be inserted.
         * @returns  - The new step.
         */
        before: (value: T) => Step<T>;

        /**
         * insert a value before the given step.
         * @param  node - The step to affix.
         * @param  {T} value - The value to insert.
         * @returns  - The new step.
         */
        prefix: (node: Step<T>, value: T) => Step<T>;
        /**
         * insert a value after the given step.
         * @param  node - The step to affix.
         * @param  {T} value - The value to insert.
         * @returns  - The new step.
         */
        postfix: (node: Step<T>, value: T) => Step<T>;

        /**
         * remove the last step in the space.
         * @returns  - The removed step.
         */
        unappend: () => Step<T>;
        /**
         * remove the first step in the space.
         * @returns  - The removed step.
         */
        unprepend: () => Step<T>;

        /**
         * move to the next step in the space.
         * @returns  - The new step.
         */
        next: (value?: T) => Step<T>;
        /**
         * move to the previous step in the space.
         * @returns  - The new step.
         */
        prev: (value?: T) => Step<T>;

        /**
         * remove the given step from the space.
         * @param  node - The step to be removed.
         * @returns {void}
         */
        remove: (node: Step<T>) => void;

        /**
         * swap the given step with the current step in the space and vice versa.
         * @param  node - The step to be swapped.
         * @returns  - The current now step.
         */
        swap: (node: Step<T>) => Step<T>;
        /**
         * point the cursor to the given step in the space.
         * @param  node - The step to be pointed to.
         * @returns  - The new step.
         */
        point: (node: Step<T>) => Step<T>;
    }

    /**
     * Check if the given value is a walkable space.
     * @param value {any} - The value to be checked.
     * @returns {value is Space<T>} - The result of the check.
     */
    export const isWalkable = <T>(value: any): value is Space<T> => {
        return (
            value &&
            typeof value === "object" &&
            "head" in value &&
            "tail" in value &&
            "now" in value
        );
    };
}
export interface Walkable<T = any> {
    value: T;
    next: Step<T>;
    prev: Step<T>;
}

/**
 * @namespace Storable
 * @description
 * A storable is a value that can be captured and released. It is a memory cell.
 * @property {T} now - The current value of the storable.
 * @property {number} age - The age of the storable.
 */
export namespace Storable {
    export type Axis = Storable<Space, 2>;
    /**
     * a setting is the cursor of the application state.
     * only changes when a function is called from the global scope
     */
    export type Setting = Storable<[Space, Plain], 1>;

    export const isStorable = <T>(value: any): value is Storable<T> => {
        return (
            value &&
            typeof value === "object" &&
            "now" in value &&
            "age" in value &&
            "capture" in value &&
            "release" in value
        );
    };
}
export interface Storable<T, Life extends number = 0> {
    now: T;
    age: number;
    life: Life;
    /**
     * capture a value when the age of the storable is 0; otherwise, increment the age.
     * @param {T} value - The value to be captured.
     */
    lock: (value: T) => T | number;
    /**
     * release the value if the age of the storable is 0; otherwise, decrement the age.
     * @param {T} value - The value to be released.
     */
    release: (value?: T) => T | null;

    borrow: (value: T, age?: number) => T;
}

/**
 * @namespace Scope
 * @description
 * a scope is a function which acts on the current state of the context.
 */
export interface Scope<Result = any, Params extends any[] = any[]> {
    (...args: Params): Result;
}
