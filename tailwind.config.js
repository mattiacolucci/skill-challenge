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
      },
      colors:{
        'mainGreen':"#16a34a",
        'mainRed':"#dc2626",
        'mainBlue':"#1d4ed8",
        'greenOverBg':"#22c55e",
        'blueOverBg':"#93c5fd",
        'yellow-gold':"#FEE101",
        'darkBlue':"#1c158f"
      }
    },
  },
  plugins: [],
}