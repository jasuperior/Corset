# @Corset/Time: Mastering Time in Reactive Programming

Welcome to Corset Time, a powerful library designed to revolutionize the way you handle dynamic values over time in your applications. With Corset Time, you can harness the power of reactive programming to create applications that are more responsive, efficient, and intuitive.

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

## Usage

Corset Time provides a set of powerful primitives that allow you to manage dynamic data over time with ease. Here, we'll delve into each of these primitives, providing detailed explanations and comprehensive examples to help you get started.

### `Unit`: The Fundamental Observable

**Description**: At the heart of Corset Time is the `unit` - an observable value that can be accessed and modified over time. Units serve as the basic building blocks for managing dynamic data within Corset Time.

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

**Reference to Source Code**:

-   The `unit` function is defined in the source code [here](#creating-a-unit-of-time).

#### Handling Asynchronous Values

Units of time can handle asynchronous values seamlessly. By passing a Promise to the unit function, Corset Time implicitly resolves the Promise and sets the unit's value once resolved.

```ts
import { unit } from "@corset/time";

// Create a unit representing an asynchronous value (e.g., fetching data from an API)
const userData = unit(async () => {
    const response = await fetch("https://api.example.com/user");
    const data = await response.json();
    return data;
});

// Access the user data (implicitly waits for the Promise to resolve)
const user = await userData();

console.log(user); // Outputs: { id: 1, name: "John Doe", email: "john@example.com" }
```

When using promises in a unit, await keyword is only necessary when using the unit explicitly. Usually, however, the unit will be used in conjuction with [detectable operators](#detectable-operators).

#### Defining a Custom Comparison Function

Units of time allow developers to define a custom comparison function to determine equality between values. This can be useful when dealing with complex data types or scenarios where strict equality doesn't suffice.

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

**Description**: Products are derived units of time that are computed based on one or more other units. They automatically update whenever their dependencies change, allowing you to create complex data representations with ease.

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

**Reference to Source Code**:

-   The `product` function is defined in the source code [here](#creating-a-derived-unit).

### Signals

**Description**: Signals represent values that change over time and are awaited but never change after initialization. They facilitate precise event management and asynchronous workflows.

**Example**:

```typescript
import { moment } from "@corset/time";

// Create a signal representing the start time of an event
const eventStart = moment(new Date());

// Later in the code...
// If the event has started, await it
await eventStart;

console.log("Event has started!");
```

**Reference to Source Code**:

-   The `moment` function is defined in the source code [here](#creating-a-moment).

### Events

**Description**: Events are units that trigger changes only when they are called. They enable developers to handle discrete events and manage interactions within applications.

**Example**:

```typescript
import { event } from "@corset/time";

// Define an event representing a button click
const buttonClicked = event(() => "Button Clicked!");

// Triggering the button click event
console.log(buttonClicked()); // Outputs: "Button Clicked!"
```

**Reference to Source Code**:

-   The `event` function is defined in the source code [here](#creating-an-event).

### Subscription to Changes

**Description**: The `when` function allows developers to subscribe to changes in units, derived units, or signals. It provides a mechanism for executing callbacks when certain conditions are met.

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

**Reference to Source Code**:

-   The `when` function is defined in the source code [here](#executing-a-callback-when-a-certain-condition-is-met).

---

## Contributing

Contributions to Corset Time are welcome! If you find any issues or have suggestions for improvements, please feel free to open an issue or submit a pull request on the [GitHub repository](https://github.com/corset/corset-time).

## License

Corset Time is licensed under the MIT License. See [LICENSE](https://github.com/corset/corset-time/blob/main/LICENSE) for more information.

## Acknowledgements

Corset Time is built upon the foundation of Corset, a powerful library for reactive programming. We would like to thank all the contributors to Corset for their valuable contributions and support.

---

**Note**: Delve deeper into the inner workings of Corset Time by exploring the source code and additional documentation. Unlock the full potential of reactive programming today!
