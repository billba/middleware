import { TurnDI } from "./TurnDI";
import { Turn } from "../turns";

// Storage that lasts for the duration of a turn
// Typically used to share data between middleware and/or the onRequest handler
// To use:
//     let middlewareThatSetsHighScore = (highScoreMemory: TurnMemory<number>) => ({
//         turn (turn, next) {
//             highScoreMemory.get(turn).value = 15000;
//         }
//     });

//     let highScoreMemory = new TurnMemory<number>();

//     bot
//         .use(middlewareThatSetsHighScore(highScoreMemory))
//         .onRequest(turn => {
//             if (turn.onRequest.text == 'standings')
//                 simple(turn).reply(`Your high score is ${highScoreMemory.get(turn).value}`);
//         })

class TurnMemory <VALUE> extends TurnDI <VALUE> {
    get (
        turn: Turn,
    ): VALUE {
        return this._get(turn, () => ({
            artifact: { value: undefined }
        }));
    }

    dispose (
        turn: Turn,
    ) {
        return this._dispose(turn);
    }
}
