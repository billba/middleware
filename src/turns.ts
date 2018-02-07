import { Activity } from './activity';
import { Adapter } from './adapter';
import { toPromise, Promiseable } from './misc';
import { read } from 'fs';

type FlushResponses = () => Promise<Array<string>>;

export interface Turn {
    id: string;

    request: Activity;

    responses: Activity[];
    flushResponses: FlushResponses;
}

export type PostMiddleware = (
    turn: Turn,
) => Promise<any>;

export type TurnMiddleware = (
    turn: Turn,
    next: () => Promise<void>,
) => Promise<any>;

export type Middleware = {
    post?: PostMiddleware;
    turn?: TurnMiddleware;
}

const defaultTurnMiddleware: TurnMiddleware = (turn, next) => next();

const defaultPostMiddleware: PostMiddleware = (turn) => turn.flushResponses();

export const normalizedMiddleware = (
    middleware: Middleware
): Middleware => middleware.turn && middleware.post
    ? middleware
    : {
        turn: middleware.turn
            ? (turnContext, next) => middleware.turn(turnContext, next)
            : defaultTurnMiddleware,

        post: middleware.post
            ? (turn) => middleware.post(turn)
            : defaultPostMiddleware
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

    private async handle (
        request: Activity,
        handler: TurnHandler,
    ) {
        const middlewares = this.middlewares
            .map(normalizedMiddleware)
            .reverse();

        const id = Date
            .now()
            .toString();

        const responses: Activity[] = [];

        const turn: Turn = {
            id,
            request,
            responses,
            flushResponses: middlewares
                .reduce<FlushResponses>(
                    (flushResponses, middleware) => () => middleware.post({
                        id,
                        request,
                        responses,
                        flushResponses
                    }),
                    () => responses.length > 0
                        ? this
                            .adapter
                            .post(responses)
                            .then(result => {
                                responses.length = 0;
                                return result;
                            })
                        : Promise.resolve([])
                )
        }

        await middlewares
            .reduce(
                (next, middleware) => () => middleware.turn(turn, next),
                () => toPromise(handler(turn))
            )();
        
        await turn.flushResponses();
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
