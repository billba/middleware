import { Observable } from 'rxjs';
import { Activity } from './activity';

export interface Adapter {
    activity$: Observable<Activity>;
    postActivity$: (activity: Activity) => Observable<string>;
}
