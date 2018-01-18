
interface State<Conversation, User> extends Stuff {
    conversation: Conversation;
    user: User;
}

class StateMiddleware <Conversation, User>  extends Middleware<State<Conversation, User>> {
    constructor() {
        super(address => Promise.resolve({
            conversation: {} as Conversation,
            user: {} as User,
            dispose: () => Promise.resolve()
        }));
    }
}