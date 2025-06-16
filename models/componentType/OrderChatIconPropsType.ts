import { Channel } from "models/Genaral/Channel";

export interface OrderChatIconPropsType {
  id: number;
  setChatInfo: (s: Channel) => void;
  isChatOpen: boolean;
  setIsChatOpen: (s: boolean) => void;
}