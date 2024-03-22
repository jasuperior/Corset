import {
    expose,
    goto,
    place,
    pull,
    recall,
    space,
    to,
    top,
    now,
    next,
    drag,
    from,
    mark,
    get,
    set,
    define,
} from "@corset/space";
import { Channel } from "./channel";
import { Detectable } from "./time.types";

const isDetecting = Symbol("detecting");
const isBatched = Symbol("batched");
const Untrack = Symbol("untracked");
const Identity = Symbol("identity");
let depth = 0;
let untrack = (cb: Detectable.Listener<any>) => {
    let c = false;
    let p = place(() => {
        define(Identity, p);
        set(Untrack, c);
        //if batched
        let batched = recall<Set<Detectable.Listener<any>>>(isBatched);
        if (batched) {
            batched.add(cb);
            return;
        }
        cb(undefined);
        c = true;
    });
    return p;
};

//how do we batch?
// how do we handle conditionals?
const when = (cb: Detectable.Listener<any>) =>
    space(() => {
        if (get<number>(Untrack, 2)) {
            return;
        }

        let listener = untrack(cb);
        goto(top);
        to(cb);
        to(new Set());
        let ptr = mark(isDetecting);
        listener();
        goto(ptr);
        let producers = drag<Set<Channel>>();
        for (let channel of producers) {
            channel.subscribe(listener as unknown as Detectable.Listener<any>); //we lose identity here by untracking the callback
        }
    });
const thus = (cb: Detectable.Listener<any>) =>
    space(() => {
        set(isBatched, new Set());
        cb();
        let batched = drag<Set<Detectable.Listener<any>>>();
        for (let listener of batched) {
            listener();
        }
    });
const unit = <T>(value?: T) =>
    space<Detectable.Accessor<T>>(() => {
        let channel = new Channel();
        if (value) {
            channel.publish(value);
        }
        let accessor = ((newValue?: T) => {
            
            if (newValue !== undefined) {
                channel.publish(newValue);
            } else if (recall(isDetecting)) {
                let producers = now<Set<Channel>>();
                producers.add(channel);
            }else {
                if(recall(Identity)) {
                    let id = recall<Detectable.Listener<any>>(Identity)!;
                    if(!channel.listeners.has(id)) {
                        channel.subscribe(id);
                    }
                }
            }
            return channel.now;
        }) as Detectable.Accessor<T>;
        return accessor;
    });

const product = <T, U = T>(
    dx: Detectable.Derivation<T, U>,
    tx: Detectable.Transformation<
        U,
        T
    > = dx as unknown as Detectable.Transformation<U, T>
) =>
    space(() => {
        let u = unit<U>();
        let accessor = ((newValue?: U) => {
            if (newValue !== undefined) {
                if (recall(u)) {
                    return u();
                }
                to(true);
                mark(u);
                return u(newValue);
            }
            return u();
        }) as Detectable.Accessor<U>;

        when(() => {
            u(dx());
        });
        when(() => {
            tx(u());
        });
        return accessor;
    });

let u = unit(5);
let u2 = unit(10);
when(() => {
    u() < 10 ? 4 : u2(); //?
});
u(16);
u2(99);
u2(109)
u(1)
// let k = place(() => {
//     let x = get<number>("test"); //?
//     if (x) {
//         set("test", x + 1);
//         console.log(x);
//         return;
//     }
//     set("test", 1);
// });

// k(); //?
// k(); //?
// k(); //?
