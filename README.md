# EXPERIMENTAL

These is just a proof of concept about how bots might use middleware. Subject to extreme change. Not meant for production or anything, really.

# How to use

To run the sample bot (which uses the node console):

```
npm install
npm run build
npm start
```

# Quick guide

[sample.ts](src/sample.ts) is what is being run
[middleware.ts](src/middleware.ts) has the definition of middleware
[stateMiddleware.ts](src/stateMiddleware.ts) has an example of middleware which creates an artifact
[time.ts](src/time.ts) has examples of middleware that uses the artifiact from another middleware
