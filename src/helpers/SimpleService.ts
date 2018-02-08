import { Activity } from "botbuilder";
import { Turn } from "../turns";
import { TurnService } from "./TurnService";
import { simple, SimpleAPI } from './simple';

export class SimpleService extends TurnService<SimpleAPI> {
    get (
        turn: Turn,
    ): SimpleAPI {
        return this._get(turn, () => ({
            artifact: simple(turn)
        }));
    }

    dispose (
        turn: Turn,
    ) {
        this._dispose(turn);
    }
}
