import { Request, Response } from './bot';

export interface Middleware <T extends {} = {}>{
    activityWasReceived (
        req: Request,
        res: Response,
        next: (req: Request, res: Response) => Promise<void>,
        done: (req: Request, res: Response) => Promise<void>
    ): Promise<void>;
    
    responseWillBeSent (
        req: Request,
        res: Response,
        next: (req: Request, res: Response) => Promise<void>,
        done: (req: Request, res: Response) => Promise<void>
    ): Promise<void>;

    forTurn (
        req: Request,
        res: Response
    ): Promise<T>;

    dispose (
        req: Request,
        res: Response
    ): Promise<void>;
}
