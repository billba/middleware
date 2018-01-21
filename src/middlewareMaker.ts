import { BotRequest, BotResponse, toPromise } from './bot';
import { Middleware } from "./middleware";
import { TurnID } from "./bot";

export interface Turn<T> {
    artifact: T;
    dispose: () => Promise<void>;
}

export abstract class MiddlewareMaker <T extends {} = {}> implements Partial<Middleware<T>> {
    private turns: Record<TurnID, Turn<T>> = {};

    constructor() {
    }

    private normalizedGetTurn (
        req: BotRequest,
        res: BotResponse
    ): Promise<Turn<T>> {
        const t = this.getTurn(req, res);

        return toPromise(t)
            .then(turn => ({
                artifact: turn.artifact || {} as T,
                dispose: turn.dispose || (() => Promise.resolve())
            }))
    }

    // do not override

    public forTurn (
        req: BotRequest,
        res: BotResponse
    ): Promise<T> {
        let t = this.turns[req.turnID];

        return t
            ? Promise.resolve(t.artifact)
            : this
                .normalizedGetTurn(req, res)
                .then(t => {
                    this.turns[req.turnID] = t;

                    return t.artifact;        
                });
    }

    // do not override

    public dispose (
        req: BotRequest,
        res: BotResponse
    ): Promise<void> {
        let turn = this.turns[req.turnID];

        return (turn
            ? Promise.resolve(turn)
            : this.normalizedGetTurn(req, res)
        )
            .then(turn => turn.dispose())
            .then(() => {
                delete this.turns[req.turnID];
            });
    }

    // Override any or all of the below

    public activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ) {
        return next();
    }

    public middlewareWillBeDisposed (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ) {
        return next();
    }

    protected getTurn (
        req: BotRequest,
        res: BotResponse,
    ): Partial<Turn<T>> | Promise<Partial<Turn<T>>> {
        return {}
    }
}
