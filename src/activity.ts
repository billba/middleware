interface BaseActivity {
    channelID: string;
    conversationID: string;
    userID: string;
    type: string;
}

interface Message extends BaseActivity {
    type: 'message';
    text: string;
}

interface Proactive extends BaseActivity {
    type: 'proactive';
}

export type Activity = Message | Proactive;
