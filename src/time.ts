import { BotRequest, BotResponse } from './bot';
import { MiddlewareMaker } from './middlewareMaker';
import { StateManager } from './stateManager';

export interface TimeState {
    time: Date
}

export class PutTimeInState <ConversationState extends TimeState> extends MiddlewareMaker {
    constructor (
        private stateManager: StateManager<ConversationState, any>
    ) {
        super();
    }

    async activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>
    ) {
        const state = await this.stateManager.forTurn(req, res);

        state.conversation.time = new Date();

        return next();
    }
}


export class DoNotDisturb <ConversationState extends TimeState> extends MiddlewareMaker {
    constructor (
        private stateManager: StateManager<ConversationState, any>
    ) {
        super();
    }

    async activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ) {
        const state = await this.stateManager.forTurn(req, res);
        const hours = state.conversation.time.getHours();
        
        return hours >= 9 && hours <= 17
            ? next()
            : res.reply("Sorry, we're closed.");
    }
}
