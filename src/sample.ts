import { Bot, BotRequest, BotResponse } from './bot';
import { Middleware } from './middleware';
import { StateManager, IState } from './stateManager';
import { MemoryStorage } from './memoryStorage';
import { RegExpRecognizer, RegExpArtifact } from './regex';
import { DoNotDisturb, PutTimeInState } from './time';
import { ConsoleAdapter } from './consoleAdapter';
import { CachedResponse, CachedResponseMW } from './cachedResponse';

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
    regexp: RegExpArtifact;
}

const consoleAdapter = new ConsoleAdapter();

new Bot(consoleAdapter)
    .use(stateManager)
    .use(new PutTimeInState(stateManager))
    .use(regExpRecognizer)
    .use(new DoNotDisturb(stateManager))
    .onReceiveActivity(async (req, res) => {
        const state = await stateManager.forTurn(req, res);
        const regexp = await regExpRecognizer.forTurn(req, res);

        const context: Context = {
            req,
            res,
            state,
            regexp
        };

        return botLogic(context);
    });

const botLogic = (c: Context) => {
    if (c.regexp.intent)
        return c.res.reply(`Intent found: ${c.regexp.intent}`);
    return c.res.reply(`hey`);
}
