import { Middleware, TurnAdapter, Turn } from '../turns';
import { ConsoleAdapter } from 'botbuilder-node';

const yoify: Middleware = {
    async turn (turn, next) {
        turn.responses.push({
            type: 'message',
            text: 'yo in'
        });
        
        await next();

        turn.responses.push({
            type: 'message',
            text: 'yo out'
        });
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
    if (turn.request.type === 'message')
        turn.responses.push({
            type: 'message',
            text: `You said "${turn.request.text}".`
        })
});
