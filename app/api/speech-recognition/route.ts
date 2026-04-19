import { NextRequest, NextResponse } from "next/server";
import { LogServerError } from "utils/serverErrorReporter";

const ASSEMBLYAI_API_KEY = "570c38c748e94bc29e774c441d9315ad";
const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";

export async function POST(request: NextRequest) {
  try {
    if (!ASSEMBLYAI_API_KEY) {
      console.error("AssemblyAI API key not configured");
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "en";

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 },
      );
    }

    if (audioFile.size === 0) {
      console.error("Audio file is empty");
      return NextResponse.json(
        { error: "Audio file is empty" },
        { status: 400 },
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Step 1: Upload audio to AssemblyAI

    const uploadResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `${ASSEMBLYAI_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      credentials: "omit",

      body: audioBuffer,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`,
      );
    }

    const uploadResult = await uploadResponse.json();

    const { upload_url } = uploadResult;

    // Step 2: Request transcription

    const transcriptionPayload = {
      audio_url: upload_url,
      language_code: language === "ar" ? "ar" : "en_us",
      speech_model: "best",
      auto_highlights: false,
      disfluencies: false,
      speaker_labels: false,
    };

    const transcriptResponse = await fetch(
      `${ASSEMBLYAI_BASE_URL}/transcript`,
      {
        method: "POST",
        headers: {
          Authorization: `${ASSEMBLYAI_API_KEY}`,
        },
        body: JSON.stringify(transcriptionPayload),
        credentials: "omit",
      },
    );

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error("Transcription request failed:", {
        status: transcriptResponse.status,
        statusText: transcriptResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Transcription request failed: ${transcriptResponse.status} ${transcriptResponse.statusText} - ${errorText}`,
      );
    }

    const transcriptResult = await transcriptResponse.json();

    const { id: transcriptId } = transcriptResult;

    let transcript;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (attempts < maxAttempts) {
      const pollResponse = await fetch(
        `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`,
        {
          headers: {
            Authorization: `Bearer ${ASSEMBLYAI_API_KEY}`,
          },
        },
      );

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();

        throw new Error(
          `Polling failed: ${pollResponse.status} ${pollResponse.statusText} - ${errorText}`,
        );
      }

      transcript = await pollResponse.json();

      if (transcript.status === "completed") {
        break;
      } else if (transcript.status === "error") {
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      throw new Error("Transcription timeout");
    }

    return NextResponse.json({
      success: true,
      transcription: transcript.text || "",
      confidence: transcript.confidence,
      language: language,
    });
  } catch (error) {
    LogServerError({
      error,
      type: "search voice api route",
      headers: request.headers,
      url: request.url,
      method: request.method,
    });
    console.error("Speech recognition error:", error);
    return NextResponse.json(
      { error: "Failed to process audio", details: error.message },
      { status: 500 },
    );
  }
}
