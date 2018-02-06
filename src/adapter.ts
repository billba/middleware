import { Observable } from 'rxjs';
import { Activity } from './activity';

export interface Adapter {
    activity$: Observable<Activity>;
    post: (activities: Activity[]) => Promise<Array<string>>;
}
