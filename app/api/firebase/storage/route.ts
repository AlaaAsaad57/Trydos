import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { credential } from "firebase-admin";
import { v4 as uuidv4 } from "uuid";

// Initialize Firebase Admin SDK
const getFirebaseAdmin = (): App => {
  if (getApps().length === 0) {
    return initializeApp({
      credential: credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
  }
  return getApps()[0];
};

const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "audio/mp3",
  "audio/wav",
  "audio/ogg",
  "application/pdf",
  "text/plain",
  "application/json",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "uploads";
    const fileName = formData.get("fileName") as string;
    const makePublic = formData.get("makePublic") === "true";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          allowedTypes: ALLOWED_FILE_TYPES,
        },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File too large",
          maxSize: `${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();

    // Generate unique filename
    const fileExtension = file.name.split(".").pop();
    const uniqueFileName = fileName || `${uuidv4()}.${fileExtension}`;
    const filePath = `${folder}/${uniqueFileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Upload file
    const fileRef = bucket.file(filePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
        metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      },
    });

    // Make public if requested
    if (makePublic) {
      await fileRef.makePublic();
    }

    // Get download URL
    const [url] = await fileRef.getSignedUrl({
      action: "read",
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      file: {
        name: uniqueFileName,
        path: filePath,
        url: makePublic
          ? `https://storage.googleapis.com/${bucket.name}/${filePath}`
          : url,
        size: file.size,
        type: file.type,
        isPublic: makePublic,
      },
    });
  } catch (error) {
    console.error("Storage Upload Error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload file",
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
    const filePath = searchParams.get("path");
    const folder = searchParams.get("folder");

    const app = getFirebaseAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();

    switch (action) {
      case "download":
        if (!filePath) {
          return NextResponse.json(
            { error: "File path is required for download" },
            { status: 400 }
          );
        }

        try {
          const fileRef = bucket.file(filePath);
          const [exists] = await fileRef.exists();

          if (!exists) {
            return NextResponse.json(
              { error: "File not found" },
              { status: 404 }
            );
          }

          const [url] = await fileRef.getSignedUrl({
            action: "read",
            expires: Date.now() + 60 * 60 * 1000, // 1 hour
          });

          return NextResponse.json({
            success: true,
            downloadUrl: url,
            path: filePath,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to generate download URL",
              details: error.message,
            },
            { status: 500 }
          );
        }

      case "list":
        try {
          const prefix = folder || "";
          const [files] = await bucket.getFiles({
            prefix,
            maxResults: 100,
          });

          const fileList = await Promise.all(
            files.map(async (file) => {
              const [metadata] = await file.getMetadata();
              return {
                name: file.name,
                size: metadata.size,
                contentType: metadata.contentType,
                created: metadata.timeCreated,
                updated: metadata.updated,
              };
            })
          );

          return NextResponse.json({
            success: true,
            files: fileList,
            folder: prefix,
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to list files",
              details: error.message,
            },
            { status: 500 }
          );
        }

      case "info":
        if (!filePath) {
          return NextResponse.json(
            { error: "File path is required for info" },
            { status: 400 }
          );
        }

        try {
          const fileRef = bucket.file(filePath);
          const [exists] = await fileRef.exists();

          if (!exists) {
            return NextResponse.json(
              { error: "File not found" },
              { status: 404 }
            );
          }

          const [metadata] = await fileRef.getMetadata();

          return NextResponse.json({
            success: true,
            file: {
              name: fileRef.name,
              size: metadata.size,
              contentType: metadata.contentType,
              created: metadata.timeCreated,
              updated: metadata.updated,
              bucket: metadata.bucket,
              generation: metadata.generation,
              etag: metadata.etag,
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              error: "Failed to get file info",
              details: error.message,
            },
            { status: 500 }
          );
        }

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: download, list, info" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Storage GET Error:", error);
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
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required for deletion" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();

    try {
      const fileRef = bucket.file(filePath);
      const [exists] = await fileRef.exists();

      if (!exists) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      await fileRef.delete();

      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
        path: filePath,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to delete file",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Storage Delete Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { filePath, metadata, makePublic } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: "File path is required for update" },
        { status: 400 }
      );
    }

    const app = getFirebaseAdmin();
    const storage = getStorage(app);
    const bucket = storage.bucket();

    try {
      const fileRef = bucket.file(filePath);
      const [exists] = await fileRef.exists();

      if (!exists) {
        return NextResponse.json({ error: "File not found" }, { status: 404 });
      }

      // Update metadata if provided
      if (metadata) {
        await fileRef.setMetadata({ metadata });
      }

      // Change public access if specified
      if (typeof makePublic === "boolean") {
        if (makePublic) {
          await fileRef.makePublic();
        } else {
          await fileRef.makePrivate();
        }
      }

      const [updatedMetadata] = await fileRef.getMetadata();

      return NextResponse.json({
        success: true,
        message: "File updated successfully",
        file: {
          name: fileRef.name,
          size: updatedMetadata.size,
          contentType: updatedMetadata.contentType,
          updated: updatedMetadata.updated,
          isPublic: makePublic,
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to update file",
          details: error.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Storage Update Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
