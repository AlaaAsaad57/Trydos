# Google AI API

## Overview

The Google AI API route allows you to analyze images with custom prompts using Google's Generative AI (Gemini) model. The API accepts file uploads, processes them with AI, and returns text responses in the specified language.

## Endpoint

**POST** `/api/image-search`

## Request Format

The API expects a `multipart/form-data` request with the following fields:

- `file` (File): Image file to analyze
- `language` (string): Response language ('en' for English, 'ar' for Arabic)
- `prompt` (string): Custom prompt describing what you want to analyze

## Supported File Types

- JPEG (`image/jpeg`)
- PNG (`image/png`)
- JPG (`image/jpg`)
- WebP (`image/webp`)
- GIF (`image/gif`)

## Usage Examples

### JavaScript/TypeScript

```typescript
const analyzeImage = async (file: File, language: string, prompt: string) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);
  formData.append("prompt", prompt);

  try {
    const response = await fetch("/api/image-search", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to analyze image");
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

// Example usage
const handleImageAnalysis = async (imageFile: File) => {
  const result = await analyzeImage(
    imageFile,
    "en",
    "Describe what products are visible in this image"
  );

  console.log("AI Response:", result.response);
};
```

### React Component Example

```tsx
import React, { useState } from "react";

const ImageAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !prompt) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", language);
      formData.append("prompt", prompt);

      const response = await fetch("/api/image-search", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.response);
      } else {
        console.error("Error:", data.error);
      }
    } catch (error) {
      console.error("Failed to analyze image:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Upload Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="en">English</option>
            <option value="ar">Arabic</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what you want to analyze..."
            className="w-full p-2 border rounded"
            rows={3}
          />
        </div>

        <button
          type="submit"
          disabled={!file || !prompt || loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze Image"}
        </button>
      </form>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">AI Response:</h3>
          <p>{result}</p>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;
```

## Response Format

### Success Response

```json
{
  "success": true,
  "response": "This image shows a black t-shirt with a graphic design on the front...",
  "language": "en",
  "originalPrompt": "Describe the product in this image"
}
```

### Error Responses

#### Missing Fields (400)

```json
{
  "error": "Missing required fields",
  "details": "file, language, and prompt are required"
}
```

#### Invalid File Type (400)

```json
{
  "error": "Invalid file type",
  "details": "Only image files (JPEG, PNG, JPG, WEBP, GIF) are supported"
}
```

#### Content Safety Error (400)

```json
{
  "error": "Content Safety Error",
  "details": "The content was flagged by safety filters"
}
```

#### API Configuration Error (500)

```json
{
  "error": "API Configuration Error",
  "details": "Google AI API key is missing or invalid"
}
```

#### General Error (500)

```json
{
  "error": "Internal server error",
  "details": "An unexpected error occurred"
}
```

## Common Use Cases

### Product Analysis

```typescript
const analyzeProduct = async (imageFile: File) => {
  return await analyzeImage(
    imageFile,
    "en",
    "Identify the product type, brand, color, and any visible features"
  );
};
```

### Translation Requests

```typescript
const analyzeInArabic = async (imageFile: File) => {
  return await analyzeImage(
    imageFile,
    "ar",
    "وصف المنتج الظاهر في هذه الصورة بالتفصيل"
  );
};
```

### Text Extraction

```typescript
const extractText = async (imageFile: File) => {
  return await analyzeImage(
    imageFile,
    "en",
    "Extract and transcribe all visible text from this image"
  );
};
```

## Environment Configuration

Make sure your `.env` file contains the Google AI API key:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_google_ai_api_key_here
```

## Rate Limits

The API uses Google's Gemini 1.5 Flash model, which has the following limits:

- 15 requests per minute for free tier
- 1,500 requests per day for free tier

For production use, consider upgrading to a paid plan for higher limits.

## Error Handling Best Practices

1. **Always validate file types** before sending requests
2. **Handle network timeouts** gracefully
3. **Implement retry logic** for temporary failures
4. **Show user-friendly error messages** for different error types
5. **Respect rate limits** and implement appropriate backoff strategies
