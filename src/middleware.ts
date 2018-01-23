import { BotRequest, BotResponse } from './bot';

export interface Middleware {
    activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ): Promise<void>;
    
    turnWillEnd (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ): Promise<void>;
}

export const defaultMiddleware: Middleware = {
    activityWasReceived (req, res, next) {
        return next();
    },

    turnWillEnd (req, res, next) {
        return next();
    }
}

export function normalizeMiddleware (middleware: Partial<Middleware>): Middleware {
    return middleware.activityWasReceived && middleware.turnWillEnd
        ? middleware as Middleware
        : { 
            activityWasReceived: middleware.activityWasReceived
                ? (req, res, next) => middleware.activityWasReceived(req, res, next)
                : defaultMiddleware.activityWasReceived,

            turnWillEnd: middleware.turnWillEnd
                ? (req, res, next) => middleware.turnWillEnd(req, res, next)
                : defaultMiddleware.turnWillEnd
        }
}
