import { Context, onRequest, proactive } from './setup';

onRequest(context => {
    if (context.request.type === 'message')
        echo(context);
});

const echo = (context: Context) => {
    context.reply(`${context.state.conversation.count}: You said "${context.request.text}".`);
    if (context.intent === 'introduction')
        context.reply(`Nice to meet you!`);
    else if (context.intent === 'start') 
        setInterval(() => {
            proactive(context.request, async d => {
                d.reply(`${d.state.conversation.count}: Proactive turn id "${d.id}"`);
            });
        }, 3000);
}
