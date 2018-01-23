import { BotRequest, BotResponse, Promiseable, toPromise } from './bot';
import { StateManager } from './stateManager';
import { Middleware } from './middleware';

export interface TimeState {
    time: Date
}

export const putTimeInState = <ConversationState extends TimeState> (
    stateManager: StateManager<ConversationState, any>
): Middleware => async (req, res, next) => {
    const state = await stateManager.get(req);

    state.conversation.time = new Date();

    return next();
}

export const doNotDisturb = <ConversationState extends TimeState> (
    stateManager: StateManager<ConversationState, any>
): Middleware => async (req, res, next) => {
    const state = await stateManager.get(req);
    const hours = state.conversation.time.getHours();
    
    return hours >= 9 && hours <= 17
        ? next()
        : res.reply("Sorry, we're closed.");
}

export const doNotDisturb2 = (
    predicate: (req: BotRequest, res: BotResponse) => Promiseable<boolean>
): Middleware => async (req, res, next) => {
    return (await toPromise(predicate(req, res)))
        ? next()
        : res.reply("Sorry, we're closed.");
}

