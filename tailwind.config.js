/** @type {import('tailwindcss').Config} */
module.exports = {
  important: true,
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./helpers/**/*.{js,ts,jsx,tsx,mdx}",
    "./core/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    maxWidth: {
      "1/2": "50%",
      xss: "7rem",
      xs: "10rem",
    },
    borderRadius: {
      none: "0",
      sm: "0.125rem",
      DEFAULT: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      full: "9999px",
      large: "12px",
    },
    fontFamily: {
      bold: ["var(--SF-Pro-Rounded-Medium)"],
      sans: ["ui-sans-serif", "system-ui"],
      roboto: ["roboto"],
      sf_pro_rounded_medium: ["var(--SF-Pro-Rounded-Medium)"],
      sf_pro_rounded_regular: ["var(--SF-Pro-Rounded-Regular)"],
      sf_pro_rounded_semibold: ["var(--SF-Pro-Rounded-semibold)"],
      sf_pro_rounded_light: ["var(--SF-Pro-Rounded-Light)"],
      sf_pro_display: ["var(--SF-Pro-Rounded-Display)"],
      inherit: ["inherit"],
      serif: ["ui-serif", "Georgia"],
      mono: ["ui-monospace", "SFMono-Regular"],
      display: ["Oswald"],
      body: ['"Open Sans"'],
      system: ["system-ui"],
      math: ["math"],
    },
    fontSize: {
      xxs: "0.6rem",
      sm: "0.8rem",
      base: "1rem",
      xl: "1.25rem",
      "2xl": "1.563rem",
      "3xl": "1.953rem",
      "4xl": "2.441rem",
      "5xl": "3.052rem",
    },
    extend: {
      dropShadow: {
        // sm: "0 1px 1px rgb(0,0,0,0.05)",
        // md: "0 1px 1px rgb(0,4px,3px,0.07)",
        // lg: "0 1px 1px rgb(0,10px,8px,0.04)",
        // xl: "0 1px 1px rgb(0,20px,13px,0.03)",
        "0x3x6": "0px 3px 6px #2c2a2a0d",
        "3xl": "0 35px 35px rgba(0, 0, 0, 0.25)",
        "4xl": [
          "0 35px 35px hsla(0, 0.00%, 0.00%, 0.25)",
          "0 45px 65px rgba(0, 0, 0, 0.15)",
        ],
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "translateY(-5%)" },
          "50%": { transform: "translateY(5%)" },
        },
        blink: {
          "0%": { borderColor: "transparent" },
          "100%": { borderColor: "#f0446c" },
        },
      },
      animation: {
        wiggle: "wiggle 1s ease-in-out infinite",
        blink: "blink 1s infinite cubic-bezier(0.4, 0, 1, 1)",
      },
      aspectRatio: {
        "4/3": "4 / 3",
        "10/6": "10 / 6",
        "25/9": "25 / 9",
        "25/11": "25 / 11",
        "12/5": "12 / 5",
        input: "17 / 2",
      },
      inset: {
        "100%": "100%",
      },
      backgroundImage: {
        "border-NS": "url('/images/borderNS.svg')",
        "hero-pattern": "url('/img/hero-pattern.svg')",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      transitionProperty: {
        h_w: "height, width, top, left, right",
        height: "height",
        width: "width",
      },
    },
  },
  plugins: [],
};
