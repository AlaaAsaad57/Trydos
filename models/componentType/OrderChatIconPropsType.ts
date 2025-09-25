import { Channel } from "models/Genaral/Channel";

export interface OrderChatIconPropsType {
  id: number;
  isGettingChat: boolean;
  setIsGettingChat: (e: boolean) => void;
  getChatWithShipping: () => void;
  order_group_id: string;
}
