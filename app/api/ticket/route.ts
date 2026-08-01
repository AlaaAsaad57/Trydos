import { NextRequest, NextResponse } from "next/server";
import { missingToken, readMarketToken } from "../seller/comments/_utils";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";


export async function POST(request: NextRequest) {
  try {
    let authTokenFromCookies=await request.cookies.get(COOKIE_NAMES.MARKET_TOKEN);
    const authToken = readMarketToken(request);
    if (!authToken && !authTokenFromCookies?.value) return missingToken();
    const body = await request.json();
    const folder = body?.folder;
    const story = body?.story;
    const count=body?.count;
    let TicketResponse =await fetch(process.env.NEXT_PUBLIC_MEDIA_SERVER_BASE_URL+'/gated/ticket',{
        headers:{
            authorization: `Bearer ${authToken || authTokenFromCookies?.value}`,
            "Content-Type": "application/json",
            
        },
        method: "POST",
        body: JSON.stringify({folder,story,count}),
        cache: "no-store",
    });
    if(!TicketResponse.ok){
        let JsonResponse=await TicketResponse.json();
        return NextResponse.json({ success: false, message: "Failed to get ticket",...JsonResponse }, { status: TicketResponse.status??500 });
    }
    let ticket=(await TicketResponse.json())?.ticket;
    if(!ticket) return NextResponse.json({ success: false, message: "Failed to get ticket" }, { status: 500 });
    return NextResponse.json({ success: true ,ticket:ticket}, { status: 200 });
  } catch (error: any) {
  
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to subscribe to topic",
      },
      { status: 500 },
    );
  }
}
