import { GetColorAndSizes } from "serverRequests/analyticsUtility";
// import { HttpsProxyAgent } from "https-proxy-agent";
// import fetch from "node-fetch";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GL_API_KEY}`;

export default async function AnalyzeSearchText(query): Promise<any> {
  let modifiedQuery = decodeURIComponent(query);
  let start = process.hrtime.bigint();
  let data = await GetColorAndSizes();

  const prompt = `
Act as an expert semantic parser for an e-commerce store. 
Analyze the user's query regardless of language and extract specific attributes.

### AVAILABLE DATA:
- ALLOWED_COLORS (HEX): ${JSON.stringify(data?.colors)}
- ALLOWED_SIZES: ${JSON.stringify(data?.sizes)}

### EXTRACTION RULES:
1. **name**: Product name only. Remove colors, sizes, and materials. Default: "Unknown".
2. **color**: Array of HEX codes. 
   - Perform "Fuzzy Matching": If the user says "زرقاء", "navy", or "light blue", map it to the closest HEX code in ALLOWED_COLORS.
   - If no semantic match exists, return [].
3. **size**: Array of strings from ALLOWED_SIZES.
   - Perform "Smart Mapping": Map "كبير جدا" to "XXL", "small" to "S", "مقاس محير" to the appropriate standard, etc., based on ALLOWED_SIZES.
4. **type**: Material or category (e.g., "قطن", "Silk", "Leather"). Default: "Unknown".

### CONSTRAINTS:
- Return ONLY a valid JSON object.
- Do not include markdown formatting (no \`\`\`json).
- If a value is not found, use "Unknown" for strings and [] for arrays.

### INPUT QUERY:
"${modifiedQuery}"
`;
  // const proxyUrl = "http://kedaprax:qi1yxs8k11ol@142.111.48.253:7030";
  // const agent = new HttpsProxyAgent(proxyUrl);
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      // @ts-ignore
      // agent: agent,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json", // This ensures JSON output
        },
      }),
    });

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);

    const result: any = await response.json();
    const outputText =
      result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "{}";

    // Since we forced responseMimeType, we can usually parse directly
    const parsed = JSON.parse(outputText);

    // Filter out "Unknown" values
    const filtered = Object.fromEntries(
      Object.entries(parsed).filter(([_, v]) => v !== "Unknown"),
    );

    let end = process.hrtime.bigint();
    return { ...filtered, Geminitime: Number(end - start) / 1_000_000 };
  } catch (error) {
    console.error(
      `$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$-${error}-$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$`,
    );
    return { error: `${error?.message}`, details: error.message };
  }
}
