import { BotRequest, BotResponse, TurnID } from './bot';
import { TurnDI, Turn } from './TurnDI';
import { IStorage } from './storage';

export interface RegExpArtifact {
    intent: string;
}

interface RE {
    regExp: RegExp;
    intent: string;
}

export class RegExpRecognizer extends TurnDI<string> {
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

    get (
        req: BotRequest
    ) {
        return this._get(req.turnID, () => {
            const re = this.res.find(re => re.regExp.test(req.text));

            return {
                artifact: re && re.intent
            }
        });
    }

    dispose (
        req: BotRequest
    ) {
        return this._dispose(req.turnID);
    }
}
