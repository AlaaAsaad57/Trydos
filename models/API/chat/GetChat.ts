import { Channel } from "models/Genaral/Channel";

export interface GetChatsApi {
  data: {
    data: {
      channels: Array<Channel>;
      pinned_channels: Array<Channel>;
      missed_fcm_token: boolean;
    };
  };
}