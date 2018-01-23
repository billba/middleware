import { Middleware } from './middleware';
import { Observable } from 'rxjs';

export type Promiseable <T> = T | Promise<T>;

export const toPromise = <T> (t: Promiseable<T>) => t instanceof Promise ? t : Promise.resolve(t);

export type TurnID = string;

export interface Activity {
    channelID: string;
    conversationID: string;
    userID: string;
    
    type: 'message';
    text: string;
}

export interface BotRequest extends Activity{
    turnID: TurnID;
}

export interface BotResponse {
    reply: (text: string) => Promise<void>;
}

export type Handler = (req: BotRequest, res: BotResponse) => (any | Promise<any>);

export interface Adapter {
    activity$: Observable<Activity>;
    postActivity$: (activity: Activity) => Observable<string>;
}

const getReqRes = (
    adapter: Adapter,
    activity: Activity
) => ({
    req: {
        ... activity,
        turnID: `${activity.channelID}.${activity.conversationID}.${activity.userID}.${Date.now().toString()}`
    } as BotRequest,

    res: {
        reply: (text: string) => Observable
            .of(text)
            .map(text => ({
                ... activity,
                text
            } as Activity))
            .flatMap(activity => adapter.postActivity$(activity))
            .map(result => {})
            .toPromise()
    } as BotResponse
});

export class Bot {
    private middlewares: Middleware[] = [];

    constructor(
        private adapter: Adapter
    ) {
    }

    use (middleware: Middleware) {
        this.middlewares.push(middleware);

        return this;
    }

    onReceiveActivity(handler: Handler) {
        return new EndTurn(this.adapter, this.middlewares, handler);
    }
}

export class EndTurn {
    constructor(
        private adapter: Adapter,
        private middlewares: Middleware[],
        private onReceiveActivityHandler: Handler
    ) {
    }

    endTurn(handler: Handler) {
        const reversedMiddlewares = [...this.middlewares].reverse();

        this
            .adapter
            .activity$
            .map(activity => getReqRes(this.adapter, activity))
            .flatMap(async ({ req, res }) => {

                await reversedMiddlewares
                    .reduce(
                        (next: () => Promise<void>, middleware) => () => middleware(req, res, next),
                        () => toPromise(this.onReceiveActivityHandler(req, res))
                    )
                    ();

                await toPromise(handler(req, res));
            })
            .subscribe();
    }
}
