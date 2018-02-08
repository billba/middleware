import { Middleware, TurnAdapter, Turn, WithContext, GetContext } from '../turns';
import { ConsoleAdapter } from 'botbuilder-node';
import { SimpleAPI } from '../helpers/simple';
import { SimpleService } from '../helpers/SimpleService';
import { SimpleMiddleware } from '../helpers/SimpleMiddleware';
import { RegexpRecognizer } from '../helpers/regexpRecognizer';
import { IState, StateManager } from '../helpers/StateManager';
import { MemoryStorage } from '../helpers/MemoryStorage';

const simpleMiddleware = new SimpleMiddleware();

class Yoify implements Middleware {
    constructor(private simpleService: SimpleService) {
    }

    async turn (turn, next) {
        const s = this.simpleService.get(turn);

        s.reply('yo in');
        await next();
        s.reply('yo out');
    }
}

const toUpper: Middleware = {
    post (turn) {
        for (let activity of turn.responses) {
            if (activity.type === 'message')
                activity.text = activity.text.toLocaleUpperCase();
        }
        return turn.flushResponses();
    }
}

const regexpRecognizer = new RegexpRecognizer()
    .add(/I am (.*)/i, 'introduction')
    .add(/My name is (.*)/i, 'introduction')
    .add(/They call me (.*)/i, 'introduction')
    .add(/Goodbye|Farewell|Adieu|Aloha/i, 'farewell')
    .add(/Start|Go|Start your engines/i, 'start')
    .add(/help|aid|assistance|911/i, 'help');

interface ConversationState {
    count: number;
}
 
const stateManager = new StateManager<ConversationState>(new MemoryStorage());

const consoleAdapter = new ConsoleAdapter();

consoleAdapter.listen();

const app = new TurnAdapter(consoleAdapter,
    stateManager,
    simpleMiddleware,
    regexpRecognizer,
    toUpper,
    new Yoify(simpleMiddleware),
    {
        async turn (turn, next) {
            const state = await stateManager.get(turn);
            
            state.conversation.count = state.conversation.count === undefined
                ? 0
                : state.conversation.count + 1;
        
            await next();
        }
    },
    {
        async turn (turn, next) {
            const intent = regexpRecognizer.recognize(turn);
            const s = simpleMiddleware.get(turn);

            if (intent)
                s.reply(`I recognized intent "${intent}"`);
            await next();
        }
    },
);

type Context = Turn & SimpleAPI & {
    state: IState<ConversationState>;
    intent: string;
}

const getContext = GetContext<Context>(async turn => ({
    ... turn,
    ... simpleMiddleware.get(turn),
    state: await stateManager.get(turn),
    intent: regexpRecognizer.recognize(turn),
}));

const withContext = WithContext(getContext);

app.onRequest(withContext(context => {
    if (context.request.type === 'message')
        echo(context);
}));

const echo = (context: Context) => {
    context.reply(`${context.state.conversation.count}: You said "${context.request.text}".`);
    if (context.intent === 'introduction')
        context.reply(`Nice to meet you!`);
}
