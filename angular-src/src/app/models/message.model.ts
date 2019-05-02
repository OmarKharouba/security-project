export interface Message {
  mine?: boolean;
  created: Date;
  from: string;
  body: {
    text?: string;
    longitude?: number;
    latitude?: number;
  }
  conversationId: string;
  inChatRoom: boolean;
}
