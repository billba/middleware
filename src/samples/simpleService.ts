import { Middleware, TurnAdapter, Turn, WithContext, GetContext } from '../turns';
import { ConsoleAdapter } from 'botbuilder-node';
import { SimpleAPI } from '../helpers/simple';
import { SimpleCache } from '../helpers/SimpleCache';

const simpleCache = new SimpleCache();

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
    {
        async turn (turn, next) {
            await next();
            simpleCache.dispose(turn);
        }
    },
    toUpper,
    new Yoify(simpleCache),
);

type Context = Turn & SimpleAPI;

const getContext = GetContext<Context>(turn => ({
    ... turn,
    ... simpleCache.get(turn),
}));

const withContext = WithContext(getContext);

app.onRequest(withContext(context => {
    if (context.request.type === 'message')
        echo(context);
}));

const echo = (context: Context) => {
    context.reply(`You said "${context.request.text}".`);
}
