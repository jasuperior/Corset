![logo](corset-logo.png)

# Corset

Corset is not a lingerie brand, its actually a JS/TS library that simplifies managing shared & reactive data. It provides a set of primitives that make it easy to track dependencies, handle async behavior, and manage state and scope in your applications.

## Features

-   **Automatic Dependency Tracking**: Corset tracks dependencies within any `Unit<T>` of time, even with conditional expressions. This means you can focus on writing your application logic without worrying about managing dependencies.
-   **Tiny (4kb gzip)**: Corset is a standalone library that doesn't require any additional modules to work. Its also been split into submodules that can independently be installed per individual use case.
-   **Simple Composable API patterns**: Corset provides a small set of operators and primtives that are infinitely composable, and simple to use and understand. 
-   **And More**: Corset has many more features that require a deeper dive into the core concepts of the library.

## Installation

To install Corset, run the following command in your terminal:

**npm:**

```bash
$ npm install @corset/core
```

**yarn:**

```bash
$ yarn add @corset/core
```

**jsr:**

```
$ npx jsr add @corset/core
-- or
$ deno add @corset/core
```

## Usage

Here's a simple example that demonstrates how to use Corset:

```typescript
import { unit, product, when } from "@corset/core";

let count = unit(0);
let start = unit(false);
let counter = product(() => (start() ? count() : "Count Stopped"));

when(() => {
    console.log(counter());
});
setInterval(() => {
    count(count() + 1);
}, 500);
setTimeout(() => {
    start(true);
}, 1000);
```

In this example, we create two units count and start, and a product counter that depends on start and count. We then use when to log the value of counter whenever it changes.

You can try this code out in the playground.

## Example: Scheduling Promises

Corset allows you to schedule promises within a unit. This means that the execution of the unit will pause until the promise has been resolved. Here's an example:

```typescript
let schedule = unit();
schedule(
    new Promise((res) => {
        setTimeout(() => res(1), 1000);
    })
);
schedule(2);
schedule(3);

when(() => {
    console.log(schedule()); // logs: 1, 2, 3
});
```

In this example, we first create a unit called schedule. We then provide a promise to schedule that resolves to 1 after a delay of 1000 milliseconds. Because of the promise, the execution of schedule is paused.

While the promise is still pending, we schedule two more values, 2 and 3. However, these values won't be triggered until after the promise has been resolved.

Finally, we use when to log the value of schedule whenever it changes. As a result, we see 1, 2, and 3 logged to the console, in that order. The 1 is logged after a delay of 1000 milliseconds, and the 2 and 3 are logged immediately afterwards.

This feature allows you to easily manage asynchronous operations within your units, ensuring that your state updates occur in the correct order, even when dealing with promises.

## API Reference

Coming soon...

## Contributing

Corset is an open-source project, and contributions are welcome. If you're interested in contributing, please see the contributing guide for more information.

## License

Corset is licensed under the MIT license. See the LICENSE file for more details.

> Although Corset is being maintained, this library is purely experiemental at the moment, to explore better patterns for handling state over time. It is currently not in a production ready state.

### More

Corset is seperated into 3 individual sub modules that represent the mode of state it operates on. Explore the readme's to learn more.

-   [@corset/space](./package/space/readme.md): scope, closures, stacks, queues, and persistence. Contains all primitives of space.
-   [@corset/time](./package/time/readme.md): signals, effects, channels, and promises. Contains all the primitives which deal in values over time.
-   [@corset/matter](./package/matter/readme.md): collections, records, memos and structured data. Contains primitives for dealing with groups of related data.
