import { Request, Response } from './bot';
import { Middleware } from "./middleware";
import { TurnID } from "./bot";

export interface Turn<T> {
    artifact: T;
    dispose: () => Promise<void>;
}

export class MiddlewareMaker <T extends {} = {}> implements Middleware<T> {
    private turns: Record<TurnID, Turn<T>> = {};

    constructor() {

    }

    private normalizedGetTurn (
        req: Request,
        res: Response
    ): Promise<Turn<T>> {
        const t = this.getTurn(req, res);

        return (t instanceof Promise
            ? t
            : Promise.resolve(t)
        )
            .then(turn => ({
                artifact: turn.artifact || {} as T,
                dispose: turn.dispose || (() => Promise.resolve())
            }))
    }

    // do not override

    public forTurn (
        req: Request,
        res: Response
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

    dispose (
        req: Request,
        res: Response
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

    // Override any of the below

    public activityWasReceived (
        req: Request,
        res: Response,
        next: (req: Request, res: Response) => Promise<void>,
        done: (req: Request, res: Response) => Promise<void>
    ): Promise<void> {
        return Promise.resolve();
    }

    public responseWillBeSent (
        req: Request,
        res: Response,
        next: (req: Request, res: Response) => Promise<void>,
        done: (req: Request, res: Response) => Promise<void>
    ): Promise<void> {
        return Promise.resolve();
    }

    protected getTurn (
        req: Request,
        res: Response,
    ): Partial<Turn<T>> | Promise<Partial<Turn<T>>> {
        return {}
    }
}
