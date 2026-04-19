import { GetColorAndSizes } from "serverRequests/analyticsUtility";
import { LogServerError } from "utils/serverErrorReporter";
// import { HttpsProxyAgent } from "https-proxy-agent";
// import fetch from "node-fetch";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GL_API_KEY}`;

export default async function AnalyzeSearchText(query): Promise<any> {
  let modifiedQuery = decodeURIComponent(query);
  let start = process.hrtime.bigint();
  let data = await GetColorAndSizes();

  const prompt = `
Act as an expert semantic parser for an e-commerce store. 
Analyze the user's query and extract specific attributes into a valid JSON object.

### DATA:
- ALLOWED_COLORS (HEX): ${JSON.stringify(data?.colors)}
- ALLOWED_SIZES: ${JSON.stringify(data?.sizes)}

### EXTRACTION RULES:
1. **name**: Product name only. Exclude colors, sizes, and materials mentioned in the query. Default: "Unknown", products can be anything(fruits,clouthes,technolgy,vegetables...) even if the product name may seem like a color like  باذنجان ابيض it seems like Maroon here we should be carful to pick the color ابيض and the باذنجان be the product name .
2. **color**: Array of HEX codes.
   - Match the user's color description (in any language) to the most logical name in ALLOWED_COLORS.
   - **TIE-BREAKER**: If multiple entries exist for the same color name (e.g., "Black"), prioritize the standard HEX (like #000000) over custom or "test" codes.
   - If the user says "dark" or "light" versions, pick the closest visual match from the list.
3. **size**: Array of strings from ALLOWED_SIZES.
   - Map terms like "كبير جدا" or "extra large" to "XL" or "XXL" based strictly on what is available in ALLOWED_SIZES.
   - Map "small" to "S", "medium" to "M", etc.
   
### CONSTRAINTS:
- Return ONLY a valid JSON object.
- NO markdown formatting.
- NO prose or explanation.

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
    LogServerError({
      scenario: "AnalyzeSearchText in services/analyzeSearchText",
      error: error instanceof Error ? error.message : String(error),
    });
    return { error: `${error?.message}`, details: error.message };
  }
}
