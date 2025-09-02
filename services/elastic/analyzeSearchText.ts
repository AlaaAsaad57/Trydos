import { GetColorAndSizes } from "Server Requests/analyticsUtility";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GL_API_KEY}`;

export default async function AnalyzeSearchText(query): Promise<any> {
  let start = process.hrtime.bigint();
  let data = await GetColorAndSizes();
  const prompt = `Receive the following query in any language, analyze its meaning, and extract only the following fields:
- name: the full product name (keep the full product name without removing anything, only exclude color and size if present in the query).
- color: extract the color strictly from the provided list of colors: [${data?.colors}]. The result must be in HEX format such as "#FF0000". If more than one color appears in the text, return them as a JSON array like ["#FF0000", "#0000FF"]. If no matching color is found, return "Unknown".
- size: extract the size strictly from the provided list of sizes: [${data?.sizes}]. If more than one size appears in the text, return them as a JSON array. If no matching size is found, return "Unknown".
- type: the material (such as cotton, silk, etc.). If it cannot be identified, return "Unknown".

Notes:
- Matching does not have to be literal: use reasoning to find the closest match. For example, if the query contains "15 years" or "15_years" and the sizes list includes "14-15-years",  Similarly, handle variations in spelling, numbers, or formatting.
- Do not remove anything from the product name; only exclude the color and size from the text.
- Do not use any colors or sizes other than those provided in the input lists.
- If a size exists in a different form (word, number, or description), convert it to one of the standard values: XS, S, M, L, XL, XXL.
- The final result must be returned strictly in JSON format only, without any Markdown or formatting.

Query: "${query}"
`;
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });

    let data = await response.json();

    const outputText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const cleanedText = outputText.replace(/^```json|```$/gm, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      return {
        error: "Failed to parse JSON from Gemini response",
        raw_output: outputText,
        exception: e.toString(),
      };
    }

    const filtered: Record<string, any> = {};
    for (const key in parsed) {
      if (parsed[key] !== "Unknown") {
        filtered[key] = parsed[key];
      }
    }

    // ✅ You can now send filtered to another service here if needed
    let end = process.hrtime.bigint();

    return { ...filtered, Geminitime: Number(end - start) / 1_000_000 };
  } catch (error: any) {
    return {
      error: "API call to Gemini failed",
      details: error?.response?.data || error.message,
    };
  }
}

//example usage
// const result = await fetch('http://localhost:3000/api/analyze', {
//method: 'POST',
//    headers: { 'Content-Type': 'application/json' },
//body: JSON.stringify({ query: "قميص قطني أسود مقاس وسط" }),
//})

//const data = await result.json()

// You can now use data (parsed Gemini result) with another service
//console.log('Parsed:', data)
