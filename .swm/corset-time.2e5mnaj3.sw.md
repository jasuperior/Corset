---
title: Corset Time
---
<SwmSnippet path="/package/time/src/primitives.ts" line="242">

---

&nbsp;

```typescript
export const unit = <T>(value?: T, eq?: Detectable.Equality<T>) =>
    space<Detectable.Unit<T>>(() => {
        let channel = new Channel(eq); //add a tag instance to the channels to track inheritenc
        let inheritence: Set<Detectable.Unit<any>> = new Set();
        if (!Object.is(value, undefined)) {
            channel.publish(value as T);
        }
        let accessor = (newValue?: T) => {
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
        return createUnitAccessor(accessor, inheritence);
    });
```

---

</SwmSnippet>

<SwmMeta version="3.0.0" repo-id="Z2l0aHViJTNBJTNBQ29yc2V0JTNBJTNBamFzdXBlcmlvcg==" repo-name="Corset"><sup>Powered by [Swimm](https://app.swimm.io/)</sup></SwmMeta>
