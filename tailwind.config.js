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
      },
      keyframes:{
        'record':{
          '0%':{translate:"-150px 0",opacity:"0"},
          '100%':{translate:"0 0",opacity:"1"}
        },
        'fadeUp':{
          '0%':{translate:"0 150px",opacity:"0"},
          '100%':{translate:"0 0",opacity:"1"}
        },
        'rotation':{
          '0%':{rotate: "0deg"},
          '100%':{rotate: "359deg"}
      }
      },
      animation: {
        record: 'record 1s 1s ease-in-out forwards',
        fadeUp: 'fadeUp 0.8s ease-in-out forwards',
        rotation: 'rotation 2s infinite linear'
      }
    },
  },
  plugins: [],
}