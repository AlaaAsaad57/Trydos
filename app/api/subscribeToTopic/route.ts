import { NextRequest, NextResponse } from "node_modules/next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
const serviceAccount = require("./trydos-ce234-firebase-adminsdk-zl2xp-be412a3540.json");

let app =
  getApps().length === 0
    ? initializeApp({
        credential: cert(serviceAccount),
        databaseURL: "https://trydos-ce234-default-rtdb.firebaseio.com/",
      })
    : getApps()[0];
export async function POST(request: NextRequest) {
  const formData = await request.json();

  //   @ts-ignore
  const token = formData.token;
  //   @ts-ignore
  const topic = formData.topic;
  //   @ts-ignore
  await getMessaging(app)
    .subscribeToTopic(token, topic)
    .then((s) => {
      console.log("success", s);
      return NextResponse.json({ subscribed: true }, { status: 200 });
    })
    .catch((s) => {
      console.error("error", s);
      return NextResponse.json({ subscribed: false }, { status: 500 });
    });
  return NextResponse.json({ subscribed: true }, { status: 200 });
}
