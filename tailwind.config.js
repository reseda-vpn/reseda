module.exports = {
    content: [
      "./src/pages/**/*.{js,ts,jsx,tsx}",
      "./src/components/*.{js,ts,jsx,tsx}",
      "./src/components/un-ui/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        fontFamily: {
            sans: ["Public Sans", "DM Sans", "Roboto", "sans-serif"],
            serif: ["DM Serif", "serif"],
            altSans: ["GT Walsheim Pro"],
            mono: ["DM Mono"]
        },
        extend: {},
    },
    plugins: [],
  }