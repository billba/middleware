import { toPromise, Promiseable } from './bot';
import { TurnID } from "./bot";

export interface Turn<T> {
    artifact: T;
    dispose?: () => Promise<void>;
}

export abstract class TurnDI <T> {
    protected turns: Record<TurnID, Turn<T>> = {};

    constructor() {
    }

    protected _get (
        turnID: TurnID,
        getter: () => Promiseable<Turn<T>>
    ) {
        let turn = this.turns[turnID];

        return turn
            ? Promise.resolve(turn.artifact)
            : toPromise(getter())
                .then(t => t.dispose
                    ? t
                    : {
                        artifact: t.artifact,
                        dispose: () => Promise.resolve()
                    } as Turn<T>
                )
                .then(turn => {
                    this.turns[turnID] = turn;
                    return turn.artifact;
                });
    }

    protected _dispose (
        turnID: TurnID,
    ) {
        let turn = this.turns[turnID];

        return turn
            ? turn.dispose()
                .then(() => {
                    delete this.turns[turnID];
                })
            : Promise.resolve();
    }
}
