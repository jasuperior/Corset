# @Corset/Time

## Mastering Time in Reactive Programming

Corset Time is a powerful library designed to revolutionize the way you handle dynamic values over time in your applications. With Corset Time, you can harness the power of reactive programming to create applications that are more responsive, efficient, and intuitive.

Corset Time is built on the concept of 'units of time' - observable values that can be accessed and modified over time, whilst being detected by encapsulating effects.

## Key Features

-   **Ease of Use**: Corset Time's API is designed to be intuitive and easy to use, reducing the learning curve and allowing you to get started quickly.

-   **Improved Developer Experience**: Corset Time enhances developer experience by providing a clear and concise way to handle dynamic values over time, reducing complexity and improving readability.

-   **Efficient Data Handling**: With the concept of 'units of time', 'products', and 'signals', Corset Time offers a powerful and flexible approach to managing dynamic data.

-   **Asynchronous Support**: Corset Time's 'signals' handle asynchronous values seamlessly, implicitly resolving Promises and updating the unit's value once resolved.

-   **Reactive Programming**: Corset Time brings the power of reactive programming to your applications, allowing you to create more responsive and efficient applications.

### Installation Made Easy

With just a few simple commands, you can integrate Corset Time into your project effortlessly:

```bash
npm install @corset/time
# or
yarn add @corset/time
```

### Harness the Power of Reactive Values

Corset Time introduces the concept of units of time, derived units, signals, and events, offering unparalleled flexibility in handling dynamic data. Let's explore some of the key features:

## Detectable Units

Corset Time provides a set of powerful primitives that allow you to manage dynamic data over time with ease. Here, we'll delve into each of these primitives, providing detailed explanations and comprehensive examples to help you get started.

### `Unit`: The Fundamental Observable

At the heart of Corset Time is the `unit` - an observable value that can be accessed and modified over time. Units serve as the basic building blocks for managing dynamic data within Corset Time.

**Example**:

```typescript
import { unit } from "@corset/time";

// Create a unit representing temperature
const temperature = unit(25); // Initial temperature value is 25°C

// Modify the temperature value
temperature(30); // Set temperature to 30°C

// Access the temperature value
console.log(temperature()); // Outputs: 30
```

Units always return their latest value, even when being set.

```typescript
assert(temperature(40) === 40);
```

This guarentees the freshest state of your application. Under the hood, Corset queues each value passed to the unit, allowing for units to accept asyncronous values, whilst also guarenteeing the set order of the unit.

#### Handling Asynchronous Values

Units of time can handle asynchronous values seamlessly. By passing a Promise to the unit function, Corset Time implicitly resolves the Promise and sets the unit's value once resolved.

**Example:**

```ts
import { unit } from "@corset/time";

let users = unit<User[]>([]);
users(fetch("https://api.com/users"));
console.log(users()); //Outputs: []
users.then(console.log); //Outputs: User[]
```

> When using promises in a unit, await keyword is only necessary when using the unit explicitly. Usually, however, the unit will be used in conjuction with [detectable operators](#detectable-operators).

In the above example, the users array can be consumed immediately as an empty array, then after the promise resolves, the unit will reset its value to the return value of the promise.

This behavior queues up, so you can consume a set of promises in parallel, and they will resolve to the unit in the order they were received.

```typescript
users(fetch("https://api.com/users/p/1"));
users(fetch("https://api.com/users/p/2"));

await users; // Outputs: Users[] from p1
await users; // Outputs: Users[] from p2
```

#### Defining a Custom Comparison Function

Units allow developers to define a custom comparison function to determine equality between values. This can be useful when dealing with complex data types or scenarios where strict equality doesn't suffice.

```ts
import { unit } from "@corset/time";

// Define a custom comparison function for comparing arrays
const arrayComparison = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
};

// Create a unit with a custom comparison function
const shoppingList = unit(["apple", "banana"], arrayComparison);

// Modify the shopping list
shoppingList(["banana", "apple"]); // Set a new value (order reversed)

// Access the shopping list
console.log(shoppingList()); // Outputs: ["banana", "apple"]
```

### `Product` : Derived Units

Products are derived units of time that are computed based on one or more other units. They automatically update whenever their dependencies change, allowing you to create complex data representations with ease.

**Example**:

```typescript
import { product, unit } from "@corset/time";

// Define units
const temperature = unit(25);
const humidity = unit(60);

// Create a derived unit representing weather conditions
const weather = product(
    // Derivation function
    () => `Temperature: ${temperature()}°C, Humidity: ${humidity()}%`
);
```

#### Bidirectional Products

The product function also supports an optional transformation function, allowing developers to create bidirectional derived units. This transformation function defines how the product is transformed when a new value is set.

```ts
import { product, unit } from "@corset/time";

// Define units
const celsius = unit(25);
const fahrenheit = product(
    // Derivation function (convert Celsius to Fahrenheit)
    () => (celsius() * 9) / 5 + 32,
    // Transformation function (convert Fahrenheit to Celsius)
    (newValue: number) => {
        // Update the value of the Celsius unit
        celsius(((newValue - 32) * 5) / 9);
        return newValue;
    }
);

// Accessing the current temperature in Fahrenheit
console.log(fahrenheit()); // Outputs: 77°F

// Modifying the temperature in Fahrenheit
fahrenheit(68);

// Accessing the updated temperature in Celsius
console.log(celsius()); // Outputs: 20°C
```

### `Moment`: A Defered Trigger

Moments are like a loaded gun with a single bullet. It represents a moment in time which happens once and remains constant for the remainder of time.
Under the hood, they are simply abstractions over `Signal`s. They facilitate precise event management and asynchronous workflows, by providing a controllable promise that can be provided as a value to a unit.

> I'm aware that the name "Signal" is commonly used by other frameworks to represent something more akin to a `unit` in Corset. But its a design decision which was made deliberately.

**Example**:

```typescript
import { moment } from "@corset/time";

// Create a signal representing the start time of an event
const party = moment<string>();

// Later in the code...
// If the event has started, await it
(async () => {
    let chant = await party // Outputs: "Raise the roof!"
    //... rest of the business logic
}());

//... after some time
party("Raise the roof!")

console.log("Event has started!");
```

In the example, the moment is able to halt the execution of the async function until party is supplied a value. Once the value has been set, the moment is resolved, and will continue to return `"Raise the roof"` until the party is over.

This becomes more useful when combined with Detectable Operators.

### `Events`: A Unit of a Function

Events are units with a user defined setter, the value of the unit being the return value of the supplied setter. This unit is most useful for mapping data from external event sources into a detectable data stream.

**Example**:

```typescript
import { event } from "@corset/time";

// Define an event representing a button click
const clicks = event<Event>((evt) => evt);

const div = document.createElement("div");
div.addEventListener("click", clicks);

div.click();

console.log(clicks()); //Outputs: Event<HTMLDivElement>
```

In the above example, the event simply returns the click event supplied by the div. the resulting unit becomes an atomic unit of the set of all clicks provided by the element over time. This is a trivial example, however, one can imagine using an event to map some data from an event source to a desired shape, and utilize the value returned to the unit within his business logic.

## Detectable Operators

Corset Time provides a set of detectable operators that allow you to react to changes in units. These operators - `when`, `whenever`, `thus`, and `unless` - offer a flexible and intuitive way to manage dynamic data, enabling you to create applications that are more responsive and efficient.

### `When`: Subscription to Synchronous Changes

The `when` function allows developers to subscribe to changes in units. It triggers the provided callback function each time a member unit's value is updated. If you've worked with frameworks like Preact or Solid, you'll find the when function familiar as it shares the same interface as the effect function in these frameworks. This makes when an intuitive and efficient way to manage dynamic data in your applications.

**Example**:

```typescript
import { when, unit } from "@corset/time";

// Define a unit representing stock price
const stockPrice = unit(100);

// Subscribe to changes in stock price
when(() => {
    console.log(`Stock price changed to $${stockPrice()}`);
});

// Later in the code...
// Modify the stock price
stockPrice(110); // Outputs: "Stock price changed to $110"
```

The callback is called immediately upon being defined, and runs synchronously. This, as opposed to the asynchronous behavior that [`how`](#how-subscription-to-sequential-changes) is better equip to handle.

#### Implicitly Handle conditional statements

`when` will progressively subscribe to it's dependents as it detects their existence. This means, units which are retrieved behind an uninitiated case of a condition, will be subscribed to when their respective condition is met.

**Example:**

```typescript
const user = unit(fetch("/users/1"));
const username = product(() => user()?.username);
const message = user("Hello, ");
when(() => {
    if (user()) {
        console.log(message() + username());
    } else {
        console.log("loading...");
    }
});

//...business logic

user.then(() => {
    message("Goodbye, ");
});

/**
 * Outputs:
 * "loading..."
 * "Hello, <Username>"
 * "Goodbye, <Username>"
 */
```

In the above example, the message is only logged once the user has been loaded and set on the `user` unit. Once the condition has been met, `when` subscribes to the `message` and `username` unit, making it possible to later change `message` and trigger the console log again provided `user` is still defined.

### `How`: Subscription to Sequential Changes

The `how` operator utilizes a generator in order to execute as yielded units are triggered.

**Example:**

```typescript
let count = unit(0);
how(function* () {
    yield count; // Output: 1
    yield count; // Output: 2
    yield count; // Output: 3
});

count(1);
count(2);
count(3);
```

In the above example, `how` halts execution until it receives the next value broadcast by the unit. This allows the body to capture the next 3 values output by the unit.

#### Operation loops forever

The body of the generator is called recursively, so once the function has complete, it will automatically restart the method from the start.

```typescript
let count = unit(0);
how(function* () {
    yield count; // Output: 1 , 4
    yield count; // Output: 2 , 5
    yield count; // Output: 3
});
count(1);
count(2);
count(3);
count(4);
count(5);
```

#### Handles other operations

When yielding another operation, `how` subscribes to the operation once its yielded, and unsubscribes from any yielded operations once the body has returned.

```typescript
let toggle = unit(false);
let count = unit(0);

how(function* () {
    yield toggle;
    yield when(() => {
        console.log(`Count: ${count()}`);
        /**
         * `Count: 0`
         * `Count: 1`
         * `Count: 2`
         * `Count: 4`
         */
    });
    yield toggle;
});
toggle(true);
count(1);
count(2);
toggle(false);
count(3);
count(4);
toggle(true);
```

In the example above, we create a method that toggles the detection of changes to a `count` unit. The `when` operation, which logs the count, is yielded after the `toggle` unit is set to `true`. This starts the `when` operation's subscription. When the `toggle` unit is set to `false`, the `how` function's body completes execution, causing it to unsubscribe from the when operation. This effectively toggles the detection of changes to the `count` unit.

---

## Contributing

Contributions to Corset Time are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/corset/corset-time).

## License

Corset Time is licensed under the MIT License. See [LICENSE](https://github.com/corset/corset-time/blob/main/LICENSE) for more information.

## Acknowledgements

Corset Time is built upon the foundation of Corset, a powerful library for reactive programming. We would like to thank all the contributors to Corset for their valuable contributions and support.

---

**Note**: Delve deeper into the inner workings of Corset Time by exploring the source code and additional documentation. Unlock the full potential of reactive programming today!
