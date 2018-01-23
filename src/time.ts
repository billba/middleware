import { BotRequest, BotResponse, Promiseable, toPromise } from './bot';
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



// const doNotDisturb = new DoNotDisturb2(async (req, res) => {
//     const state = await stateManager.forTurn(req, res);
//     const hours = state.conversation.time.getHours();
    
//     return hours >= 9 && hours <= 17;
// });


export class DoNotDisturb2 extends MiddlewareMaker {
    constructor (
        private predicate: (req: BotRequest, res: BotResponse) => Promiseable<boolean>
    ) {
        super();
    }

    async activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ) {
        return (await toPromise(this.predicate(req, res)))
            ? next()
            : res.reply("Sorry, we're closed.");
    }
}
