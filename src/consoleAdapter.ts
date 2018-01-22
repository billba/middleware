import { Adapter, Activity } from './bot';
import { Observable, Subject } from 'rxjs';
import readline = require('readline');

export class ConsoleAdapter implements Adapter {
    constructor() {
        const rl = readline.createInterface({
            input: process.stdin
        });

        rl.on('line', (text: string) => {
            this.activity$.next({
                channelID: 'nodeConsole',
                conversationID: 'conversation',
                userID: 'user',
                type: 'message',
                text
            })
        }
        );
    }

    activity$ = new Subject<Activity>();

    postActivity$ (activity: Activity) {
        console.log("| ", activity.text);
        return Observable.of("success");
    }
}
