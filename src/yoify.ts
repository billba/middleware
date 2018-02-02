import { Middleware } from './turns';
import { simple } from './simpleReply';

export const yoify: Middleware = {
    async turn (turn, next) {
        const s = simple(turn);
        
        await s.reply("YO IN")
        await next();
        await s.reply("YO OUT");
    }
}