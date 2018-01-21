import { Middleware, normalizeMiddleware } from './middleware';
import { Observable } from 'rxjs';

export const toPromise = <T> (t: T | Promise<T>) => t instanceof Promise ? t : Promise.resolve(t);

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

export class Bot {
    private middlewares: Middleware[] = [];

    constructor(
        private adapter: Adapter
    ) {
    }

    use (middleware: Partial<Middleware>) {
        this.middlewares.push(normalizeMiddleware(middleware));

        return this;
    }

    onReceiveActivity(handler: Handler) {
        const reversedMiddlewares = [...this.middlewares].reverse();

        this
            .adapter
            .activity$
            .map(activity => ({
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
                        .flatMap(activity => this.adapter.postActivity$(activity))
                        .map(result => {})
                        .toPromise()
                } as BotResponse
            }))
            .flatMap(async ({ req, res }) => {
                await reversedMiddlewares
                    .reduce(
                        (acc, value) => () => value.activityWasReceived(req, res, () => acc()),
                        () => toPromise(handler(req, res))
                    )
                    ();

                await this.middlewares
                    .reduce(
                        (acc, value) => () => value.middlewareWillBeDisposed(req, res, () => acc()),
                        () => Promise.resolve()
                    )
                    ();

                for (let middleware of this.middlewares) {
                    await middleware.dispose(req, res);
                }
            })
            .subscribe();
    }
}
