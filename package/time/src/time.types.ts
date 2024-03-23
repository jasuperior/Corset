export const TYPE = Symbol.for("detectable");
export type Detectable<T = any> = {
    now: T;
    listeners: Set<Detectable.Listener<T>>;
    subscribe: (listener: Detectable.Listener<T>) => () => void;
    unsubscribe: (listener: Detectable.Listener<T>) => void;
    publish: (value: T | Promise<T>) => void;
    then: <U>(listener: Detectable.Transformation<T, U>) => Promise<U>;
    catch: <U, V>(listener: Detectable.Listener<U>) => Promise<V>;
    close: () => void;
    [TYPE]: boolean;
};

export namespace Detectable {
    export const isDetectable = <T>(value: any): value is Detectable<T> => {
        return value && value[TYPE] !== undefined;
    };
    export type Equality<T> = (next: T, prev: T) => boolean;
    export type Listener<T = any> = ((value?: T) => Promise<void> | void) & {
        identity?: Function;
    };
    export type Derivation<T, U = T> = (value?: T) => Promise<U> | U;
    export type Transformation<T, U> = (value: T) => Promise<U> | U;
    export type Unsubscriber = () => void;

    export type Accessor<T> = (value?: T | Promise<T>) => T;
}
