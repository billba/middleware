# Proposal for BotBuilder v4 Middleware/Context

This repo represents a proposal to change to the way BotBuilder v4 handles middleware and "context". At its heart it is an abstract proposal, in that there are many ways it could be implemented. However in the interests of initiating a concrete conversation, this repo includes a strawman implementation and multiple samples. This implementation is not meant to be "production ready" but it should suffice to illustrate the spirit of the proposal.

## The Problem

BotBuilder v4 is build on an `adapter`, which provides a function for sending `activities` from the bot to the channel, and the ability to register a callback to be run on each activity produced by the channel.

However this will frequently be too low-level for most developers. The `Bot` class introduces the notion of a `context` object created for each turn. It includes the incoming activity (request) and a batched approach to sending messages. A plugin architecture exists in the form of a middleware stack. A given piece of middleware is encouraged to expose functionality to the bot developer (and other middleware) by mutating the context, adding properties and/or methods as it sees fit. For example, the following code adds `context.hooray()`.

```ts
    bot.use({ createContext(context, next) {
        context['hooray'] = () => context.reply("Hooray!");
    }})
```

This approach is undoubtedly convenient and efficient. However it comes with a number of issues which have become more clear over time:

### Namespace

Since any middleware can mutate `context` as it sees fit, namespace collisions are inevitable. What happens when I want to use middleware X, which injects in a `log()` method, and middleware Y, which does the same?

### Typing

`context` begins as an object of type `BotContext`. Each piece of middleware potentially changes the type of `context`. TypeScript can use declaration merging to incorporate middleware additions into `BotContext`, but only in aggregate. In other words, the type of `BotContext` reflects the resultant type after running *all* the middleware, but it could be incorrect for any *given* piece of middleware. For example, middleware Y may depend on function `foo()` having been added to `context` by middleware X. But if the middleware is added in the wrong order, then it's not there yet, even though the typing indicates that it is. Instead of this bug being found at compile time, middleware Y must manually check for the existance of `foo()` at runtime.

In JavaScript, this sort of thing is quite normal, but in languages with more restictive typing, like Java, none of this is even an option.

### Dependencies

The larger problem is that this approach encourages hardcoded dependencies within middleware. What middleware Y really wants is a `foo()` function. But instead of passing that function directly to Y on creation, or Y requesting it from a Dependency Injection framework, Y is forced to look for it in `context`, hoping that middleware X put it there.

These hardcoded dependencies, only enforced at runtime, means that developers will have to rely on documentation and trial and error.

Ultimately the result of all this will be a fragile web of dependencies, which will not make for a happy ecosystem.

### Testing

Hardcoded dependencies mean that testing is that much harder. To test Y means constructing a mocked context containing every dependency of Y.

## My Proposal

**I propose that middleware not be encouraged to mutate context.** Microsoft middleware would not do so, nor would published samples.

If middleware doesn't mutate context, then all the above problems go away. Dependencies can be injected directly into middleware and bot logic using well-known patterns.

However, as mentioned above, encouraging middleware to add functionality by mutating context is convenient and efficient. It allows a bot developer to start with a base context and add the functionality they want, then pass that context around their code as they see fit.

My strawman implementation illustrates that, with a slightly different middleware pattern and some useful helpers, we can have our cake and eat it too.

## My strawman implementation

As mentioned above, an adapter provides all that is necessary for communicting with a channel. But it certainly isn't convenient. Most developers would expect a higher-level abstraction. But, by definition, any higher-level abstraction adds opinions. So the goal is to layer gradually, with each layer adding the minimum number (and right shape) of opinions.

### Turn

This implementation focuses on the concept of a "turn", which is defined as the lifecycle of a request (incoming activity or "proactice" session).

A turn is served by a class called `Turn` which is essentially a base context (I'm saving the word "context" for later):

```ts
export interface Turn {
    id: string;

    request: Activity;

    responses: Activity[];
    flushResponses: FlushResponses;
}
```

The functionality this adds above the base adapter is:
* an `id` which is unique per turn (request). In a little while we will see where this is helpful
* a batched approach to sending activities to the channel

Note that request is not optional. In the case of a proactive turn, the request is an activity of type 'proactive'.

Why a batched approach? Because there are a number of channels that allow or essentially require multiple activities to be sent as a group. By starting with a batched approach as a foundation, it's easy to expose a non-batched API. It's harder to do it the other way around.

This is still very low level. For instance, there is no `reply` function. That's because this is itself an opinion. Should it take just an activity?Or also text? Or just text? Should it be called "reply" or "send"? Or even "ask"? Should it be fluent, so that you can do `say("Hey there").ask("What's your name?")`? Should it be asynchronous so that you can wait for the message to be sent, or just contribute activities to the batch? Just as there are innumerous JavaScript libraries that help you make REST calls, there will be many approaches, each appealing to different developers and more or less relevant to different projects.

This illustrates the philosophy of a Turn, which is to provide the minimal foundation necessary to build even higher-level abstractions.

### TurnAdapter

This is my version of `Bot`. (I'm not attached to the name.)

This provides:

* A middleware stack for turns and posts
* A message pump for requests (incoming activities)
* A convenient way to send "proactive" activities

The main difference between `TurnAdapter` and `Bot` is the lack of a `createContext` middleware function. That's because middleware is not expected to modify context. A minor difference (aside from naming) is that the `post` middleware doesn't take a `next` function. Instead, `turn.flushResponses()` performs that function.

To see Turn and TurnAdapter in action, look at [Sample 1: Basic](samples/basic.ts). To run any of the samples listed here, which all use the `ConsoleAdapter` just:

0. clone this repo
1. `npm install`
2. `npm run build`
3. `node dist/samples/SAMPLE_NAME.js`
4. type things and hit return
5. ^c when you're done

TurnAdapter allows you to specify middleware in its constructor and/or by calling `.use()`.

This sample shows that you can work with a plain Turn but it's kind of a pain. Very quickly you see the need for higher-level abstractions to make your life easier.

### adding abstractions

[Sample 2: Simple](samples/simple.ts) takes the Basic sample and adds a helper abstraction called `simple` which gives batched and async versions of `reply` and `send`. Both the `yoify` middleware and the `onRequest` message loop use this helper to simplify sending replies.

This is nice because the bot developer can pick whatever abstraction(s) they want to use. But I miss the simplicity of taking a base context and adding the functionality I want.

### working with context

[Sample 3: Context](samples/context.ts) takes the Simple sample and introduces the notion of a Context object by:

* creating a type called `Context` (this is just a convention - call it anything you want)
* creating a function called `getContext` that takes a Turn and transforms it into a Context
* creating a function called `withContext` that allows you to take any function that takes a Turn and instead use a Context
* splitting off an `echo()` helper function which takes a Context as an argument

(GetContext and WithContext are simple helpers that make it a little easier to do this stuff, but they aren't necesssary.)

Note that `yoify` is still working directly with the `simple` helper. You absolutely *could* author both your middleware and bot logic to share a single `Context` type and `getContext` function. But it is will be more common for middleware to be authored separately, and I want to emphasize that every piece of logic can do things its own way. We don't all have to agree on what a context looks like.

You can, as shown in this sample, just take a Turn and add functionality to it. But you actually have complete control. It's your object. You can call things whatever you want. Perhaps you have a less technical team -- your `Context` can just have a simple `reply()` function with no access to `responses` or `flushResponses()`.

### TurnService

`simple` is just a function that takes a Turn and returns an object. It's a little inefficient that `simple` is being called twice for the same turn, once in `getContext` and once in `yoify`. In a perfect world, we'd just create it once per turn and reuse it. There are many ways to do this, including a number of DI libraries. I wrote a very lightweight DI library called `TurnService` that allows you to:

* request a value any number of times per turn, but only create it the first time. Subsequent calls will return a cached value.
* dispose of the cached value, performing any cleanup required

`TurnService` uses the `id` value of a Turn to make all its trains run on time.

In [Sample 4: SimpleService](samples/simpleService.ts) we:

* create `simpleService`, an instance of a `TurnService` class called `SimpleService`, which wraps `simple`
* convert yoify into a class called Yoify, and pass `simpleService` into its constructor. We could have just closed over the global `simpleService`, but this allows us to
    * express the dependency more explicitly
    * move Yoify into another file
* in Yoify's `turn` middleware function, call `simpleService.get(turn)`. This ends up calling `simple(turn)` and putting it in a cache.
* in getContext, call `simpleService.get(turn)`. This retrieves the value from the cache.
* adds a piece of ad-hoc middleware that calls `simpleService.dispose(turn)` to clear the cache and free up that memory. Note that this middleware is listed first so that it is the last middleware run at the end of the turn.

That ad-hoc middleware is pretty ugly. It would be nice if SimpleService could also act as middleware, and just dispose of itself. Spoilers: it can!

### TurnService & Middleware

In [Sample 5: SimpleMiddleware](samples/simpleMiddleware.ts) we:

* change `simpleService` to `simpleMiddleware`, an instance of SimpleMiddleware, which extends SimpleService *and* implements the `turn` middleware function
* replace the ad-hoc middleware with `simpleMiddleware`, so that it can clean up after itself.

Note that we do not change `Yoify` at all. That's because `simpleMiddleware` inherits from `SimpleService` and therefore we can continue to pass it to anything expecting an instance of `SimpleService`.

Now our code is looking clean again. Every piece of middleware could utilize simpleService, but `simple` would only ever be called once.

It's important to emphasize that any number of DI frameworks or patterns could be used instead of `TurnService`. You don't have to use DI at all. You can write your code however you want. The point of this exercise was to demonstrate that it's easy to write middleware and bot logic that efficiently share access to multiple services without having to mutate a single context object on every turn.

### Recognizers

Recognizers are a great example of code that you want to run, at most, once per turn, so it fits perfectly into this pattern. In [Sample 6: Recognizer](samples/recognizer.ts) we:

* create `regexpRecognizer`, an instance of `RegexpRecognizer`, which is both a `TurnService` and `Middleware`
* add it to the middleware stack so that it can clean up after itself
* access `regexpRecognizer.recognize()` from a piece of ad-hoc middleware, which shouts out any passing intents
* add an intent property to `Context` and fill it in `getContext` using `regexpRecognizer.recognize()`
* check `context.intent` in `echo()` and act accordingly on any introductions

### State

State fits into this pattern nicely, and allows us to demonstrate:

* the async version of TurnService
* a service cleaning up after itself. In this case, persisting the changed state.

In [Sample 7: State](samples/state.ts) we:

* create a type called `ConversationState` (this name is purely convention)
* create `stateManager`, an instance of `StateManager<ConversationState>`, which is both an `AsyncTurnService` and `Middleware`, using an in-memory store
* add it to the middleware stack so that it can clean up after itself (crucially, persisting the updated state)
* access `await stateManager.get(turn)` from a piece of ad-hoc middleware, which puts the current turn count into to the state
* add a `state` property to `Context` and fill it in `getContext` using `await stateManager.get(turn)`
* utilize `context.state.conversation.count` in `echo()`

### Proactive sessions

We'd like access to all of the above goodness for proactive messages too.

In [Sample 8: Proactive](samples/proactive.ts) we:

* add another intent check to `echo()` -- on 'start' we begin an endless loop which runs a proactive session every three seconds

When creating a proactive session, you must pass a source activity. This can be any request from the channel. The relevant address fields are copied from this activity into a new `Activity` of type `proactive`, and are used when the proactive session wishes to "reply" to a given user.

Note that the proactive session runs through all the same middleware. If you want your middleware to apply differently to proactive sessions, simply check `turn.request.type`.

Also note that each proactive session gets its own turn ID, which is crucial.

Finally, in this example, the proactive session shares `Context` definition and initialization with the `onRequest` logic, but it doesn't need to. In fact, they could be totally different, allowing your app to share proactive logic with other apps without having to agree on what a `Context` looks like.

### Cleanup

This sample has gotten a little busy. But most of the code is about setting up the bot. The actual bot logic is quite simple. It's quite simple to separate the boilerplate setup code from the bot logic.

In [Sample 9: Cleanup](samples/cleanup.ts) we do just that, moving the setup code into [its own file](samples/setup.ts), and exporting just a few simple symbols. This reflects what might be a common scenario - a technical manager creates boilerplate for a bot, which is coded up by less technical employees.

## Parting words

T