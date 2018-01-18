type TurnID = string;

interface Address {
    channelID: string,
    converationID: string,
    userID: string
}

interface Stuff {
    dispose: () => Promise<void>;
}

abstract class Middleware <T extends Stuff> {
    private rgt: Record<TurnID, T> = {}
    get: (address: Address, turnID: TurnID) => Promise<T>;
    dispose: (turnID: TurnID) => Promise<void>;

    constructor(
        get: (address: Address) => Promise<T>
    ) {
        this.get = (address, turnID) => {

            let t = this.rgt[turnID];

            return t
                ? Promise.resolve(t)
                : get(address)
                    .then(t => {
                        this.rgt[turnID] = t;

                        return t;            
                    });
        }

        this.dispose = (turnID) => {

            let t = this.rgt[turnID];

            if (t) {
                t
                    .dispose()
                    .then(() => {
                        delete this.rgt[turnID];
                    })
            }

            throw new Error(`nothing there for ${turnID}`)
        }
    }
}
