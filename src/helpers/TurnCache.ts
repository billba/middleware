import { toPromise, Promiseable } from '../misc';
import { Turn } from '../turns';

export interface AsyncTurnCacheResult<T> {
    artifact: T;
    dispose?: () => Promise<void>;
}

abstract class BaseCache {
    constructor(
        private key: string,
    ) {
    }

    protected _key(
        turn: Turn
    ) {
        return `${this.key}:${turn.id}`;
    }
}

export abstract class AsyncTurnCache <T> extends BaseCache {
    constructor(
        key: string,
    ) {
        super(key);
    }

    protected _get (
        turn: Turn,
        getter: () => Promiseable<AsyncTurnCacheResult<T>>
    ) {
        let turnResult = turn._get<AsyncTurnCacheResult<T>>(this._key(turn));

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
                    turn._set(this._key(turn), t2);
                    return t2.artifact;
                });
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = turn._get<AsyncTurnCacheResult<T>>(this._key(turn));

        return turnResult
            ? turnResult.dispose()
                .then(() => {
                    turn._delete(this._key(turn))
                })
            : Promise.resolve();
    }
}

export interface TurnCacheResult<T> {
    artifact: T;
    dispose?: () => void;
}

export abstract class TurnCache <T> extends BaseCache {
    constructor(
        key: string,
    ) {
        super(key);
    }

    protected _get (
        turn: Turn,
        getter: () => TurnCacheResult<T>
    ) {
        let turnResult = turn._get<TurnCacheResult<T>>(this._key(turn));

        if (!turnResult) {
            turnResult = getter();
            if (turnResult === undefined)
                turnResult = {
                    artifact: undefined
                }
            if (!turnResult.dispose)
                turnResult.dispose = () => {};
            turn._set(this._key(turn), turnResult);
        }

        return turnResult.artifact;
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = turn._get<TurnCacheResult<T>>(this._key(turn));

        if (turnResult) {
            turnResult.dispose();
            turn._delete(this._key(turn));
        }
    }
}
