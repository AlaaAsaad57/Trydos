import { NextRequest, NextResponse } from "next/server";

const ASSEMBLYAI_API_KEY = "570c38c748e94bc29e774c441d9315ad";
const ASSEMBLYAI_BASE_URL = "https://api.assemblyai.com/v2";

export async function POST(request: NextRequest) {
  try {
    console.log("Speech recognition API called");

    if (!ASSEMBLYAI_API_KEY) {
      console.error("AssemblyAI API key not configured");
      return NextResponse.json(
        { error: "AssemblyAI API key not configured" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio") as File;
    const language = (formData.get("language") as string) || "en";

    console.log("Audio file:", {
      name: audioFile?.name,
      size: audioFile?.size,
      type: audioFile?.type,
    });
    console.log("Language:", language);

    if (!audioFile) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    if (audioFile.size === 0) {
      console.error("Audio file is empty");
      return NextResponse.json(
        { error: "Audio file is empty" },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    console.log("Audio buffer size:", audioBuffer.length);

    // Step 1: Upload audio to AssemblyAI
    console.log("Uploading to AssemblyAI...");
    const uploadResponse = await fetch(`${ASSEMBLYAI_BASE_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `${ASSEMBLYAI_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: audioBuffer,
    });

    console.log("Upload response status:", uploadResponse.status);
    console.log(
      "Upload response headers:",
      Object.fromEntries(uploadResponse.headers.entries())
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Upload failed:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Upload failed: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`
      );
    }

    const uploadResult = await uploadResponse.json();
    console.log("Upload successful:", uploadResult);
    const { upload_url } = uploadResult;

    // Step 2: Request transcription
    console.log("Requesting transcription...");
    const transcriptionPayload = {
      audio_url: upload_url,
      language_code: language === "ar" ? "ar" : "en_us",
      speech_model: "best",
      auto_highlights: false,
      disfluencies: false,
      speaker_labels: false,
    };
    console.log("Transcription payload:", transcriptionPayload);

    const transcriptResponse = await fetch(
      `${ASSEMBLYAI_BASE_URL}/transcript`,
      {
        method: "POST",
        headers: {
          Authorization: `${ASSEMBLYAI_API_KEY}`,
        },
        body: JSON.stringify(transcriptionPayload),
      }
    );

    console.log("Transcription response status:", transcriptResponse.status);

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error("Transcription request failed:", {
        status: transcriptResponse.status,
        statusText: transcriptResponse.statusText,
        error: errorText,
      });
      throw new Error(
        `Transcription request failed: ${transcriptResponse.status} ${transcriptResponse.statusText} - ${errorText}`
      );
    }

    const transcriptResult = await transcriptResponse.json();
    console.log("Transcription request successful:", transcriptResult);
    const { id: transcriptId } = transcriptResult;

    // Step 3: Poll for completion
    console.log("Starting polling for transcript ID:", transcriptId);
    let transcript;
    let attempts = 0;
    const maxAttempts = 60; // 60 seconds timeout

    while (attempts < maxAttempts) {
      console.log(`Polling attempt ${attempts + 1}/${maxAttempts}`);

      const pollResponse = await fetch(
        `${ASSEMBLYAI_BASE_URL}/transcript/${transcriptId}`,
        {
          headers: {
            Authorization: `Bearer ${ASSEMBLYAI_API_KEY}`,
          },
        }
      );

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error("Polling failed:", {
          status: pollResponse.status,
          statusText: pollResponse.statusText,
          error: errorText,
        });
        throw new Error(
          `Polling failed: ${pollResponse.status} ${pollResponse.statusText} - ${errorText}`
        );
      }

      transcript = await pollResponse.json();
      console.log("Polling response:", transcript);

      if (transcript.status === "completed") {
        console.log("Transcription completed successfully");
        break;
      } else if (transcript.status === "error") {
        console.error("Transcription failed:", transcript.error);
        throw new Error(`Transcription failed: ${transcript.error}`);
      }

      console.log(
        `Transcript status: ${transcript.status}, waiting 1 second...`
      );
      // Wait 1 second before next poll
      await new Promise((resolve) => setTimeout(resolve, 1000));
      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.error("Transcription timeout after", maxAttempts, "attempts");
      throw new Error("Transcription timeout");
    }

    return NextResponse.json({
      success: true,
      transcription: transcript.text || "",
      confidence: transcript.confidence,
      language: language,
    });
  } catch (error) {
    console.error("Speech recognition error:", error);
    return NextResponse.json(
      { error: "Failed to process audio", details: error.message },
      { status: 500 }
    );
  }
}
