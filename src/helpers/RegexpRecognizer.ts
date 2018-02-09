import { Turn, Middleware } from '../turns';
import { TurnService } from './TurnService';

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

        const intent = this.cache[turn.request.text];
        if (intent)
            return intent;

        const re = this.res.find(re => re.regexp.test(turn.request.text));

        if (re)
            return re.intent;
    }
}
