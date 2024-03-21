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
} from "@corset/space";
import { Channel } from "./channel";
import { Detectable } from "./time.types";

const detecting = Symbol("detecting");
const untracked = Symbol("untracked");
let depth = 0;
let untrack = (cb: Detectable.Listener<any>) => {
    let p = place(() => {
        to(untracked);
        mark(untracked);
        return cb(undefined);
    });
    cb.identity = p;
    return cb;
};
const when = place((cb: Detectable.Listener<any>) => {
    goto(top);
    if (recall(untracked)) {
        console.log("untracked", depth);
        return;
    }
    depth++;
    to(detecting);
    let ptr = mark(detecting);
    cb(undefined);
    // to(detecting);
    let value: Channel | typeof detecting = goto(ptr);
    pull();
    value = pull();
    while (value !== detecting && value !== undefined) {
        value.subscribe(untrack(cb) as unknown as Detectable.Listener<any>); //we lose identity here by untracking the callback
        value = pull();
    }
    depth--;
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
            } else if (recall(detecting)) {
                recall(detecting);
                to(channel);
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
const rule = <T>(dx: Detectable.Derivation<T>) =>
    space(() => {
        let channel = new Channel();
        when(() => {
            channel.publish(dx());
        });

        if (recall(detecting)) to(channel);
        // return accessor;
    });
const t = unit(5);
const t2 = unit(14);
const test = () => {
    return t() + t2();
};
const p = product(test, (v: number) => {
    console.log(recall(detecting));
    console.log(next())
    return (t(v - t2()) + t2(v - t())) as number;
});
when(() => {
    console.log(p(), t());
});
// t2(54);
// t2(78686); //?
// t2(76); //?
// t(535);
p(99);
