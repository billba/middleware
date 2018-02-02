import { toPromise, Promiseable } from './misc';
import { Turn } from './turns';

export interface AsyncTurnResult<T> {
    artifact: T;
    dispose?: () => Promise<void>;
}

export abstract class AsyncTurnDI <T> {
    protected turnResults: Record<string, AsyncTurnResult<T>> = {};

    constructor() {
    }

    protected _get (
        turn: Turn,
        getter: () => Promiseable<AsyncTurnResult<T>>
    ) {
        let turnResult = this.turnResults[turn.id];

        return turnResult
            ? Promise.resolve(turnResult.artifact)
            : toPromise(getter())
                .then(t => t.dispose
                    ? t
                    : {
                        artifact: t.artifact,
                        dispose: () => Promise.resolve()
                    } as AsyncTurnResult<T>
                )
                .then(t2 => {
                    this.turnResults[turn.id] = t2;
                    return t2.artifact;
                });
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = this.turnResults[turn.id];

        return turnResult
            ? turnResult.dispose()
                .then(() => {
                    delete this.turnResults[turn.id];
                })
            : Promise.resolve();
    }
}

export interface TurnResult<T> {
    artifact: T;
    dispose?: () => void;
}

export abstract class TurnDI <T> {
    protected turnResults: Record<string, TurnResult<T>> = {};

    constructor() {
    }

    protected _get (
        turn: Turn,
        getter: () => TurnResult<T>
    ) {
        let turnResult = this.turnResults[turn.id];

        if (!turnResult) {
            turnResult = getter();
            if (!turnResult.dispose)
                turnResult.dispose = () => {};
            this.turnResults[turn.id] = turnResult;
        }

        return turnResult.artifact;
    }

    protected _dispose (
        turn: Turn,
    ) {
        let turnResult = this.turnResults[turn.id];

        if (turnResult) {
            turnResult.dispose();
            delete this.turnResults[turn.id];
        }
    }
}
