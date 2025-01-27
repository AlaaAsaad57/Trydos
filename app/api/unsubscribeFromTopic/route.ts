import { NextRequest, NextResponse } from "next/server";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
const serviceAccount = require("./trydos-2e2b2-firebase-adminsdk-3us2s-45fbfe0153.json");

// Initialize Firebase Admin SDK
let app =
  getApps().length === 0
    ? initializeApp({
      credential: cert(serviceAccount),
      databaseURL:
        "https://trydos-2e2b2-default-rtdb.europe-west1.firebasedatabase.app",
    })
    : getApps()[0];

export async function POST(request: NextRequest) {
  try {
    // Parse the incoming JSON request body
    const { token, topic } = await request.json();

    if (!token || !topic) {
      return NextResponse.json(
        { error: "Token or topic missing" },
        { status: 400 }
      );
    }

    // Unsubscribe the device from the topic
    await getMessaging(app).unsubscribeFromTopic(token, topic);

    // Return a success response
    return NextResponse.json(
      { message: "Unsubscribed successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error unsubscribing from topic:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe from topic", details: error },
      { status: 500 }
    );
  }
}
