# تقرير فحص أمني مؤتمت — Security Scan Report

| | |
|---|---|
| **الهدف (Target)** | `https://trydos.com` |
| **نوع الفحص** | Unauthenticated / Non-intrusive Reconnaissance |
| **التاريخ** | 2026-07-08 |
| **الأدوات المستخدمة** | `curl`, `openssl s_client` (لم تتوفر Nuclei/Nikto/Nmap في البيئة) |
| **البنية المكتشفة** | Vercel (Edge/CDN) + Next.js |

> **نطاق الفحص:** فحص سلبي/خفيف على مستوى الاستطلاع فقط (Headers, TLS/SSL, Exposed Files). لم يتم تنفيذ أي هجمات استغلال فعلي أو اختبار حِمل (DoS) أو fuzzing عدواني.

---

## 1. Summary of Findings

| # | الثغرة / الملاحظة | الخطورة | الحالة |
|---|---|---|---|
| F-01 | غياب `Content-Security-Policy` (CSP) | 🟠 **Medium** | مؤكدة |
| F-02 | غياب `X-Frame-Options` / حماية Clickjacking | 🟠 **Medium** | مؤكدة |
| F-03 | غياب `X-Content-Type-Options: nosniff` | 🟡 **Low** | مؤكدة |
| F-04 | غياب `Referrer-Policy` | 🟡 **Low** | مؤكدة |
| F-05 | غياب `Permissions-Policy` | 🟡 **Low** | مؤكدة |
| F-06 | كشف معلومات التقنية عبر `X-Powered-By` و `Server` | 🔵 **Info/Low** | مؤكدة |

**الإجمالي:** `Critical: 0` · `High: 0` · `Medium: 2` · `Low: 3` · `Info: 1`

### نقاط إيجابية (Positive Controls) ✅
- **HSTS مفعّل** بقيمة قوية: `max-age=63072000; includeSubDomains` (سنتان).
- **TLS مضبوط بشكل سليم:** يدعم فقط `TLS 1.2` و `TLS 1.3`؛ البروتوكولات القديمة (`TLS 1.0/1.1`) مرفوضة.
- **شهادة صالحة** من Let's Encrypt (`notBefore: May 10 2026` → `notAfter: Aug 8 2026`) وغير منتهية.
- **إعادة توجيه HTTP → HTTPS** تعمل (`308 Permanent Redirect`).
- **لا ملفات حساسة مكشوفة:** جميع المسارات الحساسة (`.env`, `.git/config`, `package.json`, `.DS_Store`, `backup.zip` ...) تُرجع `307 Redirect` للصفحة الرئيسية ولا تكشف أي محتوى.
- **لا كوكيز** يتم تعيينها على الصفحة الرئيسية (لا مخاطر أعلام كوكيز مفقودة).
- `robots.txt` يمنع الفهرسة (`Disallow: /`) و `X-Robots-Tag: noindex, nofollow`.

---

## 2. Detailed Vulnerabilities

### F-01 — Missing Content-Security-Policy (Medium)
**الوصف:** لا يوجد ترويسة `Content-Security-Policy` في الاستجابة. غياب CSP يزيد من سطح هجمات **XSS** وحقن المحتوى، ولا يوفر خط دفاع ثانٍ عند وجود ثغرة injection في التطبيق.

**PoC / الإثبات:**
```
$ curl -s -D - -o /dev/null https://trydos.com/ | grep -i content-security-policy
(لا يوجد ناتج — الترويسة غائبة)
```
الترويسات الفعلية المُرجعة لم تتضمن أي `Content-Security-Policy`.

---

### F-02 — Missing X-Frame-Options / Clickjacking (Medium)
**الوصف:** لا توجد `X-Frame-Options` ولا توجيه `frame-ancestors` ضمن CSP، ما يجعل الصفحة قابلة للتضمين داخل `<iframe>` ويفتح الباب لهجمات **Clickjacking**.

**PoC / الإثبات:**
```
$ curl -s -D - -o /dev/null https://trydos.com/ | grep -iE "x-frame-options|frame-ancestors"
(لا يوجد ناتج — لا حماية ضد التأطير)
```
يمكن تأكيدها بإنشاء صفحة HTML بسيطة تضع `<iframe src="https://trydos.com">` وملاحظة أن الموقع يُحمّل داخل الإطار.

---

### F-03 — Missing X-Content-Type-Options (Low)
**الوصف:** غياب `X-Content-Type-Options: nosniff` يسمح للمتصفح بمحاولة "تخمين" نوع المحتوى (MIME sniffing)، ما قد يؤدي لتنفيذ محتوى غير متوقع.

**PoC:**
```
$ curl -s -D - -o /dev/null https://trydos.com/ | grep -i x-content-type-options
(غائبة)
```

---

### F-04 — Missing Referrer-Policy (Low)
**الوصف:** بدون `Referrer-Policy` قد يُسرَّب مسار/معلومات URL الكامل إلى مواقع خارجية عبر ترويسة `Referer`.

**PoC:**
```
$ curl -s -D - -o /dev/null https://trydos.com/ | grep -i referrer-policy
(غائبة)
```

---

### F-05 — Missing Permissions-Policy (Low)
**الوصف:** غياب `Permissions-Policy` يعني عدم تقييد وصول الصفحة/الأطر المضمّنة لواجهات المتصفح الحساسة (camera, microphone, geolocation).

**PoC:**
```
$ curl -s -D - -o /dev/null https://trydos.com/ | grep -i permissions-policy
(غائبة)
```

---

### F-06 — Technology/Version Disclosure (Info/Low)
**الوصف:** تكشف الاستجابة عن مكوّنات البنية التحتية، ما يساعد المهاجم في تضييق مساحة الاستهداف (fingerprinting).

**PoC / الإثبات (ترويسات فعلية):**
```
Server: Vercel
X-Powered-By: Next.js
X-Nextjs-Prerender: 1
X-Vercel-Id: bom1::bom1::s7hzf-...
```

---

## 3. Remediation (خطوات الترقيع للمطورين)

بما أن الموقع **Next.js على Vercel**، يمكن ضبط جميع الترويسات مركزياً في `next.config.js` عبر دالة `headers()`:

```js
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self';"
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

module.exports = {
  poweredByHeader: false, // يعالج F-06: يزيل X-Powered-By
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

**ملاحظات تنفيذية:**
- **F-01 (CSP):** ابدأ بوضع `Content-Security-Policy-Report-Only` أولاً لرصد الكسر قبل التطبيق الصارم، خصوصاً مع `script-src` في تطبيقات Next.js (قد تحتاج `'unsafe-inline'` مؤقتاً أو nonces).
- **F-02:** `X-Frame-Options: DENY` + `frame-ancestors 'none'` في CSP للتغطية المزدوجة.
- **F-06:** `poweredByHeader: false` يزيل `X-Powered-By`. ترويسة `Server: Vercel` تُدار من المنصة ولا يمكن إزالتها بالكامل (مخاطرة منخفضة مقبولة).
- لا حاجة لإجراءات على TLS/HSTS/الملفات المكشوفة — الضوابط الحالية سليمة.

---

## 4. Methodology / Commands Log

```bash
# 1) Headers
curl -s -D - -o /dev/null https://trydos.com/

# 2) TLS protocol & certificate
echo | openssl s_client -connect trydos.com:443 -servername trydos.com | openssl x509 -noout -subject -issuer -dates
# اختبار البروتوكولات: -tls1 -tls1_1 -tls1_2 -tls1_3

# 3) Exposed files probe
for p in .env .git/config package.json .DS_Store backup.zip robots.txt sitemap.xml; do
  curl -s -o /dev/null -w "%{http_code}  /$p\n" https://trydos.com/$p
done

# 4) HTTP->HTTPS + cookies
curl -s -D - -o /dev/null http://trydos.com/
```

---

## ⚠️ إخلاء مسؤولية (Disclaimer)
هذا التقرير ناتج عن فحص **سلبي وغير تدخّلي** فقط. لم تُجرَ أي محاولات استغلال أو اختبار حِمل. يُوصى بإجراء اختبار اختراق مُصادَق (authenticated) وأعمق باستخدام أدوات متخصصة (Nuclei, Burp Suite, OWASP ZAP) **بعد التأكد من وجود تفويض كتابي (authorization) صريح للنطاق المستهدف**.
