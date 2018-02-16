import { ActivityAdapter, Activity, ConversationResourceResponse } from 'botbuilder';

interface Context {
    request: Activity;
    responses: Activity[];
    flushResponses: () => Promise<ConversationResourceResponse[]>;
}

class Bot {
    constructor(private adapter: ActivityAdapter) {
    }

    onReceive(handler: (context: Context) => Promise<void>) {
        this.adapter.onReceive = request => {
            const responses: Activity[] = [];

            const context = {
                request,
                responses,
                flushResponses: () => this
                    .adapter
                    .post(responses)
                    .then(result => {
                        responses.length = 0;
                        return result;     
                    })
            }

            return handler(context);
        }
    }
}