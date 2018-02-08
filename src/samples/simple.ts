import { Middleware, TurnAdapter, Turn } from '../turns';
import { ConsoleAdapter } from 'botbuilder-node';
import { simple } from '../helpers/simple';


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

app.onRequest(turn => {
    const s = simple(turn);

    if (turn.request.type === 'message')
        s.reply(`You said "${turn.request.text}".`);
});
