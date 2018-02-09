import { Activity, ActivityAdapter, ConversationResourceResponse } from 'botbuilder';
import { toPromise, Promiseable } from './misc';

type FlushResponses = () => Promise<Array<ConversationResourceResponse>>;

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
        private adapter: ActivityAdapter,
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
        const middlewares = [
            {
                turn: async (turn, next) {
                    await next();
                    await turn.flushResponses();
                }
            },
            ... this.middlewares,
            {
                turn: async (turn, next) {
                    await toPromise(handler(turn));
                    await next();
                }
            }
        ]
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
                () => Promise.resolve()
            )();
    }

    do (
        request: Activity,
        handler: TurnHandler,
    ) {
        return this.handle(
            {
                type: 'proactive',
                channelId: request.channelId,
                conversation: request.conversation,
                from: request.from
            },
            handler
        );
    }

    onRequest(
        handler: TurnHandler,
    ) {
        this.adapter.onReceive = request => this.handle(request, handler);
    }
}

export const GetContext = <Context> (
    getContext: (turn: Turn) => Promiseable<Context>
) => (turn: Turn) => toPromise(getContext(turn));

export const WithContext = <Context> (
    getContext: (turn: Turn) => Promiseable<Context>
) => (
    handler: (context: Context) => Promiseable<any>,
) => async (
    turn: Turn,
) => toPromise(handler(await toPromise(getContext(turn))));