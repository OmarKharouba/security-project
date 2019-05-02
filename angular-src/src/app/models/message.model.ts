export interface Message {
  mine?: boolean;
  created: Date;
  from: string;
  body: {
    text?: string;
    longitude?: number;
    latitude?: number;
    image?: string;
  };
  conversationId: string;
  inChatRoom: boolean;
}
