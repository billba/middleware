import { Promiseable, toPromise } from './misc';
import { StateManager } from './stateManager';
import { Middleware, Turn } from './turns';

export interface TimeState {
    time: Date
}

export const putTimeInState = <ConversationState extends TimeState> (
    stateManager: StateManager<ConversationState, any>
): Middleware => ({
    turn: async (turn, next) => {
        const state = await stateManager.get(turn);

        state.conversation.time = new Date();

        return next();
    }
})

export const doNotDisturb = <ConversationState extends TimeState> (
    stateManager: StateManager<ConversationState, any>
): Middleware => ({
    turn: async (turn, next) => {
        const state = await stateManager.get(turn);
        const hours = state.conversation.time.getHours();
        
        return hours >= 10 && hours <= 16
            ? next()
            : turn.post([{
                ... turn.request,
                type: 'message',
                text: "Sorry, we're closed."
            }]);
    }
});

export const doNotDisturb2 = (
    predicate: (turn: Turn) => Promiseable<boolean>
): Middleware => ({
    turn: async (turn, next) => {
        return (await toPromise(predicate(turn)))
            ? next()
            : turn.post([{
                ... turn.request,
                type: 'message',
                text: "Sorry, we're closed."
            }]);
    }
})
