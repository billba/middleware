import { Activity } from "./activity";
import { Turn } from "./turns";
import { TurnDI } from "./TurnDI";

export interface SimpleReplyAPI {
    reply (text: string): Promise<void>;
    send (to: Activity, text: string): Promise<void>;
}

export const simple = (turn: Turn): SimpleReplyAPI => {
    const send = (to: Activity, text: string) => turn.post([{
        ... to,
        type: 'message',
        text
    }])
    .then(() => {});

    return {
        reply: (text) => send(turn.request, text),
        send
    }
}
