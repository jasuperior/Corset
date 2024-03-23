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

const isDetecting = Symbol("detecting");
const isBatched = Symbol("batched");
const isSetting = Symbol("setting");
const Untrack = Symbol("untracked");
const Identity = Symbol("identity");
let depth = 0;
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

const createAccessor = <T>(accessor: Function, inheritence: Set<any>) => {
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
    return accessor as Detectable.Accessor<T>;
};
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

        set("unsub", () => {
            producers.forEach((channel) => {
                if (channel instanceof Channel) channel.unsubscribe(listener);
            });
            producers.clear();
            // delete producers;
        });

        return now<() => void>();
        // recall(isSetting) //?
    });

const whenever = async (cb: Detectable.Listener<Promise<any>>) =>
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
export const thus = (cb: Detectable.Listener<any>) =>
    space(() => {
        set(isBatched, new Set());
        cb();
        let batched = drag<Set<Detectable.Listener<any>>>();
        for (let listener of batched) {
            listener();
        }
    });
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

export const unit = <T>(value?: T) =>
    space<Detectable.Accessor<T>>(() => {
        let channel = new Channel(); //add a tag instance to the channels to track inheritenc
        let inheritence: Set<Detectable.Accessor<any>> = new Set();
        if (value) {
            channel.publish(value);
        }
        let accessor = (newValue?: T) => {
            if (newValue !== undefined) {
                set("isInitiator", true);
                console.log("initiating", newValue);
                channel.publish(newValue);
            } else if (recall(isDetecting)) {
                let producers = now<Set<Channel>>();
                producers.add(channel);
                if (get(isSetting, 2)) {
                    //!NOTE: EXPERIMENTAL!!!
                    let deps = now<Set<Detectable.Accessor<any>>>();
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
        };
        /**
         * @experimental
         */
        // Object.defineProperty(accessor, "then", {
        //     value: ((listener) => {
        //         if (get("isInitiator")) {
        //             //not working... noop
        //             set("isInitiator", false);
        //             return listener(channel.now);
        //         }
        //         console.log("is not initiateor");
        //         channel.then(listener);
        //     }) as typeof channel.then,
        // });
        return createAccessor(accessor, inheritence);
    });
Object.defineProperty(unit, Symbol.hasInstance, {
    value: (instance: any) => {
        return instance?.[Symbol.for("unit")];
    },
});

export const product = <T, U = T>(
    dx: Detectable.Derivation<T, U>,
    tx?: Detectable.Transformation<U, T>
) =>
    space(() => {
        let u = unit<U>();
        let inheritence: Set<Detectable.Accessor<any>> = new Set();
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
                inheritence = get<Set<Detectable.Accessor<any>>>(isSetting, 2)!;
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
        return createAccessor(accessor, inheritence);
    });
Object.defineProperty(product, Symbol.hasInstance, {
    value: (instance: any) => {
        return instance?.[Symbol.for("product")];
    },
});

export const moment = <T>(value?: T) => {
    let signal = new Signal<T>(value);

    let accessor = createAccessor((newValue?: T | Error) => {
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

export const event = <T, U = T>(tx: Detectable.Transformation<T, U>) => {
    let u = unit<U>();
    let t = unit<T>();
    let initialized = moment(false);
    tx = untrack(tx) as Detectable.Transformation<T, U>;
    when(() => {
        if (initialized()) {
            let value = t();
            u(tx(value));
        }
    });
    let accessor = createAccessor((newValue?: T) => {
        if (newValue !== undefined) {
            t(newValue);
            if (!initialized()) {
                initialized(true);
            }
        } else {
            return u();
        }
    }, new Set());
    return accessor;
};
