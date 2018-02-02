import { Promiseable } from './misc';
import { Middleware, TurnAdapter, Turn, TurnHandler } from './turns';
import { StateManager, IState } from './stateManager';
import { MemoryStorage } from './memoryStorage';
import { RegExpRecognizer } from './regex';
import { putTimeInState, doNotDisturb, doNotDisturb2 } from './time';
import { ConsoleAdapter } from './consoleAdapter';
import { BatchedResponse, BatchedResponseMaker, BatchedResponseAPI } from './batchedResponse';
import { basename } from 'path';
import { yoify } from './yoify';
import { simple } from './simpleReply';
import { makeContext } from './context';

interface ConversationState {
    time: Date;
    count: number;
}

interface UserState {
}

const stateManager = new StateManager<ConversationState, UserState>(new MemoryStorage());

const regExpRecognizer = new RegExpRecognizer()
    .add(/I am (.*)/i, 'introduction')
    .add(/My name is (.*)/i, 'introduction')
    .add(/They call me (.*)/i, 'introduction')
    .add(/Goodbye|Farewell|Adieu|Aloha/i, 'farewell')
    .add(/help|aid|assistance|911/i, 'help');

const batchedResponseMaker = new BatchedResponseMaker();

const atEndOfTurn = (
    handler: TurnHandler,
): Middleware => ({
    turn: async (turn, next) => {
        await next();
        await handler(turn);
    }
})


const toUpper: Middleware = {
    post: (turnId, activities, request, next) => {
        for (let activity of activities) {
            if (activity.type === 'message') {
                activity.text = activity.text.toLocaleUpperCase();
            }
        }
        return next();
    }
}

const turner = new TurnAdapter(new ConsoleAdapter(),
    atEndOfTurn(async turn => {
        await stateManager.dispose(turn);
        batchedResponseMaker.dispose(turn);
        regExpRecognizer.dispose(turn);
    }),
    putTimeInState(stateManager),
    doNotDisturb(stateManager),
    // {
    //     turn: async (turn, next) => {
    //         const hours = new Date().getHours();
    //         return hours >= 8 && hours <= 17
    //             ? next()
    //             : simpleReply.get(turn).reply("sorry we're closed");
    //     }
    // },
    // doNotDisturb2(async (turn) => {
    //     const state = await stateManager.get(turn);
    //     const hours = state.conversation.time.getHours();
        
    //     return hours >= 8 && hours <= 17;
    // }),
    yoify,
    toUpper
);

const withContext = makeContext(async turn => ({
    ... simple(turn),
    // ... await batchedResponseMaker.get(turn),
    state: await stateManager.get(turn),
    intent: regExpRecognizer.get(turn),
}));

turner.onRequest(withContext(c => {
    // return c.reply("hello world");
    if (c.intent)
        return c.reply(`Intent found: ${c.intent}`);
    return c.reply(`hey`);
}));