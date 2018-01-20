import { Request, Response } from './bot';
import { MiddlewareMaker, Turn } from './middlewareMaker';
import { StateManager, IState } from './stateManager';

export class IgnoreAfterMidnight <ConversationState extends { time: Date }> extends MiddlewareMaker {
    constructor (
        private stateManager: StateManager<ConversationState, any>
    ) {
        super();
    }

    async activityWasReceived (
        req: Request,
        res: Response,
        next: (req: Request, res: Response) => Promise<void>,
        done: (req: Request, res: Response) => Promise<void>
    ) {
        const state = await this.stateManager.forTurn(req, res);

        if (state.conversation.time > midnight) {
            // call done;
        }
    }
}

export class PutTimeInState <ConversationState extends { time: Date }> extends MiddlewareMaker {
    constructor (
        private stateManager: StateManager<ConversationState, any>
    ) {
        super();
    }

    async activityWasReceived (
        req: Request,
        res: Response,
        next: (req: Request, res: Response) => Promise<void>,
        done: (req: Request, res: Response) => Promise<void>
    ) {
        const state = await this.stateManager.forTurn(req, res);

        state.conversation.time = new Date();
    }
}
