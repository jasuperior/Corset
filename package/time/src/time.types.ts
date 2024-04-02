/**
 * Symbol for detectable type.
 */
export const TYPE = Symbol.for("detectable");

/**
 * Represents a detectable type.
 */
export type Detectable<T = any> = {
    now: T;
    listeners: Set<Detectable.Listener<T>>;
    subscribe: (listener: Detectable.Listener<T>) => () => void;
    unsubscribe: (listener: Detectable.Listener<T>) => void;
    publish: (value: T | Promise<T>) => void;
    then: <U>(listener: Detectable.Transformation<T, U>) => Detectable<T>;
    catch: <U, V>(listener: Detectable.Listener<U>) => Promise<V>;
    close: () => void;
    [TYPE]: boolean;
};

/**
 * Namespace for detectable related types and functions.
 */
export namespace Detectable {
    /**
     * Checks if a value is a detectable type.
     */
    export const isDetectable = <T>(value: any): value is Detectable<T> => {
        return value && value[TYPE] !== undefined;
    };

    export const isUnit = <T>(value: any): value is Detectable.Unit<T> => {
        return typeof value === "function" && value[Symbol.for("unit")];
    };
    /**
     * Represents a function that checks equality between two values of type T.
     */
    export type Equality<T> = (next: T, prev: T) => boolean;

    /**
     * Represents a listener function for a detectable type.
     */
    export type Listener<T = any> = ((value?: T) => Promise<void> | void) & {
        identity?: Function;
    };

    export type Process = () => Generator<Unit<any> | Unsubscriber, void, any>;
    /**
     * Represents a function that derives a value of type U from a value of type T.
     */
    export type Derivation<T, U = T> = (value?: T) => Promise<U> | U;

    /**
     * Represents a function that transforms a value of type T to a value of type U.
     */
    export type Transformation<T, U> = (value: T) => Promise<U> | U;

    /**
     * Represents a function that unsubscribes a listener.
     */
    export type Unsubscriber = () => void;

    /**
     * Represents a function that accesses a value of type T.
     */
    export type Unit<T> = ((value?: T | Promise<T>) => T) & {
        then: <U>(listener: Transformation<T, U>) => Promise<U>;
        catch: <U>(listener: Listener<U>) => Promise<U>;
    };
}
