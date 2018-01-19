import { Middleware } from './middleware';

export type TurnID = string;

export interface Request {
    channelID: string;
    conversationID: string;
    userID: string;

    turnID: TurnID;

    text: string;
}

export interface Response {
    responses: string[];

    reply: (text: string) => Response;
}

export class Bot {
    middlewares: Middleware[] = [];

    constructor() {
    }

    use <M extends Middleware> (middleware: M) {
        return this;
    }

    onReceiveActivity(handler: (req: Request, res: Response) => (any | Promise<any>)) {
        // go through all activityWasReceived middleware
        // run handler
        // go through all responseWillBeSent middleware
        // go through all 
    }
}
