import { Activity } from './activity';
import { Adapter } from './adapter';
import { toPromise } from './misc';
import { read } from 'fs';

export type PostMiddleware = (
    turnID: string,
    activities: Activity[],
    request: Activity,
    next: () => Promise<void>,
) => Promise<any>;

export type TurnMiddleware = (
    turnContext: Turn,
    next: () => Promise<void>
) => Promise<any>;

export type Middleware = {
    post?: PostMiddleware;
    turn?: TurnMiddleware;
}

const defaultTurnMiddleware: TurnMiddleware = (turnContext, next) => next();

const defaultPostMiddleware: PostMiddleware = (turnID, activities, request, next) => next();

export const normalizedMiddleware = (
    middleware: Partial<Middleware>
): Middleware => middleware.turn && middleware.post
    ? middleware as Middleware
    : {
        turn: middleware.turn
            ? (turnContext, next) => middleware.turn(turnContext, next)
            : defaultTurnMiddleware,

        post: middleware.post
            ? (turnID, activities, request, next) => middleware.post(turnID, activities, request, next)
            : defaultPostMiddleware
    }

export interface Turn {
    id: string;
    request: Activity;
    postActivities: (activities: Activity[]) => Promise<Array<string>>;
}

export type TurnHandler = (turn: Turn) => (any | Promise<any>);

export class Turner {
    private middlewares: Middleware[] = [];
    
    constructor (
        private adapter: Adapter,
        ... middlewares: Middleware[]
    ) {
        this.middlewares = [...middlewares]
            .reverse()
            .map(normalizedMiddleware);
    }

    private handle (
        request: Activity,
        handler: TurnHandler
    ) {
        const id = Date
            .now()
            .toString();

        const turn: Turn = {
            id,
            request,
            postActivities: (activities: Activity[]) => this.middlewares
                .reduce(
                    (next, middleware) => () => middleware.post(id, activities, request, next),
                    () => Promise.resolve()
                )
                ()
                .then(() => this.adapter.postActivities(activities))
        }

        return this.middlewares
            .reduce(
                (next, middleware) => () => middleware.turn(turn, next),
                () => toPromise(handler(turn))
            )
            ()
    }

    do (
        request: Activity,
        handler: TurnHandler
    ) {
        return this.handle(
            {
                type: 'proactive',
                channelID: request.channelID,
                conversationID: request.conversationID,
                userID: request.userID
            },
            handler
        );
    }

    onRequest(handler: TurnHandler) {
        this
            .adapter
            .activity$
            .flatMap(request => this.handle(request, handler))
        .subscribe();
    }
}
