import { Activity } from "botbuilder";
import { Turn, Middleware } from "../turns";
import { TurnService } from "./TurnService";
import { SimpleService } from './SimpleService';

export class SimpleMiddleware extends SimpleService implements Middleware {
    async turn (
        turn: Turn,
        next: () => Promise<void>,
    ) {
        await next();
        this.dispose(turn);
    }
}
