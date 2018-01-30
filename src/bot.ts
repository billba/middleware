import { Middleware } from './middleware';
import { Observable } from 'rxjs';
import { Activity } from './activity';
import { Adapter } from './adapter';

export type Promiseable <T> = T | Promise<T>;

export const toPromise = <T> (t: Promiseable<T>) => t instanceof Promise ? t : Promise.resolve(t);

export type TurnID = string;

export interface BotRequest extends Activity{
    turnID: TurnID;
}

export interface BotResponse {
    reply: (text: string) => Promise<void>;
}

export type Handler = (req: BotRequest, res: BotResponse) => (any | Promise<any>);

export class Bot {
    private middlewares: Middleware[] = [];
    private transformers: ((activity: Activity, next: () => Promise<void>) => Promise<void>)[];
    
    public postActivity: (activity: Activity) => Promise<string>;

    constructor (
        private adapter: Adapter,
        ... transformers: ((activity: Activity, next: () => Promise<void>) => Promise<void>)[]
    ) {
        transformers.reverse();
        this.postActivity = activity => transformers
            .reduce<() => Promise<void>>(
                (next, transformer) => () => transformer(activity, next),
                () => Promise.resolve()
            )
            ()
            .then(() => this.adapter.postActivity$(activity).toPromise());
    }

    use (middleware: Middleware) {
        this.middlewares.push(middleware);

        return this;
    }

    getReqRes (
        activity: Activity
    ) {
        return {
            req: {
                ... activity,
                turnID: `${activity.channelID}.${activity.conversationID}.${activity.userID}.${Date.now().toString()}`
            } as BotRequest,
        
            res: {
                reply: (text: string) => this.postActivity({
                    ... activity,
                    text
                })
                .then(() => {})
            } as BotResponse
        }
    }

    onReceiveActivity (handler: Handler) {
        const reversedMiddlewares = [...this.middlewares].reverse();

        this
            .adapter
            .activity$
            .map(activity => this.getReqRes(activity))
            .flatMap(({ req, res }) => reversedMiddlewares
                .reduce(
                    (next, middleware) => () => middleware(req, res, next),
                    () => toPromise(handler(req, res))
                )
                ()
            )
            .subscribe();
    }
}
