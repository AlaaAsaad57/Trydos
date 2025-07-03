/**
 * Bot Detection Utility
 * Detects various types of bots, crawlers, and automated tools
 */

// Common bot user agent patterns
const BOT_PATTERNS = [
  // Search engine crawlers
  /googlebot/i,
  /bingbot/i,
  /slurp/i, // Yahoo
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /semrushbot/i,
  /ahrefsbot/i,
  /mj12bot/i,
  /dotbot/i,

  // Social media crawlers
  /facebookexternalhit/i,
  /facebookcatalog/i,
  /twitterbot/i,
  /linkedinbot/i,
  /whatsapp/i,
  /telegram/i,
  /discordbot/i,
  /slackbot/i,
  /pinterestbot/i,
  /tumblr/i,
  /redditbot/i,

  // Development/Testing tools
  /lighthouse/i,
  /chrome-lighthouse/i,
  /pagespeed/i,
  /gtmetrix/i,
  /pingdom/i,
  /uptimerobot/i,

  // Headless browsers
  /headlesschrome/i,
  /phantomjs/i,
  /slimerjs/i,
  /puppeteer/i,
  /playwright/i,

  // Command line tools
  /curl/i,
  /wget/i,
  /python-requests/i,
  /python-urllib/i,
  /go-http-client/i,
  /java/i,
  /perl/i,
  /ruby/i,
  /php/i,

  // Other bots
  /bot|crawler|spider|scraper|crawling/i,
];

// Known browser patterns (allowed)
const BROWSER_PATTERNS = [
  /chrome\/[\d.]+/i,
  /firefox\/[\d.]+/i,
  /safari\/[\d.]+/i,
  /edg\/[\d.]+/i, // Edge
  /opr\/[\d.]+/i, // Opera
];

// Additional checks for headless detection
const HEADLESS_INDICATORS = [
  "HeadlessChrome",
  "PhantomJS",
  "Nightmare",
  "Selenium",
  "WebDriver",
];

export interface BotCheckResult {
  isBot: boolean;
  botType?: "crawler" | "social" | "headless" | "tool" | "unknown";
  confidence: "high" | "medium" | "low";
  details?: string;
}

/**
 * Check if a user agent string belongs to a bot
 */
export function isBot(userAgent: string | null): BotCheckResult {
  if (!userAgent) {
    return {
      isBot: true,
      botType: "unknown",
      confidence: "high",
      details: "No user agent provided",
    };
  }

  // Check for empty or suspicious user agents
  if (userAgent.length < 10) {
    return {
      isBot: true,
      botType: "unknown",
      confidence: "high",
      details: "User agent too short",
    };
  }

  // Check against bot patterns
  for (const pattern of BOT_PATTERNS) {
    if (pattern.test(userAgent)) {
      // Determine bot type
      let botType: BotCheckResult["botType"] = "unknown";

      if (
        /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot/i.test(
          userAgent
        )
      ) {
        botType = "crawler";
      } else if (
        /facebook|twitter|linkedin|whatsapp|telegram|discord|slack|pinterest/i.test(
          userAgent
        )
      ) {
        botType = "social";
      } else if (/headless|phantom|puppeteer|playwright/i.test(userAgent)) {
        botType = "headless";
      } else if (/curl|wget|python|java|perl|ruby|php/i.test(userAgent)) {
        botType = "tool";
      }

      return {
        isBot: true,
        botType,
        confidence: "high",
        details: `Matched pattern: ${pattern}`,
      };
    }
  }

  // Check for headless indicators
  for (const indicator of HEADLESS_INDICATORS) {
    if (userAgent.includes(indicator)) {
      return {
        isBot: true,
        botType: "headless",
        confidence: "high",
        details: `Contains headless indicator: ${indicator}`,
      };
    }
  }

  // Check if it matches known browser patterns
  let matchesBrowser = false;
  for (const pattern of BROWSER_PATTERNS) {
    if (pattern.test(userAgent)) {
      matchesBrowser = true;
      break;
    }
  }

  // If it doesn't match any browser pattern, it might be a bot
  if (!matchesBrowser) {
    // But let's be less confident about this
    return {
      isBot: true,
      botType: "unknown",
      confidence: "medium",
      details: "Does not match known browser patterns",
    };
  }

  // Additional heuristics
  // Check for missing browser features in UA
  if (!userAgent.includes("Mozilla/") && !userAgent.includes("Opera/")) {
    return {
      isBot: true,
      botType: "unknown",
      confidence: "medium",
      details: "Missing standard browser UA components",
    };
  }

  // Passed all checks - likely a real browser
  return {
    isBot: false,
    confidence: "high",
  };
}

/**
 * Enhanced bot detection with additional request headers
 */
export function isBotEnhanced(headers: Headers): BotCheckResult {
  const userAgent = headers.get("user-agent");

  // First do basic UA check
  const basicCheck = isBot(userAgent);
  if (basicCheck.isBot && basicCheck.confidence === "high") {
    return basicCheck;
  }

  // Additional header-based checks
  const suspiciousHeaders = [
    "x-forwarded-for", // Often used by proxies/bots
    "x-real-ip",
    "x-originating-ip",
    "x-remote-ip",
    "x-remote-addr",
  ];

  // Check for prefetch/prerender hints
  if (
    headers.get("x-purpose") === "prefetch" ||
    headers.get("x-moz") === "prefetch"
  ) {
    return {
      isBot: true,
      botType: "crawler",
      confidence: "high",
      details: "Prefetch request detected",
    };
  }

  // Check for missing standard headers that real browsers send
  const requiredHeaders = ["accept", "accept-language", "accept-encoding"];
  const missingHeaders = requiredHeaders.filter((h) => !headers.get(h));

  if (missingHeaders.length >= 2) {
    return {
      isBot: true,
      botType: "tool",
      confidence: "medium",
      details: `Missing headers: ${missingHeaders.join(", ")}`,
    };
  }

  // If basic check said not a bot, trust it
  return basicCheck;
}

/**
 * Middleware-friendly bot check
 */
export function shouldBlockRegistration(request: Request): boolean {
  const result = isBotEnhanced(request.headers);

  // Block high confidence bots
  if (result.isBot && result.confidence === "high") {
    return true;
  }

  // Allow medium confidence to pass (might be legitimate edge cases)
  return false;
}
