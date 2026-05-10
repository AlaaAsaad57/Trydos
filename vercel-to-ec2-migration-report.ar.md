<div dir="rtl">
# تقرير الهجرة من Vercel إلى EC2 (TryDos)

تاريخ التقرير: 2026-05-10

## ملخص تنفيذي
هذا التقرير مبني على فحص فعلي للكودبيس الحالي لمشروع TryDos (Next.js 16 App Router) لتقييم خيار الهجرة من Vercel إلى EC2، مع توضيح:
- المزايا والعيوب
- الفروقات التشغيلية والتقنية بين الخيارين
- المخاطر والمشاكل المتوقعة

الخلاصة السريعة:
- الاعتماد على Vercel موجود لكنه محدود نسبيًا، وأهمه في `middleware/proxy` والـ observability.
- الهجرة إلى EC2 ممكنة بدون إعادة كتابة كبيرة، لكن تعني تحمل عبء تشغيل أعلى مقارنة بمنصة مُدارة.

---

## نتائج فحص الكودبيس (Evidence)

### 1) اعتمادات مباشرة على Vercel
- استخدام `@vercel/functions` لاستخراج IP في:
  - `proxy.ts:2`
- استخدام هيدر جغرافي خاص بـVercel:
  - `proxy.ts:168` (`x-vercel-ip-country`)
- افتراض صريح لبيئة Vercel في fallback:
  - `proxy.ts:230`
- استخدام `Vercel Speed Insights` في الـ layout:
  - `app/(client)/[lang]/layout.tsx:6`
  - `app/(client)/[lang]/layout.tsx:122`
- الحزم موجودة في dependencies:
  - `package.json:25` (`@vercel/functions`)
  - `package.json:26` (`@vercel/speed-insights`)
- خيار Sentry المرتبط بـVercel Cron Monitors:
  - `next.config.ts:166` (`automaticVercelMonitors: true`)

### 2) نقاط تشغيل مهمة ستتأثر في EC2
- rate limit في API يعتمد على `x-forwarded-for`:
  - `serverRequests/apiMiddlware.ts:12`
- Headers وكاش تعتمد على `s-maxage` / `stale-while-revalidate`:
  - `next.config.ts:33`
  - `next.config.ts:56`
  - `next.config.ts:70`
- Redis مستخدم فعليًا في caching/rate-limiting/security tracking:
  - `serverRequests/radis/index.ts`

### 3) ملاحظات إضافية
- ملف `vercel.json` فارغ عمليًا، وهذا يقلل lock-in من جهة config.
- لا يوجد scaffolding جاهز واضح لـ Docker/CI داخل الريبو حاليًا.

---

## المزايا (Pros) عند الانتقال إلى EC2
- تحكم كامل في البنية: نظام التشغيل، الشبكة، reverse proxy، tuning.
- كلفة أفضل غالبًا في حالة الأحمال الثابتة أو المتوقعة.
- مرونة أعلى في تصميم الشبكة (VPC, SG, private networking, peering).
- مرونة أعلى في سياسات الأمن والمراقبة حسب معايير المؤسسة.
- سهولة دمج خدمات AWS المساندة (CloudFront, WAF, ALB, IAM, CloudWatch).

## العيوب (Cons)
- فقدان مزايا managed جاهزة من Vercel (سهولة النشر، تجربة DX، بعض تحسينات المنصة).
- عبء تشغيل وصيانة أعلى (patching, SSL, process management, autoscaling, backup).
- زمن أطول للإعداد الأولي والتشغيل المستقر مقارنةً بـVercel.
- الحاجة لتجهيز مراقبة وتنبيهات بنفسك لتصل لنفس مستوى الرؤية.

---

## مقارنة مباشرة: Vercel vs EC2

| البند | Vercel | EC2 |
|---|---|---|
| تجربة النشر | بسيطة وسريعة جدًا | تحتاج إعداد يدوي أو CI/CD مخصص |
| التشغيل اليومي | Managed (أقل عبء) | Self-managed (عبء أعلى) |
| الأداء العالمي | ممتاز افتراضيًا عبر شبكة المنصة | يعتمد على إعداد CDN والشبكة |
| القابلية للتخصيص | محدودة نسبيًا | عالية جدًا |
| الكلفة | قد ترتفع مع النمو/الزيارات | غالبًا أوفر في الأحمال المستقرة |
| المراقبة | أدوات جاهزة ومتكاملة | تحتاج تركيب وتكامل أدوات متعددة |
| الأمان التشغيلي | إعدادات قوية افتراضيًا | يعتمد على جودة hardening والسياسات |
| زمن الوصول للإطلاق | أسرع | أبطأ في البداية |
| مرونة البنية | أقل | أعلى |
| مسؤولية الفريق | أقل | أعلى |

---

## تأثير فرضية الشبكة الداخلية (داخل نفس الـNetwork)

بناءً على الفرضية المذكورة (أن التطبيق وخدماته تعمل داخل نفس شبكة الحاويات/البيئة الداخلية، مع Elastic وRedis ضمن نفس نطاق الاتصال الداخلي):

### التأثير على الأداء
- تقليل واضح في latency بين الخدمات (service-to-service)، لأن أغلب الطلبات تبقى داخل private network بدل الخروج والعودة عبر الإنترنت.
- تقليل overhead المرتبط بـ TLS termination المتكرر بين خدمات داخلية إذا تم ضبط الاتصال الداخلي بشكل صحيح.
- ثبات أعلى في زمن الاستجابة الداخلي (jitter أقل) مقارنة باتصالات عامة متغيرة.
- نقطة مهمة: هذا يحسن أداء الـ backend الداخلي، لكنه لا يحسن تلقائيًا أداء المستخدم النهائي عالميًا بدون CDN/edge caching.

### التأثير على الأمان
- تقليل سطح الهجوم لأن الخدمات الداخلية (مثل API الداخلية، Redis، Elastic) يمكن حصرها داخل private subnets بدون public exposure.
- تطبيق سياسات أكثر صرامة عبر Security Groups/NACLs أو Network Policies (السماح فقط بالـ ports والمسارات المطلوبة).
- تحسين العزل بين الخدمات، وتقليل مخاطر lateral movement عند وجود تقسيم شبكي جيد (segmentation).
- مخاطر يجب الانتباه لها: إذا كانت الشبكة الداخلية مسطحة جدًا (flat network) أو بدون mTLS/ACL واضحة، قد يزيد أثر أي اختراق داخلي.

### ملاحظات خاصة بـ Redis وElastic
- الأفضل ألا يكون Redis/Elastic مكشوفين على الإنترنت نهائيًا، والاكتفاء بالوصول الداخلي عبر private endpoints.
- تفعيل authentication/authorization وTLS (حتى داخليًا في البيئات الحساسة) يقلل أثر أي تسرب وصول داخل الشبكة.
- ضبط timeouts وpooling وcircuit breakers مهم لتفادي cascading failures عند ضغط Redis/Elastic.

---

## CDN: ماذا يقدم Vercel؟ وكيف نحقق ذلك مع AWS؟

### ماذا يقدم Vercel افتراضيًا
- شبكة Edge عالمية جاهزة دون إعداد كبير.
- caching تلقائي ومتكامل مع سلوك Next.js (خصوصًا static/ISR حسب إعدادات التطبيق).
- تجربة تشغيل سهلة وسريعة في التوزيع العالمي للمحتوى.

### كيف نضيف CDN على AWS بشكل صحيح
- استخدام `CloudFront` أمام `ALB` أو أمام origin (EC2/Nginx) للتسريع العالمي.
- استخدام `S3 + CloudFront` للملفات الثابتة (assets) متى كان ذلك مناسبًا.
- تفعيل `AWS WAF` على CloudFront لطبقة حماية إضافية (rate limiting + managed rules).
- ضبط cache policies حسب نوع المحتوى:
  - HTML الديناميكي: cache قصير أو bypass حسب الحاجة.
  - Static assets (`_next/static`, الصور, الخطوط): cache طويل + immutable.
- تفعيل compression (Brotli/Gzip) وHTTP/2 أو HTTP/3 عبر CloudFront.

---

## هل يمكن تحسين الأداء العالمي أكثر مع AWS؟

نعم، وبشكل ملموس إذا تم التصميم صح. التحسن لا يأتي من EC2 وحده، بل من هندسة التوزيع:

- `CloudFront` + سياسات cache دقيقة تعطي انخفاضًا كبيرًا في TTFB للمستخدمين البعيدين عن الـ origin.
- `Route 53` مع latency-based routing (عند وجود أكثر من region) لتوجيه المستخدم لأقرب منطقة.
- `Global Accelerator` مفيد عندما تكون الطلبات dynamic بكثرة ولا تستفيد كفاية من cache التقليدي.
- تقليل رحلات البيانات بين المناطق (cross-region hops) ووضع Redis/Elastic قريبين من الـ app يقلل التأخير.
- الاعتماد على صور/ملفات optimized مسبقًا، مع headers صحيحة (`Cache-Control`, `ETag`) لرفع hit ratio.

الخلاصة العملية:
- إن بقيتم على region واحدة بدون CloudFront مضبوط، الفرق العالمي غالبًا سيكون محدود.
- إن طبقتم CloudFront + WAF + ضبط cache + (اختياريًا) multi-region عند الحاجة، يمكن الوصول لأداء عالمي منافس جدًا.

---

## المشاكل/المخاطر المتوقعة (Possible Issues)

### مخاطر عالية
- **تعطل منطق locale/geo** إذا لم يتوفر بديل لـ`x-vercel-ip-country`:
  - التأثير: redirect loops أو locale خاطئ.
- **rate-limiting غير دقيق** إذا IP extraction غير مضبوط خلف Nginx/ALB:
  - التأثير: حظر مستخدمين شرعيين أو فشل الحماية.

### مخاطر متوسطة
- **تراجع الأداء العالمي** بدون CDN أو caching مضبوط.
- **فقدان observability** بعد إزالة Speed Insights بدون بديل.
- **مشاكل env vars** نتيجة كثرة المتغيرات الحساسة والعامة.

### مخاطر تشغيلية
- تحديثات أمان النظام وتأمين الخادم تصبح مسؤوليتك.
- السعة (CPU/RAM) تحتاج مراقبة وتوسعة استباقية.

---

## ملاحظات مهمة للمشروع الحالي
- من منظور الكود، الاعتماد على Vercel موجود لكنه مركز في نقاط محددة، وليس منتشرًا في كل النظام.
- أعلى تأثير تقني في المقارنة يأتي من: `proxy.ts` (IP + Geo) و `SpeedInsights` و Sentry Vercel monitors.
- القرار بين الخيارين في هذا المشروع هو قرار **تشغيلي/تشغيلي-مالي** أكثر من كونه قرار إعادة بناء تطبيق.
</div>