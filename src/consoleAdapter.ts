import { Adapter } from './adapter';
import { Activity } from './activity';
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

    async postActivities (activities: Activity[]) {
        return activities.map(activity => {
            if (activity.type === 'message')
                console.log("| ", activity.text);
            return "success";
        });
    }
}
