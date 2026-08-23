
import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "utils/fcm";
import { LogServerError } from "utils/serverErrorReporter";

const tokenInfoHandler = async (request: NextRequest): Promise<NextResponse> => {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const access_token = await getAccessToken();

    const iidResponse = await fetch(
      `https://iid.googleapis.com/iid/info/${(token)}?details=true`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
          // Required by the IID API when authenticating with an OAuth2 Bearer
          // token instead of a legacy FCM server key.
          "access_token_auth": "true",
        },
      }
    );

    const data = await iidResponse.json();

    if (!iidResponse.ok) {
      return NextResponse.json(
        { error: "IID API error", details: data },
        { status: iidResponse.status }
      );
    }

    return NextResponse.json({
      topics: data.rel?.topics ? Object.keys(data.rel.topics) : [],
      details: data,
    });
  } catch (error) {
    LogServerError(error, "api/info");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  return tokenInfoHandler(request);
}