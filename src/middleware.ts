import { BotRequest, BotResponse } from './bot';

export type Middleware = (
    req: BotRequest,
    res: BotResponse,
    next: () => Promise<void>,
) => Promise<void>;
