import { Observable } from 'rxjs';
import { Activity } from './activity';

export interface Adapter {
    activity$: Observable<Activity>;
    postActivities: (activities: Activity[]) => Promise<Array<string>>;
}
