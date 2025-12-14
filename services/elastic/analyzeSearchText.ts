import { GetColorAndSizes } from "serverRequests/analyticsUtility";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GL_API_KEY}`;

export default async function AnalyzeSearchText(query): Promise<any> {
  let start = process.hrtime.bigint();
  let data = await GetColorAndSizes();
  const prompt = `
استلم الاستفسار التالي بأي لغة كانت، وحاول تحليل معناه واستخرج منه الحقول التالية فقط:
- name: اسم المنتج (اسم المنتج كاملا بدون اللون والقياس ان وجد في كلمة البحث)
- color: اللون ولكن بصيغة HEX فقط مثل "#FF0000". إذا كان هناك أكثر من لون، أرجعهم كمصفوفة JSON مثل: ["#FF0000", "#0000FF"] ارجع فقط القيم الموجودة في ( ${data?.colors} )
- size: القياس بصيغة موحدة من: ( ${data?.sizes} ) فقط
- type: نوع المادة أو الصنف (مثل قطن، حرير...)
لا تحذف شيء من اسم المنتج فقط أذل اللون والقياس من النص 
إذا تعذر استخراج أحد الحقول، أرجع "Unknown".
إذا كان القياس موجودًا ولكن بصيغة مختلفة (كلمات أو أرقام أو وصف)

النص: "${query}"

أرجع النتيجة بصيغة JSON فقط بدون تنسيق Markdown (بدون \`\`\`)
`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
      headers: { "Content-Type": "application/json" },
      credentials: "omit",
    });

    let data = await response.json();
    console.log(
      "Received response from Gemini API:",
      JSON.stringify(data, null, 2)
    );
    const outputText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    const cleanedText = outputText.replace(/^```json|```$/gm, "").trim();

    let parsed = cleanedText;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (e) {
      return {
        error: `Failed to parse JSON from Gemini response ${parsed}`,
        message: `Failed to parse JSON from Gemini response ${parsed}`,
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
