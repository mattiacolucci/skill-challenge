/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage:{
        "bg-color":"linear-gradient(315deg, #1fd1f9 0%, #b621fe 74%)"
      },
      fontFamily:{
        default:"Fugaz One, cursive",
        navbar:"Lato, sans-serif"
      }
    },
  },
  plugins: [],
}