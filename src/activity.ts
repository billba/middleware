export interface Activity {
    channelID: string;
    conversationID: string;
    userID: string;
    
    type: 'message';
    text: string;
}
