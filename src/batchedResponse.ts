import { TurnDI } from './TurnDI';
import { IStorage } from './storage';
import { Turn, Middleware } from './turns';
import { Activity } from './activity';

export interface BatchedResponseAPI {
    responses: Activity[];
    reply (text: string): BatchedResponse;
    flushResponses (): Promise<void>;
}

export class BatchedResponse implements BatchedResponseAPI {
    constructor (
        private turn: Turn
    ) {
    }

    responses: Activity[] = [];

    reply (text: string) {
        this.responses.push({
            ... this.turn.request,
            type: 'message',
            text
        });

        return this;
    }

    async flushResponses () {
        await this.turn.postActivities(this.responses);
        this.responses = [];
    }
}

export class BatchedResponseMaker extends TurnDI<BatchedResponseAPI> {
    constructor () {
        super();
    }

    get (
        turn: Turn,
    ) {
        return this._get(turn, () => {
            const batched = new BatchedResponse(turn);
    
            return {
                artifact: {
                    responses: batched.responses,
                    reply: text => batched.reply(text),
                    flushResponses: () => batched.flushResponses()
                },

                dispose() {
                    return batched.flushResponses();
                }
            }    
        })
    }

    dispose (
        turn: Turn
    ) {
        return this._dispose(turn);
    }
}
