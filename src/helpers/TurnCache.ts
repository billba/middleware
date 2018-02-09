import { toPromise, Promiseable } from '../misc';
import { Turn } from '../turns';

export interface AsyncTurnCacheResult<T> {
    artifact: T;
    dispose?: () => Promise<void>;
}

export abstract class AsyncTurnCache <T> {
    protected cache: Record<string, AsyncTurnCacheResult<T>> = {};

    constructor() {
    }

    protected _get (
        turn: Turn,
        getter: () => Promiseable<AsyncTurnCacheResult<T>>
    ) {
        let turnResult = this.cache[turn.id];

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
                    } as AsyncTurnCacheResult<T>
                )
                .then(t2 => {
                    this.cache[turn.id] = t2;
                    return t2.artifact;
                });
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = this.cache[turn.id];

        return turnResult
            ? turnResult.dispose()
                .then(() => {
                    delete this.cache[turn.id];
                })
            : Promise.resolve();
    }
}

export interface TurnCacheResult<T> {
    artifact: T;
    dispose?: () => void;
}

export abstract class TurnCache <T> {
    protected cache: Record<string, TurnCacheResult<T>> = {};

    constructor() {
    }

    protected _get (
        turn: Turn,
        getter: () => TurnCacheResult<T>
    ) {
        let turnResult = this.cache[turn.id];

        if (!turnResult) {
            turnResult = getter();
            if (turnResult === undefined)
                turnResult = {
                    artifact: undefined
                }
            if (!turnResult.dispose)
                turnResult.dispose = () => {};
            this.cache[turn.id] = turnResult;
        }

        return turnResult.artifact;
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = this.cache[turn.id];

        if (turnResult) {
            turnResult.dispose();
            delete this.cache[turn.id];
        }
    }
}
