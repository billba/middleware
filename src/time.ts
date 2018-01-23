import { BotRequest, BotResponse, Promiseable, toPromise } from './bot';
import { StateManager } from './stateManager';
import { Middleware } from './middleware';

export interface TimeState {
    time: Date
}

export class PutTimeInState <ConversationState extends TimeState> implements Partial<Middleware> {
    constructor (
        private stateManager: StateManager<ConversationState, any>
    ) {
    }

    async activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>
    ) {
        const state = await this.stateManager.get(req);

        state.conversation.time = new Date();

        return next();
    }
}


export class DoNotDisturb <ConversationState extends TimeState> implements Partial<Middleware> {
    constructor (
        private stateManager: StateManager<ConversationState, any>
    ) {
    }

    async activityWasReceived (
        req: BotRequest,
        res: BotResponse,
        next: () => Promise<void>,
    ) {
        const state = await this.stateManager.get(req);
        const hours = state.conversation.time.getHours();
        
        return hours >= 9 && hours <= 17
            ? next()
            : res.reply("Sorry, we're closed.");
    }
}



export class DoNotDisturb2 implements Partial<Middleware> {
    constructor (
        private predicate: (req: BotRequest, res: BotResponse) => Promiseable<boolean>
    ) {
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

// const doNotDisturb = new DoNotDisturb2(async (req, res) => {
//     const state = await stateManager.get(req);
//     const hours = state.conversation.time.getHours();
    
//     return hours >= 9 && hours <= 17;
// });

