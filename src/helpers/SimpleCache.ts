import { Activity } from "botbuilder";
import { Turn } from "../turns";
import { TurnCache } from "./TurnCache";
import { simple, SimpleAPI } from './simple';

export class SimpleCache extends TurnCache<SimpleAPI> {
    constructor() {
        super("Microsoft.Simple");
    }

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
