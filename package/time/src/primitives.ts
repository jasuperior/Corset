import {
    goto,
    place,
    recall,
    space,
    to,
    top,
    now,
    drag,
    mark,
    get,
    set,
    define,
} from "@corset/space";
import { Channel } from "./channel";
import { Detectable } from "./time.types";
import { Signal } from "./signal";

/**
 * Symbol for detecting.
 */
const isDetecting = Symbol("detecting");

/**
 * Symbol for batching.
 */
const isBatched = Symbol("batched");

/**
 * Symbol for setting.
 */
const isSetting = Symbol("setting");

/**
 * Symbol for untracking.
 */
const Untrack = Symbol("untracked");

/**
 * Symbol for identity.
 */
const Identity = Symbol("identity");

/**
 * Depth of the current execution context.
 */
let depth = 0;

/**
 * Sets the untrack value and checks if the callback is batched.
 * If it is, adds it to the batched set and returns.
 * Otherwise, tries to execute the callback and sets the untrack value based on the result.
 * If an error occurs during execution and we are currently detecting, it does something with the channels.
 * @param cb - The callback function to untrack.
 */
let untrack = (cb: Function) => {
    let c = false;
    let p = place((...args: any[]) => {
        define(Identity, p);
        set(Untrack, c);
        //if batched
        let batched = recall<Set<Detectable.Listener<any>>>(isBatched);
        if (batched) {
            batched.add(cb as Detectable.Listener<any>);
            return;
        }
        try {
            let result = cb(...args);
            c = true;
            return result;
        } catch (e) {
            if (recall(isDetecting)) {
                let channels = now<Set<Channel | Signal>>();
                //...do something
            }
        }
    });
    return p;
};
/**
 * Creates an accessor with certain properties.
 * @param accessor - The function to be used as the accessor.
 * @param inheritence - The set of instances that the accessor should consider as its own.
 * @returns The accessor function, with additional properties.
 */
export const createUnitAccessor = <T>(
    accessor: Function,
    inheritence: Set<any>
) => {
    Object.defineProperty(accessor, Symbol.hasInstance, {
        value: (instance: any) => {
            // console.log(instance())
            return instance?.instanceOf?.(accessor);
        },
    });

    Object.defineProperty(accessor, "instanceOf", {
        value: (instance: any) => {
            return inheritence.has(instance);
        },
    });
    Object.defineProperty(accessor, Symbol.for("unit"), {
        value: true,
    });
    return accessor as Detectable.Unit<T>;
};
/**
 * Executes a callback when a certain condition is met.
 * The callback is untracked, meaning it will not be executed if it is batched.
 * The function also manages subscriptions to channels, subscribing the callback to each channel in the producers set.
 * If a channel is pending, the callback is added as a listener to the channel.
 * The function returns an unsubscribe function that unsubscribes the callback from all channels in the producers set and clears the set.
 * @param cb - The callback function to be executed when the condition is met.
 * @returns An unsubscribe function.
 */
export const when = (cb: Detectable.Listener<any>) =>
    //@ts-expect-error
    space<() => void>(() => {
        if (get<number>(Untrack, 2)) {
            return get<() => void>("unsub");
        }

        set(isSetting, new Set());
        let listener = untrack(cb) as unknown as Detectable.Listener<any>;
        goto(top);
        to(cb);
        to(new Set());
        let ptr = mark(isDetecting);
        listener();
        goto(ptr);
        let producers = drag<Set<Channel | Signal<any>>>();
        for (let channel of producers) {
            if (channel instanceof Channel) {
                channel.subscribe(listener); //we lose identity here by untracking the callback
            } else {
                if (channel.pending) {
                    channel.then(listener);
                }
            }
        }

        let unsubscribe = () => {
            producers.forEach((channel) => {
                if (channel instanceof Channel) channel.unsubscribe(listener);
            });
            producers.clear();
            // delete producers;
        };
        unsubscribe[Identity] = "Unsubscribe";
        set("unsub", unsubscribe);

        return now<() => void>();
        // recall(isSetting) //?
    });

Object.defineProperty(when, Symbol.hasInstance, {
    value: (instance: any) => {
        return instance?.[Identity] === "Unsubscribe";
    },
});
/**
 * Same as when but async. Executes a callback when a certain condition is met.
 * The callback is tracked, meaning it will be executed even if it is batched.
 * The function also manages subscriptions to channels, subscribing the callback to each channel in the producers set.
 * If a channel is pending, the callback is added as a listener to the channel.
 * The function returns an unsubscribe function that unsubscribes the callback from all channels in the producers set and clears the set.
 * @param cb - The callback function to be executed whenever the condition is met.
 * @returns An unsubscribe function.
 *
 * @link {when}
 */
export const whenever = async (cb: Detectable.Listener<Promise<any>>) =>
    //@ts-expect-error
    space<() => void>(async () => {
        //TODO: generalize this since its literally the same as when but async
        if (get<number>(Untrack, 2)) {
            return get<() => void>("unsub");
        }
        set(isSetting, new Set());
        let listener = untrack(cb) as unknown as Detectable.Listener<any>;
        goto(top);
        to(cb);
        to(new Set());
        let ptr = mark(isDetecting);
        let result = await listener();
        let last: any;
        let subscibe = () => {
            goto(ptr);
            let producers = drag<Set<Channel | Signal<any>>>();
            for (let channel of producers) {
                if (channel instanceof Channel) {
                    channel.subscribe(listener); //we lose identity here by untracking the callback
                } else {
                    if (channel.pending) {
                        channel.then(listener);
                    }
                }
            }

            set("unsub", () => {
                producers.forEach((channel) => {
                    if (channel instanceof Channel)
                        channel.unsubscribe(listener);
                });
            });
        };
        subscibe();
        return now<() => void>();
        // recall(isSetting) //?
    });

const doIteration = (
    value: Detectable.Unit<any> | Detectable.Unsubscriber,
    iterate: Function
) => {
    return Detectable.isUnit(value)
        ? value.then(iterate as Detectable.Transformation<any, any>)
        : iterate();
};
export const how = (cb: Detectable.Process) => {
    let p = place(cb);
    let gen = p();
    let result = gen.next();
    let unsubs = new Set<() => void>();
    let iterate = (value?: any) => {
        result = gen.next(value);
        let u = result.value;
        if (Detectable.isUnit(u)) {
            u.then(iterate);
        } else if (u instanceof when) {
            unsubs.add(u);
            iterate();
        } else if (result.done) {
            unsubs.forEach((unsub) => unsub());
            unsubs.clear();
            gen = p();
            result = gen.next();
            doIteration(result.value!, iterate);
        }
    };
    doIteration(result.value!, iterate);
    return p;
};
/**
 * Executes the all callback, and collects all the channels that are produced by the callback.
 * Each collected listener is then executed in batch.
 * @param cb - The callback function to be executed.
 */
export const thus = (cb: Detectable.Listener<any>) =>
    space(() => {
        set(isBatched, new Set());
        cb();
        let batched = drag<Set<Detectable.Listener<any>>>();
        for (let listener of batched) {
            listener();
        }
    });
/**
 * Executes a callback if a signal fails.
 * The function checks if we are currently detecting, and if we are, it retrieves the set of channels.
 * It then checks each channel in the set, and if a channel is a signal, it catches the callback.
 * @param cb - The callback function to be executed if a signal is caught.
 */
export const unless = (cb: Detectable.Listener<any>) => {
    if (recall(isDetecting)) {
        let channels = now<Set<Channel | Signal>>();
        for (let channel of channels) {
            if (channel instanceof Signal) {
                channel.catch(cb);
            }
        }
    }
};

/**
 * Creates a unit of time. A unit is a detectable value that can be accessed and modified over time.
 * The function creates an accessor to the unit channel, and if a value is provided, it publishes the value to the channel.
 * It then returns the accessor.
 * @param value - The initial value of the unit.
 * @returns The accessor function, which can be used to get or set the value of the unit.
 */
export const unit = <T>(value?: T, eq?: Detectable.Equality<T>) =>
    space<Detectable.Unit<T>>(() => {
        let channel = new Channel(eq); //add a tag instance to the channels to track inheritenc
        let inheritence: Set<Detectable.Unit<any>> = new Set();
        if (!Object.is(value, undefined)) {
            channel.publish(value as T);
        }
        let accessor = createUnitAccessor<T>((newValue?: T) => {
            if (newValue !== undefined) {
                channel.publish(newValue);
            } else if (recall(isDetecting)) {
                let producers = now<Set<Channel>>();
                producers.add(channel);
                if (get(isSetting, 2)) {
                    //!NOTE: EXPERIMENTAL!!!
                    let deps = now<Set<Detectable.Unit<any>>>();
                    deps.add(accessor);
                }
            } else {
                if (recall(Identity)) {
                    let id = recall<Detectable.Listener<any>>(Identity)!;
                    if (!channel.listeners.has(id)) {
                        channel.subscribe(id);
                    }
                }
            }
            return channel.now;
        }, inheritence);

        Object.defineProperty(accessor, "then", {
            value: channel.then.bind(channel),
        });
        Object.defineProperty(accessor, "catch", {
            value: channel.catch.bind(channel),
        });
        return accessor;
    });
Object.defineProperty(unit, Symbol.hasInstance, {
    value: (instance: any) => {
        return instance?.[Symbol.for("unit")];
    },
});
/**
 * Creates a derived unit that subscribes to its child units and produces their combined result over time.
 * The function creates a unit and an accessor, and sets the unit as the current value of the accessor.
 * It then returns the accessor.
 * The accessor can be used to get or set the value of the unit.
 * When the accessor is called with a new value, it sets the value of the unit.
 * When the accessor is called without a value, it returns the current value of the unit.
 * The product is derived from the provided derivation and transformation functions.
 * @param dx - The derivation function, which defines how the product is derived from its child units.
 * @param tx - The transformation function, which defines how the product is transformed when a new value is set.
 * @returns The accessor function, which can be used to get or set the value of the product.
 */
export const product = <T, U = T>(
    dx: Detectable.Derivation<T, U>,
    tx?: Detectable.Transformation<U, T>
) =>
    space(() => {
        let u = unit<U>();
        let inheritence: Set<Detectable.Unit<any>> = new Set();
        let initialized = false;
        let accessor = (newValue?: U) => {
            if (newValue !== undefined) {
                if (recall(u)) {
                    return u();
                }
                to(u);
                mark(u);
                return u(newValue);
            }
            return u();
        };

        when(() => {
            u(dx());
            if (!initialized) {
                initialized = true;
                inheritence = get<Set<Detectable.Unit<any>>>(isSetting, 2)!;
            }
        });
        if (tx)
            when(() => {
                //NOTE: check that the resulting value is equel to the current value. if not throw an error.
                //products must be consitent in and out
                tx(u());
            });
        Object.defineProperty(accessor, Symbol.for("product"), {
            value: true,
        });
        return createUnitAccessor(accessor, inheritence);
    });
Object.defineProperty(product, Symbol.hasInstance, {
    value: (instance: any) => {
        return instance?.[Symbol.for("product")];
    },
});
/**
 * Creates a moment, which is a unit of time that is awaited and then never changes.
 * The function creates a new Signal and an accessor, and sets the Signal as the current value of the accessor.
 * The accessor can be used to get or set the value of the Signal.
 * When the accessor is called with a new value, it sets the value of the Signal.
 * When the accessor is called without a value, it returns the current value of the Signal.
 * If the new value is an Error, the Signal throws the error.
 * If we are currently detecting, the Signal is added to the set of producers.
 * The function also defines 'then' and 'catch' methods on the accessor, which are bound to the corresponding methods on the Signal.
 * @param value - The initial value of the moment.
 * @returns The accessor function, which can be used to get or set the value of the moment.
 */
export const moment = <T>(value?: T) => {
    let signal = new Signal<T>(value);

    let accessor = createUnitAccessor((newValue?: T | Error) => {
        if (newValue !== undefined) {
            if (newValue instanceof Error) {
                signal.throw(newValue);
                return;
            }
            signal.next(newValue);
        } else if (recall(isDetecting)) {
            let producers = now<Set<Channel | Signal>>();
            producers.add(signal);
        }
        return signal.value || signal.error;
    }, new Set());
    Object.defineProperty(accessor, "then", {
        value: signal.then.bind(signal),
    });
    Object.defineProperty(accessor, "catch", {
        value: signal.catch.bind(signal),
    });
    return accessor;
};
/**
 * Creates an event, which is a unit that triggers a change only when it is called.
 * The function creates two units and a moment, and a transformation function that is untracked.
 * It then defines a 'when' function that, if the moment is initialized, gets the value of the first unit and sets the value of the second unit to the transformed value.
 * The function also creates an accessor that, when called with a new value, sets the value of the first unit and initializes the moment if it is not already initialized.
 * When the accessor is called without a value, it returns the current value of the second unit.
 * The event does not subscribe to its child units, if any.
 * @param tx - The transformation function, which defines how the event value is transformed when a new value is set.
 * @returns The accessor function, which can be used to get or set the value of the event.
 */
export const event = <T, U = T>(tx: Detectable.Transformation<T, U>) => {
    let u = unit<U>();
    let t = unit<T>();
    let initialized = unit(false);
    tx = untrack(tx) as Detectable.Transformation<T, U>;
    when(() => {
        if (initialized()) {
            let value = t();
            u(tx(value));
        }
    });
    let accessor = createUnitAccessor((newValue?: T) => {
        if (newValue !== undefined) {
            t(newValue);
            if (!initialized()) {
                initialized(true);
            }
            return u();
        } else {
            return u();
        }
    }, new Set());
    return accessor;
};

let u = unit(0);
let v = unit(0);
let test = how(function* () {
    console.log(yield u);
    console.log(yield u);
    yield when(() => {
        console.log(u());
    });
    console.log(yield u);
});
test();
u(1);
u(2);
u(32);
v(3);
u(99);
u(19);
