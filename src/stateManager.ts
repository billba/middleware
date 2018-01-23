import { BotRequest, BotResponse } from './bot';
import { TurnDI, Turn } from './TurnDI';
import { IStorage } from './storage';

export interface IState<Conversation, User> {
    readonly conversation: Conversation;
    readonly user: User;
}

export class StateManager <Conversation = any, User = any> extends TurnDI<IState<Conversation, User>> {
    constructor (
        private storage: IStorage
    ) {
        super();
    }

    private static keyFromRequest(req: BotRequest) {
        return `${req.channelID}.${req.conversationID}.${req.userID}`;
    }

    get (
        req: BotRequest
    ) {
        return this._get(req.turnID, () => {
            const artifact: IState<Conversation, User> = this.storage.get(StateManager.keyFromRequest(req)) || {
                conversation: {},
                user: {}
            };

            return {
                artifact,
                dispose: () => {
                    this.storage.set(StateManager.keyFromRequest(req), artifact);
                    return Promise.resolve();
                }
            }
        });
    }

    dispose (
        req: BotRequest
    ) {
        return this._dispose(req.turnID);
    }
}
