import { Promiseable } from './misc';
import { Middleware, TurnAdapter, Turn } from './turns';
import { StateManager, IState } from './stateManager';
import { MemoryStorage } from './memoryStorage';
import { RegExpRecognizer } from './regex';
import { putTimeInState, doNotDisturb, doNotDisturb2 } from './time';
import { ConsoleAdapter } from './consoleAdapter';
import { simple, SimpleAPI } from './simple';
import { makeContext } from './context';
import { Activity } from './activity';

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
    .add(/Start|Go|Start your engines/i, 'start')
    .add(/help|aid|assistance|911/i, 'help');


const yoify: Middleware = {
    async turn (turn, next) {
        const s = simple(turn);
        
        await s.reply("yo in")
        await next();
        await s.reply("yo out");
    }
}

const toUpper: Middleware = {
    post: (turn) => {
        for (let activity of turn.responses) {
            if (activity.type === 'message')
                activity.text = activity.text.toLocaleUpperCase();
        }
        return turn.flushResponses();
    }
}

const app = new TurnAdapter(new ConsoleAdapter(),
    stateManager,
    regExpRecognizer,
    putTimeInState(stateManager),
    doNotDisturb(stateManager),
    toUpper,
    yoify,
);

export type Context = Turn & SimpleAPI & { 
    state: IState<ConversationState, UserState>;
    intent: string
};

const withContext = makeContext<Context>(async turn => ({
    ... turn,
    ... simple(turn),
    // ... await batchedResponseMaker.get(turn),
    state: await stateManager.get(turn),
    intent: regExpRecognizer.recognize(turn),
}));

export const onRequest = (handler: (c: Context) => Promiseable<any>) => app.onRequest(withContext(handler));
export const proactive = (request: Activity, handler: (c: Context) => Promiseable<any>) => app.do(request, withContext(handler));
