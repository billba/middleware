import { Turn, Middleware } from '../turns';

export interface RegExpArtifact {
    intent: string;
}

interface RE {
    regexp: RegExp;
    intent: string;
}

export class RegexpRecognizer {
    private res: RE[] = [];
    private cache: {
        [utterance: string]: string;
    } = {}

    add (
        regexp: RegExp,
        intent?: string
    ) {
        this.res.push({
            regexp,
            intent
        });

        return this;
    }

    recognize (
        turn: Turn,
    ) {
        if (turn.request.type !== 'message')
            return;

        const utterance = turn.request.text;

        if (this.cache.hasOwnProperty(utterance))
            return this.cache[utterance];

        const re = this.res.find(re => re.regexp.test(utterance));
        const intent = re && re.intent;

        this.cache[utterance] = intent;
        return intent;
    }
}
