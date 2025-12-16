import { GetColorAndSizes } from "serverRequests/analyticsUtility";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GL_API_KEY}`;

export default async function AnalyzeSearchText(query): Promise<any> {
  let start = process.hrtime.bigint();
  let data = await GetColorAndSizes();
  const prompt = `
استلم الاستفسار التالي بأي لغة كانت، وحلل معناه بدقة، ثم استخرج الحقول التالية فقط وفق القواعد الصارمة أدناه:

- name: اسم المنتج كاملًا بدون اللون وبدون القياس (لا تحذف أي كلمات أخرى من الاسم).
- color: مصفوفة JSON من الألوان بصيغة HEX فقط مثل "#FF0000".
  ارجع فقط القيم الموجودة ضمن: ( ${data?.colors} )
  إذا لم يوجد أي لون مطابق، أرجع مصفوفة فارغة [].
- size: مصفوفة JSON من القياسات بصيغة موحدة فقط من: ( ${data?.sizes} ).
  إذا كان القياس موجودًا بصيغة مختلفة (كلمات أو أرقام أو وصف)، حاول مطابقته مع القيم المسموح بها.
  إذا لم يوجد أي قياس مطابق، أرجع مصفوفة فارغة [].
- type: نوع المادة أو الصنف (مثل قطن، حرير، جلد، بوليستر).

قواعد إلزامية:
- لا تُرجع أي حقول إضافية.
- لا تستخدم Markdown أو أي تنسيق.
- يجب أن يكون الحقلان color و size دائمًا مصفوفات JSON حتى لو كانت فارغة.
- إذا تعذر استخراج name أو type أرجع "Unknown".

النص:
"${query}"

أرجع النتيجة بصيغة JSON صحيحة فقط.
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

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }
    let data = await response.json();

    console.warn(
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
      error: `API call to Gemini failed : ${
        error?.message ?? JSON.stringify(error, null, 2)
      }`,
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
