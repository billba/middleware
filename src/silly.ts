import { Request, Response } from './bot';
import { MiddlewareMaker, Turn } from './middlewareMaker';
import { StateManager, IState } from './stateManager';

export class IgnoreAfterMidnight extends MiddlewareMaker {
    constructor (
        private stateManager: StateManager<{ time: Date }, {}>
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

export class PutTimeInState extends MiddlewareMaker {
    constructor (
        private stateManager: StateManager<{ time: Date }, {}>
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
