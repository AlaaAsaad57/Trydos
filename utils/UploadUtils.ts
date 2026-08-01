import { fetchData } from "./fetchData";
import { REQUESTS_DATA } from "./Requests";

export async function GetTicket(folder: string, story: boolean, count: number) {
        let response=await fetchData({
            url:'/api/ticket',
            method:'POST',
            body:{folder,story,count},
            server:'local',
            reqTitle:REQUESTS_DATA.GET_TICKET
        });
        if(!response?.success) throw new Error(response?.message??'Failed to get ticket');
        return response?.ticket;
}