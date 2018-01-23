import { BotRequest, BotResponse, Activity } from './bot';
import { TurnDI } from './TurnDI';
import { IStorage } from './storage';

export class BatchedResponse {
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

export class BatchedResponseMaker extends TurnDI<BatchedResponse> {
    constructor () {
        super();
    }

    get (
        req: BotRequest,
        res: BotResponse
    ) {
        return this._get(req.turnID, () => {
            const artifact = new BatchedResponse(res);

            return {
                artifact,
                dispose() {
                    return artifact.flushResponses();
                }
            }    
        })
    }

    dispose (
        req: BotRequest
    ) {
        return this._dispose(req.turnID)
    }
}
