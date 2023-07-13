/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "black":  "#1f262b",
        "white": "#fbfbf9",
        "off-white": "#f9fafb",
        "bluebonnet": "#074d6a",
        "copper": "#9d4700",
        "limestone": "#aba89e",
        "cactus": "#487d39"
      },
    },
  },
  plugins: [require('@tailwindcss/typography'),],
}
