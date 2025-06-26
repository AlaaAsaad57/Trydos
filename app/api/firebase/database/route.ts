import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getDatabase, Query, Reference } from "firebase-admin/database";
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
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
  return getApps()[0];
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");
    const orderBy = searchParams.get("orderBy");
    const limitToFirst = searchParams.get("limitToFirst");
    const limitToLast = searchParams.get("limitToLast");
    const startAt = searchParams.get("startAt");
    const endAt = searchParams.get("endAt");
    const equalTo = searchParams.get("equalTo");

    if (!path) {
      return NextResponse.json(
        { error: "Path is required for database read operation" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const database = getDatabase(app);
    let ref: Query | Reference = database.ref(path);

    // Apply query constraints
    if (orderBy) {
      ref = ref.orderByChild(orderBy);
    }

    if (limitToFirst) {
      ref = ref.limitToFirst(parseInt(limitToFirst));
    }

    if (limitToLast) {
      ref = ref.limitToLast(parseInt(limitToLast));
    }

    if (startAt) {
      ref = ref.startAt(startAt);
    }

    if (endAt) {
      ref = ref.endAt(endAt);
    }

    if (equalTo) {
      ref = ref.equalTo(equalTo);
    }

    const snapshot = await ref.once("value");
    const data = snapshot.val();

    return NextResponse.json({
      success: true,
      data,
      path,
      exists: snapshot.exists(),
      key: snapshot.key,
    });
  } catch (error: any) {
    console.error("Database Read Error:", error);
    return NextResponse.json(
      {
        error: "Failed to read from database",
        details: error?.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path, data, priority } = body;

    if (!path) {
      return NextResponse.json(
        { error: "Path is required for database operation" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const database = getDatabase(app);
    const ref = database.ref(path);

    switch (action) {
      case "set":
        // Set data at path (overwrites existing data)
        if (data === undefined) {
          return NextResponse.json(
            { error: "Data is required for set operation" },
            { status: 400 }
          );
        }

        if (priority !== undefined) {
          await ref.setWithPriority(data, priority);
        } else {
          await ref.set(data);
        }

        return NextResponse.json({
          success: true,
          message: "Data set successfully",
          path,
        });

      case "update":
        // Update specific fields at path
        if (!data || typeof data !== "object") {
          return NextResponse.json(
            { error: "Data object is required for update operation" },
            { status: 400 }
          );
        }

        await ref.update(data);

        return NextResponse.json({
          success: true,
          message: "Data updated successfully",
          path,
          updatedFields: Object.keys(data),
        });

      case "push":
        // Push new child with auto-generated key
        if (data === undefined) {
          return NextResponse.json(
            { error: "Data is required for push operation" },
            { status: 400 }
          );
        }

        const newRef = await ref.push(data);

        return NextResponse.json({
          success: true,
          message: "Data pushed successfully",
          path,
          newKey: newRef.key,
          newPath: `${path}/${newRef.key}`,
        });

      case "transaction":
        // Perform atomic transaction
        const { updateFunction } = body;

        if (!updateFunction) {
          return NextResponse.json(
            { error: "Update function is required for transaction" },
            { status: 400 }
          );
        }

        // Note: This is a simplified transaction implementation
        // In practice, you might want to pass the function logic through the request
        const result = await ref.transaction((currentData) => {
          if (currentData === null) {
            return data;
          }
          // Apply your transaction logic here based on the updateFunction parameter
          // This is a basic example - you'd customize based on your needs
          if (updateFunction === "increment") {
            return (currentData || 0) + (data || 1);
          }
          if (updateFunction === "append") {
            return Array.isArray(currentData)
              ? [...currentData, data]
              : [currentData, data];
          }
          return data;
        });

        return NextResponse.json({
          success: true,
          message: "Transaction completed successfully",
          path,
          committed: result.committed,
          snapshot: result.snapshot?.val(),
        });

      case "setPriority":
        // Set priority for existing data
        if (priority === undefined) {
          return NextResponse.json(
            { error: "Priority is required for setPriority operation" },
            { status: 400 }
          );
        }

        await ref.setPriority(priority, (error) => {
          if (error) {
            console.error("Priority set failed:", error);
          }
        });

        return NextResponse.json({
          success: true,
          message: "Priority set successfully",
          path,
          priority,
        });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: set, update, push, transaction, setPriority",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Database Write Error:", error);
    return NextResponse.json(
      {
        error: "Failed to write to database",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Path is required for database delete operation" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const database = getDatabase(app);
    const ref = database.ref(path);

    // Check if data exists before deletion
    const snapshot = await ref.once("value");
    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: "Data does not exist at the specified path" },
        { status: 404 }
      );
    }

    await ref.remove();

    return NextResponse.json({
      success: true,
      message: "Data deleted successfully",
      path,
    });
  } catch (error) {
    console.error("Database Delete Error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete from database",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path, rules } = body;

    if (!path) {
      return NextResponse.json(
        { error: "Path is required for database management operation" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const database = getDatabase(app);

    switch (action) {
      case "setRules":
        // Set security rules (requires admin privileges)
        if (!rules) {
          return NextResponse.json(
            { error: "Rules are required for setRules operation" },
            { status: 400 }
          );
        }

        await database.setRules(rules);

        return NextResponse.json({
          success: true,
          message: "Database rules updated successfully",
        });

      case "getRules":
        // Get current security rules
        const currentRules = await database.getRules();

        return NextResponse.json({
          success: true,
          rules: currentRules,
        });

      case "goOffline":
        // Force database to go offline (for testing)
        database.goOffline();

        return NextResponse.json({
          success: true,
          message: "Database forced offline",
        });

      case "goOnline":
        // Force database to go online
        database.goOnline();

        return NextResponse.json({
          success: true,
          message: "Database forced online",
        });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: setRules, getRules, goOffline, goOnline",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Database Management Error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform database management operation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// WebSocket-like endpoint for real-time listening (simplified)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, path, eventType = "value" } = body;

    if (!path) {
      return NextResponse.json(
        { error: "Path is required for listener operation" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const database = getDatabase(app);
    const ref = database.ref(path);

    switch (action) {
      case "once":
        // Listen once for specific event
        const snapshot = await ref.once(eventType as any);

        return NextResponse.json({
          success: true,
          event: eventType,
          data: snapshot.val(),
          key: snapshot.key,
          path,
          exists: snapshot.exists(),
        });

      case "orderByChild":
        // Query ordered by child
        const { child, value } = body;
        if (!child) {
          return NextResponse.json(
            { error: "Child key is required for orderByChild operation" },
            { status: 400 }
          );
        }

        let query = ref.orderByChild(child);
        if (value !== undefined) {
          query = query.equalTo(value);
        }

        const orderedSnapshot = await query.once("value");

        return NextResponse.json({
          success: true,
          data: orderedSnapshot.val(),
          path,
          orderBy: child,
          filterValue: value,
        });

      case "orderByKey":
        // Query ordered by key
        const keySnapshot = await ref.orderByKey().once("value");

        return NextResponse.json({
          success: true,
          data: keySnapshot.val(),
          path,
          orderBy: "key",
        });

      case "orderByValue":
        // Query ordered by value
        const valueSnapshot = await ref.orderByValue().once("value");

        return NextResponse.json({
          success: true,
          data: valueSnapshot.val(),
          path,
          orderBy: "value",
        });

      default:
        return NextResponse.json(
          {
            error:
              "Invalid action. Supported actions: once, orderByChild, orderByKey, orderByValue",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Database Listener Error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform listener operation",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
