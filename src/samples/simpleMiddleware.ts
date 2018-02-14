import { Middleware, TurnAdapter, Turn, contextHelpers } from '../turns';
import { ConsoleAdapter } from 'botbuilder-node';
import { SimpleAPI } from '../helpers/simple';
import { SimpleCache } from '../helpers/SimpleCache';
import { SimpleMiddleware } from '../helpers/SimpleMiddleware';

const simpleMiddleware = new SimpleMiddleware();

class Yoify implements Middleware {
    constructor(private simpleCache: SimpleCache) {
    }

    async turn (turn, next) {
        const s = this.simpleCache.get(turn);

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

const consoleAdapter = new ConsoleAdapter();

consoleAdapter.listen();

const app = new TurnAdapter(consoleAdapter,
    simpleMiddleware,
    toUpper,
    new Yoify(simpleMiddleware),
);

type Context = Turn & SimpleAPI;

const { withContext } = contextHelpers<Context>(async turn => ({
    ... turn,
    ... simpleMiddleware.get(turn),
}));

app.onRequest(withContext(context => {
    if (context.request.type === 'message')
        echo(context);
}));

const echo = (context: Context) => {
    context.reply(`You said "${context.request.text}".`);
}
