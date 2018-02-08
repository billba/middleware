import { toPromise, Promiseable } from '../misc';
import { Turn } from '../turns';

export interface AsyncTurnServiceResult<T> {
    artifact: T;
    dispose?: () => Promise<void>;
}

export abstract class AsyncTurnService <T> {
    protected turnServiceResults: Record<string, AsyncTurnServiceResult<T>> = {};

    constructor() {
    }

    protected _get (
        turn: Turn,
        getter: () => Promiseable<AsyncTurnServiceResult<T>>
    ) {
        let turnResult = this.turnServiceResults[turn.id];

        return turnResult
            ? Promise.resolve(turnResult.artifact)
            : toPromise(getter())
                .then(t => t
                    ? t
                    : {
                        artifact: undefined
                    }
                )
                .then(t => t.dispose
                    ? t
                    : {
                        artifact: t.artifact,
                        dispose: () => Promise.resolve()
                    } as AsyncTurnServiceResult<T>
                )
                .then(t2 => {
                    this.turnServiceResults[turn.id] = t2;
                    return t2.artifact;
                });
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = this.turnServiceResults[turn.id];

        return turnResult
            ? turnResult.dispose()
                .then(() => {
                    delete this.turnServiceResults[turn.id];
                })
            : Promise.resolve();
    }
}

export interface TurnServiceResult<T> {
    artifact: T;
    dispose?: () => void;
}

export abstract class TurnService <T> {
    protected turnServiceResults: Record<string, TurnServiceResult<T>> = {};

    constructor() {
    }

    protected _get (
        turn: Turn,
        getter: () => TurnServiceResult<T>
    ) {
        let turnResult = this.turnServiceResults[turn.id];

        if (!turnResult) {
            turnResult = getter();
            if (turnResult === undefined)
                turnResult = {
                    artifact: undefined
                }
            if (!turnResult.dispose)
                turnResult.dispose = () => {};
            this.turnServiceResults[turn.id] = turnResult;
        }

        return turnResult.artifact;
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = this.turnServiceResults[turn.id];

        if (turnResult) {
            turnResult.dispose();
            delete this.turnServiceResults[turn.id];
        }
    }
}
