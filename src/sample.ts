import { Bot, BotRequest, BotResponse } from './bot';
import { Middleware } from './middleware';
import { StateManager, IState } from './stateManager';
import { MemoryStorage } from './memoryStorage';
import { RegExpRecognizer } from './regex';
import { putTimeInState, doNotDisturb, doNotDisturb2 } from './time';
import { ConsoleAdapter } from './consoleAdapter';
import { BatchedResponse, BatchedResponseMaker } from './batchedResponse';
import { basename } from 'path';
import { yoify } from './yoify';

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

interface Context {
    req: BotRequest;
    res: BotResponse;
    state: IState<ConversationState, UserState>;
    intent: string;
}

new Bot(new ConsoleAdapter())
    .use(putTimeInState(stateManager))
    .use(doNotDisturb(stateManager))
    .use(yoify)
    // runs incoming middleware here
    .onReceiveActivity(async (req, res) => 
        botLogic(await getContext(req, res))
    )
    // runs outgoing middleware here
    .endTurn((req, res) => {
        stateManager.dispose(req);
        regExpRecognizer.dispose(req);
    });

const getContext = async (req: BotRequest, res: BotResponse): Promise<Context> => {
    const state = await stateManager.get(req);
    const intent = await regExpRecognizer.get(req);

    return {
        req,
        res,
        state,
        intent,
    }
}

const botLogic = async (c: Context) => {
    if (c.intent)
        return c.res.reply(`Intent found: ${c.intent}`);
    return c.res.reply(`hey`);
}


// .use(doNotDisturb2(async (req, res) => {
//     const state = await stateManager.get(req);
//     const hours = state.conversation.time.getHours();
    
//     return hours >= 8 && hours <= 17;
// }))
