import { Promiseable, toPromise } from './misc';
import { Turn } from './turns';

export const makeContext = <Context> (
    getContext: (turn: Turn) => Promiseable<Context>
) => (
    handler: (context: Context) => Promiseable<any>,
) => async (
    turn: Turn,
) => toPromise(handler(await toPromise(getContext(turn))));
