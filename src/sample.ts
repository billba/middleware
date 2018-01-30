import { Bot, BotRequest, BotResponse, Promiseable } from './bot';
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

const atEndOfTurn = (
    handler: (req: BotRequest, res: BotResponse) => Promiseable<any>
): Middleware => async (req, res, next) => {
    await next();
    await handler(req, res);
}

const batched = new BatchedResponseMaker();

new Bot(new ConsoleAdapter(),
    (activity, next) => {
        activity.text = activity.text.toLocaleUpperCase();
        return next();
    },
    (activity, next) => {
        activity.text = activity.text.toLocaleLowerCase();
        return next();
    }
)
    .use(atEndOfTurn((req, res) => {
        stateManager.dispose(req);
        regExpRecognizer.dispose(req);
    }))
    .use(putTimeInState(stateManager))
    // .use(doNotDisturb(stateManager))
    .use(yoify)
    .onReceiveActivity(async (req, res) => {
        return botLogic(await getContext(req, res));
    });

interface Context {
    req: BotRequest;
    res: BotResponse;
    state: IState<ConversationState, UserState>;
    intent: string;
}

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
