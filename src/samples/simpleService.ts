import { Middleware, TurnAdapter, Turn, WithContext, GetContext } from '../turns';
import { ConsoleAdapter } from 'botbuilder-node';
import { SimpleAPI } from '../helpers/simple';
import { SimpleService } from '../helpers/SimpleService';

const simpleService = new SimpleService();

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

const consoleAdapter = new ConsoleAdapter();

consoleAdapter.listen();

const app = new TurnAdapter(consoleAdapter,
    {
        async turn (turn, next) {
            await next();
            simpleService.dispose(turn);
        }
    },
    toUpper,
    new Yoify(simpleService),
);

type Context = Turn & SimpleAPI;

const getContext = GetContext<Context>(turn => ({
    ... turn,
    ... simpleService.get(turn),
}));

const withContext = WithContext(getContext);

app.onRequest(withContext(context => {
    if (context.request.type === 'message')
        echo(context);
}));

const echo = (context: Context) => {
    context.reply(`You said "${context.request.text}".`);
}
