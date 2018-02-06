import { Context, onRequest, proactive } from './config';

onRequest(async c => {
    if (c.intent)
        await c.reply(`Intent found: ${c.intent}`);
    if (c.intent === 'start') {
        setInterval(() => {
            proactive(c.request, async d => {
                d.state.conversation.count = d.state.conversation.count === undefined ? 0 : d.state.conversation.count + 1;
                await d.reply(`timer count: ${c.state.conversation.count}`);
            });
        }, 3000);
    }
    await c.reply(`hey`);
});

