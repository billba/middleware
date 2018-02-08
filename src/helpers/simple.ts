import { Activity } from "botbuilder";
import { Turn } from "../turns";

export interface SimpleAPI {
    reply (contents: string | Activity): void;
    send (to: Activity, contents: string | Activity): void;
    replyAsync (contents: string | Activity): Promise<void>;
    sendAsync (to: Activity, contents: string | Activity): Promise<void>;
}

export const simple = (turn: Turn): SimpleAPI => {
    const send = (to: Activity, contents: string | Activity) => {
        turn.responses.push(typeof contents === 'string'
            ? {
                ... to,
                type: 'message',
                text: contents
            }
            : contents
        );
    }

    const sendAsync = (to: Activity, thing: string | Activity) => {
        send(to, thing);
        return turn.flushResponses().then(() => {});
    }

    return {
        send,
        reply: contents => send(turn.request, contents),
        sendAsync,
        replyAsync: contents => sendAsync(turn.request, contents)
    }
}
