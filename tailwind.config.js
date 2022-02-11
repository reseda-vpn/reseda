module.exports = {
    content: [
      "./renderer/pages/**/*.{js,ts,jsx,tsx}",
      "./renderer/components/*.{js,ts,jsx,tsx}",
      "./renderer/components/un-ui/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        fontFamily: {
            sans: ["Public Sans", "DM Sans", "Roboto", "sans-serif"],
            serif: ["DM Serif", "serif"],
            altSans: ["GT Walsheim Pro"]
        },
        extend: {},
    },
    plugins: [],
  }