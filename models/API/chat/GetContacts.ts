import { Contact } from "models/Genaral/Contact";

export interface GetContactsApi {
    data: {
      data: Array<Contact>;
    };
  }