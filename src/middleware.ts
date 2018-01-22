import { BotRequest, BotResponse } from './bot';

export interface Middleware <T extends {} = {}>{
    activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ): Promise<void>;
    
    middlewareWillBeDisposed (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ): Promise<void>;

    forTurn (
        req: BotRequest,
        res: BotResponse
    ): Promise<T>;

    dispose (
        req: BotRequest,
        res: BotResponse
    ): Promise<void>;
}

export const defaultMiddleware: Middleware = {
    activityWasReceived (req, res, next) {
        return next();
    },

    middlewareWillBeDisposed (req, res, next) {
        return next();
    },

    forTurn (req, res) {
        return Promise.resolve({
            artifact: {}
        });
    },

    dispose (req, res) {
        return Promise.resolve();
    }
}

export function normalizeMiddleware <T extends {} = {}> (middleware: Partial<Middleware<T>>): Middleware<T> {
    return middleware.activityWasReceived && middleware.middlewareWillBeDisposed && middleware.forTurn && middleware.dispose
        ? middleware as Middleware<T>
        : { 
            activityWasReceived: middleware.activityWasReceived
                ? (req, res, next) => middleware.activityWasReceived(req, res, next)
                : defaultMiddleware.activityWasReceived,

            middlewareWillBeDisposed: middleware.middlewareWillBeDisposed
                ? (req, res, next) => middleware.middlewareWillBeDisposed(req, res, next)
                : defaultMiddleware.middlewareWillBeDisposed,

            forTurn: middleware.forTurn
                ? (req, res) => middleware.forTurn(req, res)
                : defaultMiddleware.forTurn,

            dispose: middleware.dispose
                ? (req, res) => middleware.dispose(req, res)
                : defaultMiddleware.dispose,
        } as Middleware<T>;
}
