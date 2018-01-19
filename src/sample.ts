import { Bot, Request, Response } from './bot';
import { Middleware } from './middleware';
import { StateManager, IState } from './stateManager';
import { MemoryStorage } from './memoryStorage';
import { RegExpRecognizer, RegExpArtifact } from './regex';
import { IgnoreAfterMidnight } from './silly';

interface ConversationState {
    time: Date;
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
    req: Request;
    res: Response;
    state: IState<ConversationState, UserState>;
    regexp: RegExpArtifact;
}

new Bot()
    .use(stateManager)
    .use(regExpRecognizer)
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
    // bot code here

    return Promise.resolve(true);
}