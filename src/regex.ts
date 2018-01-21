import { BotRequest, BotResponse } from './bot';
import { MiddlewareMaker, Turn } from './middlewareMaker';
import { IStorage } from './storage';

export interface RegExpArtifact {
    intent: string;
}

interface RE {
    regExp: RegExp;
    intent: string;
}

export class RegExpRecognizer extends MiddlewareMaker<RegExpArtifact> {
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

    getTurn (
        req: BotRequest,
        res: BotResponse
    ) {
        const re = this.res.find(re => re.regExp.test(req.text));

        return {
            artifact: {
                intent: re && re.intent
            }
        };
    }
}

