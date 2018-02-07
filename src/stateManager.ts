import { Turn, Middleware } from './turns';
import { AsyncTurnDI } from './TurnDI';
import { IStorage } from './storage';

export interface IState<Conversation, User> {
    readonly conversation: Conversation;
    readonly user: User;
}

export class StateManager <Conversation = any, User = any> extends AsyncTurnDI<IState<Conversation, User>> implements Middleware {
    constructor (
        private storage: IStorage
    ) {
        super();
    }

    private static keyFromTurn(turn: Turn) {
        return `${turn.request.channelId}.${turn.request.conversation.id}.${turn.request.from.id}`;
    }

    get (
        turn: Turn
    ) {
        return this._get(turn, () => {
            const artifact: IState<Conversation, User> = this.storage.get(StateManager.keyFromTurn(turn)) || {
                conversation: {},
                user: {}
            };

            return {
                artifact,
                dispose: () => {
                    this.storage.set(StateManager.keyFromTurn(turn), artifact);
                    return Promise.resolve();
                }
            }
        });
    }

    set (
        turn: Turn
    ) {
        return this._dispose(turn);
    }

    async turn (turn: Turn, next: () => Promise<void>) {
        await next();
        this.set(turn);
    }
}
