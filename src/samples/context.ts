import { Middleware, TurnAdapter, Turn, contextHelpers } from '../turns';
import { ConsoleAdapter } from 'botbuilder-node';
import { simple, SimpleAPI } from '../helpers/Simple';

const yoify: Middleware = {
    async turn (turn, next) {
        const s = simple(turn);

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
    toUpper,
    yoify,
);

type Context = Turn & SimpleAPI;

const { withContext } = contextHelpers<Context>(turn => ({
    ... turn,
    ... simple(turn),
}));

app.onRequest(withContext(context => {
    if (context.request.type === 'message')
        echo(context);
}));

const echo = (context: Context) => {
    context.reply(`You said "${context.request.text}".`);
}
