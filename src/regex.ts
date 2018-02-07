import { Turn, Middleware } from './turns';
import { TurnDI } from './TurnDI';
import { IStorage } from './storage';

export interface RegExpArtifact {
    intent: string;
}

interface RE {
    regExp: RegExp;
    intent: string;
}

export class RegExpRecognizer extends TurnDI<string> implements Middleware {
    private res: RE[] = [];

    constructor() {
        super();
    }

    add (
        regExp: RegExp,
        intent?: string
    ) {
        this.res.push({
            regExp,
            intent
        });

        return this;
    }

    recognize (
        turn: Turn,
    ) {
        return this._get(turn, () => {
            const request = turn.request;
            if (request.type === 'message') {
                const re = this.res.find(re => re.regExp.test(request.text));

                return {
                    artifact: re && re.intent
                }
            }
        });
    }

    dispose (
        turn: Turn,
    ) {
        return this._dispose(turn);
    }

    async turn (turn: Turn, next: () => Promise<void>) {
        await next();
        this.dispose(turn);
    }
}
