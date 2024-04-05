![logo](./corset-space-logo.png)

# @Corset/Space

## Mastering Space in your Application

Corset **Space** is a library that gives you power over scope and context. Using a stack based api, it exposes a comprehensive api for operating calltime targeted scopes around functions; allowing for functions to share state seemlessly, providing contextualized behavior, while maintaining function purity.

### Installation

With just a few simple commands, you can integrate Corset Time into your project effortlessly:

```bash
npm install @corset/space
# or
yarn add @corset/space
```

## Core Concepts

The goal of the **Space** submodule is to provide a simple api for exposing function scope to the call scope of surrounding functions. This is extremely useful for sharing necessary dependencies to the functions which require them.

This library was produced to make detecting changes in effects easier to track within the Corset [Time library](../time/readme.md).

The core primitives exported are **spaces** and **places**. Each will be explained further below, but whats important to note about them both, is that they provide a sharable, orthoganl scope to functions defined to be one of them. This means, that when calling a function defined to be a `space`/`place`, it is able to broadcast variables from within its scope to be exposed to outer and inner function scopes.

This will make more sense by example.

### What is a `Space`?

A space is defined a function which spawns a scope when it is called. The function of a space is called implicitly when it is defined. This means that all exposed variables within its scope are transient and thus destroyed once the function is returned.

To define a space, import the `space` primitive constructor, and wrap your function with it.

**Example:**

```ts
import { space } from "@corset/space";

let myspace /**iykyk*/ = (a: number) =>
    space(() => {
        return a + 1;
    });

myspace(1); //Outputs: 2
```

In the above example, we're simply defining a space, which operationally, simply acts as a normal function on its own. The thing to note here is that a `space` only exists during the moment it is defined, thus to capture it you must return a space from another function.

#### So its just a function?

No. by wrapping a function in a space, it has access to a scope that has access to surrounding scopes, as well as the ability to expose its own scope to other functions.

Corset Space provides operators for working with these values.

**Example:**

```ts
import { space, get, set } from "@corset/space";

const relativeAdd = () =>
    space(() => {
        let term1: number = get<number>("term1", 2), //search up to 2 levels up for variable with name "term1"
            term2: number = get<number>("term2", 2);
        return term1 + term2;
    });

space(() => {
    set("term1", 10); //set term1=10 in this scope
    set("term2", 5); //set term2=5 in this scope
    let result = relativeAdd();
    console.log(result); //Outputs: 15
});
```

This is a trivial example, however it demonstrates the point of creating a space, which is to share data up the call stack. In this example, we define the variables `term1` and `term2` in the parent scope, and are able to retrieve it from the child scope without the need to pass it explicitly as a parameter.

You'll also notice that we can specify the search depth when opting to retrieve a value from the context. The `get` operator will search up to `n` scopes up the chain and return the first value `v` that matches the search query.

So if we alter the previous example like so:

**Example:**

```ts

const relativeAdd = () =>
    space(() => {
        let term1: number = get<number>("term1", 3), // increase the search depth to 3
            term2: number = get<number>("term2", 3);
        return term1 + term2;
    });

const outerAdd = () => space(() => {
    set("term2", 5);
    return relativeAdd();
})
space(()=>{
    set("term1", 10)
    let result = outerAdd();
    console.log(result) //Outputs: 15
```

In this example `result` contains the same value because we've increased the search range to 3, thus, the `relativeAdd` function will search up the call stack up to 3 scopes for a given variable. So its able to find `term1` from the parent scope, and `term2` from the `outerAdd` scope, and still return the same value.

> Learn more about all of the available operators for operating on the scope chain in the [Operators](#operators) section below.

### What is a `Place`?

 A **Place** is a space, with a permanent scope that dynamically assigns the surrounding scope as its parent scope. This means, whereas a variable defined within a space is reset on every call, a `place` is able to have persistent scope. 

 **Example:**
 ```ts
import {place, get, set} from "@corset/space"

let statefulAdd = place((a: number) => {
    let b = get<number>("prev") ?? 0;
    set("prev", a);
    return a + b;
});

statefulAdd(1); //Outputs: 1
statefulAdd(2); //Outputs: 3
statefulAdd(3); //Outputs: 6
```
In the above example, it is first important to note that the `place` constructor returns a function with has the same definition as the one provided to it. However, another thing of note is the face that the `place` preserves the state of the last call to it. So, for every call, we're able to use the context of the last call to alter the result in a coherent way. 

