import { Turn, Middleware } from '../turns';
import { TurnService } from './TurnService';

export interface RegExpArtifact {
    intent: string;
}

interface RE {
    regExp: RegExp;
    intent: string;
}

export class RegexpRecognizer extends TurnService<string> implements Middleware {
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

                if (re)
                    return {
                        artifact: re.intent
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
