import { Activity } from "botbuilder";
import { Turn, Middleware } from "../turns";
import { TurnCache } from "./TurnCache";
import { SimpleCache } from './SimpleCache';

export class SimpleMiddleware extends SimpleCache implements Middleware {
    async turn (
        turn: Turn,
        next: () => Promise<void>,
    ) {
        await next();
        this.dispose(turn);
    }
}
