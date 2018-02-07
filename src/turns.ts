import { Activity } from './activity';
import { Adapter } from './adapter';
import { toPromise, Promiseable } from './misc';
import { read } from 'fs';

export type PostMiddleware = (
    turn: Turn,
    activities: Activity[]
) => Promise<any>;

export type TurnMiddleware = (
    turn: Turn,
    next: () => Promise<void>
) => Promise<any>;

export type Middleware = {
    post?: PostMiddleware;
    turn?: TurnMiddleware;
}

const defaultTurnMiddleware: TurnMiddleware = (turn, next) => next();

const defaultPostMiddleware: PostMiddleware = (turn, activities) => turn.post(activities);

export const normalizedMiddleware = (
    middleware: Middleware
): Middleware => middleware.turn && middleware.post
    ? middleware
    : {
        turn: middleware.turn
            ? (turnContext, next) => middleware.turn(turnContext, next)
            : defaultTurnMiddleware,

        post: middleware.post
            ? (turn, activities) => middleware.post(turn, activities)
            : defaultPostMiddleware
    }

type PostActivities = (activities: Activity[]) => Promise<Array<string>>;

export interface Turn {
    id: string;
    request: Activity;
    post: PostActivities
}

export type TurnHandler = (turn: Turn) => Promiseable<any>;

export class TurnAdapter {
    private middlewares: Middleware[];
    
    constructor (
        private adapter: Adapter,
        ... middlewares: Middleware[]
    ) {
        this.middlewares = middlewares;
    }

    use (middleware: Middleware) {
        this.middlewares.push(middleware);
        return this;
    }

    private handle (
        request: Activity,
        handler: TurnHandler,
    ) {
        const middlewares = [... this.middlewares]
            .reverse()
            .map(normalizedMiddleware);

        const id = Date
            .now()
            .toString();

        const turn: Turn = {
            id,
            request,
            post: middlewares
                .reduce<PostActivities>(
                    (post, middleware) => activities => middleware.post(
                        {
                            id,
                            request,
                            post
                        },
                        activities
                    ),
                    this.adapter.post
                )
        }

        return middlewares
            .reduce(
                (next, middleware) => () => middleware.turn(turn, next),
                () => toPromise(handler(turn))
            )()
    }

    do (
        request: Activity,
        handler: TurnHandler,
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

    onRequest(
        handler: TurnHandler,
    ) {
        this
            .adapter
            .activity$
            .flatMap(request => this.handle(request, handler))
            .subscribe();
    }
}
