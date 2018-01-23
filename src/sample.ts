import { Bot, BotRequest, BotResponse } from './bot';
import { Middleware } from './middleware';
import { StateManager, IState } from './stateManager';
import { MemoryStorage } from './memoryStorage';
import { RegExpRecognizer, RegExpArtifact } from './regex';
import { DoNotDisturb, PutTimeInState, DoNotDisturb2 } from './time';
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

const putTimeInState = new PutTimeInState(stateManager);

const doNotDisturb = new DoNotDisturb(stateManager);

interface Context {
    req: BotRequest;
    res: BotResponse;
    state: IState<ConversationState, UserState>;
    regexp: RegExpArtifact;
}

const cachedResponse = new CachedResponseMW();

const getContext = async (req: BotRequest, res: BotResponse): Promise<Context> => {
    const state = await stateManager.forTurn(req, res);
    const regexp = await regExpRecognizer.forTurn(req, res);

    return {
        req,
        res,
        state,
        regexp
    }
}

new Bot(new ConsoleAdapter())
    .use(stateManager)
    .use(putTimeInState)
    .use(regExpRecognizer)
    .use(doNotDisturb)
    .onReceiveActivity(async (req, res) => 
        botLogic(await getContext(req, res))
    )

const botLogic = (c: Context) => {

    if (c.regexp.intent)
        return c.res.reply(`Intent found: ${c.regexp.intent}`);
    return c.res.reply(`hey`);
}
