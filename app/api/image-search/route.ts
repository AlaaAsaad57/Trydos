import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper function to convert file to generative part
async function fileToGenerativePart(file: File) {
  // Convert file to ArrayBuffer then to base64 using Node.js Buffer
  const arrayBuffer = await file.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString("base64");

  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    // Parse the FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const language = formData.get("language") as string;
    const prompt = formData.get("prompt") as string;

    // Validate required fields
    if (!file || !language || !prompt) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: "file, language, and prompt are required",
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/jpg",
      "image/webp",
      "image/gif",
      "image/svg+xml",
      "image/avif",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          details: "Only image files (JPEG, PNG, JPG, WEBP, GIF) are supported",
        },
        { status: 400 }
      );
    }

    // Initialize Google Generative AI
    const genAI = new GoogleGenerativeAI(
      process.env.NEXT_PUBLIC_GEMINI_API_KEY!
    );
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert file to generative part
    const fileGenerativePart = await fileToGenerativePart(file);

    // Create language-specific prompt
    const languagePrompt =
      language.toLowerCase() === "ar"
        ? `${
            prompt ||
            "Describe the product most clearly shown in this picture with no more than 5 words like: T-shirt black xxl"
          } (Please respond in Arabic)`
        : language.toLowerCase() === "en"
        ? `${
            prompt ||
            "Describe the product most clearly shown in this picture with no more than 5 words like: T-shirt black xxl"
          } (Please respond in English)`
        : `${
            prompt ||
            "Describe the product most clearly shown in this picture with no more than 5 words like: T-shirt black xxl"
          } (Please respond in Turkish)`;

    // Generate content using Google AI
    const result = await model.generateContent([
      languagePrompt,
      fileGenerativePart,
    ]);

    const response = await result.response;
    const text = response.text();

    return NextResponse.json({
      success: true,
      response: text,
      language: language,
      originalPrompt: prompt,
    });
  } catch (error) {
    console.error("Google AI API Error:", error);

    // Handle specific Google AI errors
    if (error.message?.includes("API_KEY")) {
      return NextResponse.json(
        {
          error: "API Configuration Error",
          details: "Google AI API key is missing or invalid",
        },
        { status: 500 }
      );
    }

    if (error.message?.includes("SAFETY")) {
      return NextResponse.json(
        {
          error: "Content Safety Error",
          details: "The content was flagged by safety filters",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message || "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}
