import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
const serviceAccount = require("./trydos-2e2b2-firebase-adminsdk-3us2s-45fbfe0153.json");

let app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
        databaseURL:
          "https://trydos-2e2b2-default-rtdb.europe-west1.firebasedatabase.app",
      })
    : getApps()[0];
export async function POST(request: NextRequest) {
  const formData = await request.json();

  //   @ts-ignore
  const token = formData.token;
  //   @ts-ignore
  const topic = formData.topic;
  //   @ts-ignore
  try {
    await getMessaging(app)
      .subscribeToTopic(token, topic)
      .then((s) => {
        return NextResponse.json({ subscribed: true, s }, { status: 200 });
      })
      .catch((s) => {
        return NextResponse.json({ subscribed: false, s }, { status: 500 });
      });
  } catch (error) {
    return NextResponse.json({ subscribed: true }, { status: 500 });
  }
  return NextResponse.json({ subscribed: true }, { status: 200 });
}
