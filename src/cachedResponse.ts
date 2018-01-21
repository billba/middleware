import { BotRequest, BotResponse, Activity } from './bot';
import { MiddlewareMaker, Turn } from './middlewareMaker';
import { IStorage } from './storage';

export class CachedResponse {
    constructor (
        private res: BotResponse
    ) {
    }

    responses: string[] = [];

    reply (text: string) {
        this.responses.push(text);

        return this;
    }

    async flushResponses () {
        for (const response of this.responses) {
            await this.res.reply(response);
        }

        this.responses = [];
    }
}

export class CachedResponseMW extends MiddlewareMaker<CachedResponse> {
    constructor () {
        super();
    }

    getTurn(
        req: BotRequest,
        res: BotResponse
    ) {
        const artifact = new CachedResponse(res);

        return {
            artifact,
            dispose() {
                return artifact.flushResponses();
            }
        }
    }
}
