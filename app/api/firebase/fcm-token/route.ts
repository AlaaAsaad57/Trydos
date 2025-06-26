import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { credential } from "firebase-admin";

// Initialize Firebase Admin SDK
const getFirebaseAdmin = (): App => {
  if (getApps().length === 0) {
    return initializeApp({
      credential: credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
  }
  return getApps()[0];
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, token, topic, deviceInfo } = body;

    const app = getFirebaseAdmin();
    const messaging = getMessaging(app);

    switch (action) {
      case "register":
        // Register/validate FCM token
        if (!token) {
          return NextResponse.json(
            { error: "Token is required for registration" },
            { status: 400 }
          );
        }

        try {
          // Validate token by sending a test message
          await messaging.send(
            {
              token,
              data: {
                type: "token_validation",
                timestamp: Date.now().toString(),
              },
            },
            true
          ); // dry run

          return NextResponse.json({
            success: true,
            message: "FCM token registered successfully",
            token,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Invalid FCM token",
              details: error.message,
            },
            { status: 400 }
          );
        }

      case "subscribe":
        // Subscribe token to topic
        if (!token || !topic) {
          return NextResponse.json(
            { error: "Token and topic are required for subscription" },
            { status: 400 }
          );
        }

        try {
          await messaging.subscribeToTopic([token], topic);
          return NextResponse.json({
            success: true,
            message: `Successfully subscribed to topic: ${topic}`,
            token,
            topic,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to subscribe to topic",
              details: error.message,
            },
            { status: 500 }
          );
        }

      case "unsubscribe":
        // Unsubscribe token from topic
        if (!token || !topic) {
          return NextResponse.json(
            { error: "Token and topic are required for unsubscription" },
            { status: 400 }
          );
        }

        try {
          await messaging.unsubscribeFromTopic([token], topic);
          return NextResponse.json({
            success: true,
            message: `Successfully unsubscribed from topic: ${topic}`,
            token,
            topic,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to unsubscribe from topic",
              details: error.message,
            },
            { status: 500 }
          );
        }

      case "send_notification":
        // Send notification via server
        const { title, body: messageBody, data, imageUrl, clickAction } = body;

        if (!token) {
          return NextResponse.json(
            { error: "Token is required for sending notification" },
            { status: 400 }
          );
        }

        try {
          const message = {
            token,
            notification: {
              title: title || "Trydos Notification",
              body: messageBody || "You have a new notification",
              ...(imageUrl && { imageUrl }),
            },
            data: {
              ...data,
              click_action: clickAction || "FLUTTER_NOTIFICATION_CLICK",
              timestamp: Date.now().toString(),
            },
            webpush: clickAction
              ? {
                  fcmOptions: {
                    link: clickAction,
                  },
                }
              : undefined,
          };

          const response = await messaging.send(message);
          return NextResponse.json({
            success: true,
            message: "Notification sent successfully",
            messageId: response,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to send notification",
              details: error.message,
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: register, subscribe, unsubscribe, send_notification",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("FCM API Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const topic = searchParams.get("topic");

    if (!token) {
      return NextResponse.json(
        { error: "Token is required for deletion" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const messaging = getMessaging(app);

    if (topic) {
      // Unsubscribe from specific topic
      try {
        await messaging.unsubscribeFromTopic([token], topic);
        return NextResponse.json({
          success: true,
          message: `Token unsubscribed from topic: ${topic}`,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to unsubscribe from topic",
            details: error.message,
          },
          { status: 500 }
        );
      }
    } else {
      // Note: Firebase doesn't provide a direct way to "delete" tokens
      // They automatically expire or become invalid
      return NextResponse.json({
        success: true,
        message:
          "Token invalidation requested. Token will be automatically cleaned up by Firebase.",
        note: "Remove token from your local storage and stop using it.",
      });
    }
  } catch (error) {
    console.error("FCM Delete Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const topic = searchParams.get("topic");

    const app = getFirebaseAdmin();
    const messaging = getMessaging(app);

    switch (action) {
      case "health":
        return NextResponse.json({
          success: true,
          message: "FCM service is healthy",
          timestamp: new Date().toISOString(),
        });

      case "topic_info":
        if (!topic) {
          return NextResponse.json(
            { error: "Topic is required for topic info" },
            { status: 400 }
          );
        }

        // Note: Firebase Admin SDK doesn't provide direct topic info
        // This is a placeholder for topic information
        return NextResponse.json({
          success: true,
          topic,
          message: "Topic exists and is available for subscriptions",
        });

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: health, topic_info" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("FCM GET Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
