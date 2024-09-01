const countries = [
	"Afghanistan",
	"Albania",
	"Algeria",
	"American Samoa",
	"Andorra",
	"Angola",
	"Anguilla",
	"Antarctica",
	"Antigua and Barbuda",
	"Argentina",
	"Armenia",
	"Aruba",
	"Australia",
	"Austria",
	"Azerbaijan",
	"Bahamas (the)",
	"Bahrain",
	"Bangladesh",
	"Barbados",
	"Belarus",
	"Belgium",
	"Belize",
	"Benin",
	"Bermuda",
	"Bhutan",
	"Bolivia (Plurinational State of)",
	"Bonaire, Sint Eustatius and Saba",
	"Bosnia and Herzegovina",
	"Botswana",
	"Bouvet Island",
	"Brazil",
	"British Indian Ocean Territory (the)",
	"Brunei Darussalam",
	"Bulgaria",
	"Burkina Faso",
	"Burundi",
	"Cabo Verde",
	"Cambodia",
	"Cameroon",
	"Canada",
	"Cayman Islands (the)",
	"Central African Republic (the)",
	"Chad",
	"Chile",
	"China",
	"Christmas Island",
	"Cocos (Keeling) Islands (the)",
	"Colombia",
	"Comoros (the)",
	"Congo (the Democratic Republic of the)",
	"Congo (the)",
	"Cook Islands (the)",
	"Costa Rica",
	"Croatia",
	"Cuba",
	"Curaçao",
	"Cyprus",
	"Czechia",
	"Côte d'Ivoire",
	"Denmark",
	"Djibouti",
	"Dominica",
	"Dominican Republic (the)",
	"Ecuador",
	"Egypt",
	"El Salvador",
	"Equatorial Guinea",
	"Eritrea",
	"Estonia",
	"Eswatini",
	"Ethiopia",
	"Falkland Islands (the) [Malvinas]",
	"Faroe Islands (the)",
	"Fiji",
	"Finland",
	"France",
	"French Guiana",
	"French Polynesia",
	"French Southern Territories (the)",
	"Gabon",
	"Gambia (the)",
	"Georgia",
	"Germany",
	"Ghana",
	"Gibraltar",
	"Greece",
	"Greenland",
	"Grenada",
	"Guadeloupe",
	"Guam",
	"Guatemala",
	"Guernsey",
	"Guinea",
	"Guinea-Bissau",
	"Guyana",
	"Haiti",
	"Heard Island and McDonald Islands",
	"Holy See (the)",
	"Honduras",
	"Hong Kong",
	"Hungary",
	"Iceland",
	"India",
	"Indonesia",
	"Iran (Islamic Republic of)",
	"Iraq",
	"Ireland",
	"Isle of Man",
	"Israel",
	"Italy",
	"Jamaica",
	"Japan",
	"Jersey",
	"Jordan",
	"Kazakhstan",
	"Kenya",
	"Kiribati",
	"Korea (the Democratic People's Republic of)",
	"Korea (the Republic of)",
	"Kuwait",
	"Kyrgyzstan",
	"Lao People's Democratic Republic (the)",
	"Latvia",
	"Lebanon",
	"Lesotho",
	"Liberia",
	"Libya",
	"Liechtenstein",
	"Lithuania",
	"Luxembourg",
	"Macao",
	"Madagascar",
	"Malawi",
	"Malaysia",
	"Maldives",
	"Mali",
	"Malta",
	"Marshall Islands (the)",
	"Martinique",
	"Mauritania",
	"Mauritius",
	"Mayotte",
	"Mexico",
	"Micronesia (Federated States of)",
	"Moldova (the Republic of)",
	"Monaco",
	"Mongolia",
	"Montenegro",
	"Montserrat",
	"Morocco",
	"Mozambique",
	"Myanmar",
	"Namibia",
	"Nauru",
	"Nepal",
	"Netherlands (the)",
	"New Caledonia",
	"New Zealand",
	"Nicaragua",
	"Niger (the)",
	"Nigeria",
	"Niue",
	"Norfolk Island",
	"Northern Mariana Islands (the)",
	"Norway",
	"Oman",
	"Pakistan",
	"Palau",
	"Palestine, State of",
	"Panama",
	"Papua New Guinea",
	"Paraguay",
	"Peru",
	"Philippines (the)",
	"Pitcairn",
	"Poland",
	"Portugal",
	"Puerto Rico",
	"Qatar",
	"Republic of North Macedonia",
	"Romania",
	"Russian Federation (the)",
	"Rwanda",
	"Réunion",
	"Saint Barthélemy",
	"Saint Helena, Ascension and Tristan da Cunha",
	"Saint Kitts and Nevis",
	"Saint Lucia",
	"Saint Martin (French part)",
	"Saint Pierre and Miquelon",
	"Saint Vincent and the Grenadines",
	"Samoa",
	"San Marino",
	"Sao Tome and Principe",
	"Saudi Arabia",
	"Senegal",
	"Serbia",
	"Seychelles",
	"Sierra Leone",
	"Singapore",
	"Sint Maarten (Dutch part)",
	"Slovakia",
	"Slovenia",
	"Solomon Islands",
	"Somalia",
	"South Africa",
	"South Georgia and the South Sandwich Islands",
	"South Sudan",
	"Spain",
	"Sri Lanka",
	"Sudan (the)",
	"Suriname",
	"Svalbard and Jan Mayen",
	"Sweden",
	"Switzerland",
	"Syrian Arab Republic",
	"Taiwan",
	"Tajikistan",
	"Tanzania, United Republic of",
	"Thailand",
	"Timor-Leste",
	"Togo",
	"Tokelau",
	"Tonga",
	"Trinidad and Tobago",
	"Tunisia",
	"Turkey",
	"Turkmenistan",
	"Turks and Caicos Islands (the)",
	"Tuvalu",
	"Uganda",
	"Ukraine",
	"United Arab Emirates (the)",
	"United Kingdom of Great Britain and Northern Ireland (the)",
	"United States Minor Outlying Islands (the)",
	"United States of America (the)",
	"Uruguay",
	"Uzbekistan",
	"Vanuatu",
	"Venezuela (Bolivarian Republic of)",
	"Viet Nam",
	"Virgin Islands (British)",
	"Virgin Islands (U.S.)",
	"Wallis and Futuna",
	"Western Sahara",
	"Yemen",
	"Zambia",
	"Zimbabwe",
	"Åland Islands"
];

/**
 * For each skill we have the following data
 * - title
 * 	title of the skill
 * - icon
 * 	icon of the skill
 * - decsription
 * 	description of what consists the skill
 * - parametersDescription
 * 	description of parameters of the skill
 * - skillParameters
 * 	array of string representing the names of each skill parameter
 * - skillParametersLongName
 * 	array of strings which represent the name of each skill parameter written in a long way
 * - skillParametersDefaulValues
 * 	array which represents the default values of each parameter of the skill
 * - skillParametersPossibleValues
 * 	array of possible combinations of values for each skill parameter
 * - skillResultsParameters
 * 	array of string representing what is measured and showed in results after a game done on the skill
 * - skillPerformanceParameter
 * 	is a parameter which is used to measure the average performance of the user in a specific skill. This is used to update the
 * 	ranking score of a user
 * - playInstructions
 *  instructions to play the skill
 */

const skills=[
	{
		title:"FAST TYPING",
		icon:"fi fi-br-indent",
		description:"In this challenge you will type a set of word, without stopping between one word and the other, in the shortest time possible",
		parametersDescription:"Select the number of words and chars for each word, you want to play with",
		skillParameters:["numWords","numChars"],
		skillParametersLongName:["number of words","number of chars"],
		skillParametersDefaultValues:[1,4],
		skillParametersPossibleValues:[
			[1,4],
			[4,4],
			[5,4]
		],
		skillResultsParameters:["totTime","avgTime","fastestWord"],
		skillPerformanceParameter:"avgTime",
		playInstructions:"In the following screnn there will be a text area with all the words you have to write and an input field, that ha sto be used to write the words\nFor each word, type it in the input field and press space once done; automatically the input field will be clear and you will be able to type the next word.\nThe current word is underlined by a blue color, instead all past correct words are underlined by a green color and if you type wrong the current word, it will become underlined by red color and you will be able to type it again"
	},
	{
		title:"REACTIVE CLICK",
		icon:"fi fi-sr-interactive",
		description:"In this challenge you will click, in the shortest time possible, on some circles that will appear in random positions on the screen",
		parametersDescription:"Select the number of circles that have to appear on the screen",
		skillParameters:["numWords","numChars"],
		skillParametersLongName:["number of words","number of chars"],
		skillParametersDefaultValues:[1,4],
		skillParametersPossibleValues:[
			[1,4],
			[4,4],
			[5,4]
		],
		skillResultsParameters:["totTime","avgTime","fastestWord"],
		skillAvgPerformanceParameter:"avgTime",
		playInstructions:"In the following screnn there will be a text area with all the words you have to write and an input field, that ha sto be used to write the words\nFor each word, type it in the input field and press space once done; automatically the input field will be clear and you will be able to type the next word.\nThe current word is underlined by a blue color, instead all past correct words are underlined by a green color and if you type wrong the current word, it will become underlined by red color and you will be able to type it again"
	},
	{
		title:"TIME STOPPER",
		icon:"fi fi-rr-time-fast",
		description:"In this challenge there is a chronometer that will start measuring the time; You will stop it at a specific indicated time",
		parametersDescription:"There are no parameters to set for this skill"
	}
]

//color of lines to print in charts
const lineChartColors=["#16a34a","#dc2626","#1d4ed8"]

//indicates for each range of renking points, and for each skill, which is the estimated avg performance to use in order to
//compare performance done by the user in a game if no other users have similar ranking to the one who has played.
const skillAvgPerformanceRanking={
	"FAST TYPING":{
		//parameters used to calculate avg performances in following ranges
		relativeParameter:[1,4],

		//value to add to the calculated avg performance for each additional unit of the skill parameter related to the "relativeParameter"
		//expressed in the previous field 
		//EX: if skills parameters are [1,6] we calculate he avg performance with the following ranges and add to it 0.2s*2=0.4s since
		//we have that 6-4=2 (with 6 the second parameter of the skill and 4 the parameter used to calculate avg performances in following ranges)
		additioner:[0,0.2],

		ranges:[
			//at range 0-50 the avg performance is 10s and at reange 350-400 the avg performance is 3s
			//to calculate intermediate ranges (between 0-50 and 350-400) just take the avgPerformance and subtract to it the
			//integer part of the division (current user ranking points - rangeRankingPoints[0])/50 in seconds.
			//EX: current user ranking is 310, to discover the avgPerformance of range 300-350 in which the user is, just to (310-0)/50=6.1=6
			//and do avgPerformance 10-6=4s, so the avg performance for range 300-350 is 4s
			{rangeRankingPoints:[0,400],avgPerformance:10,subtractator:1,singleRange:false},

			//in this case the range represented is only one and there is no intermediate range to calculate
			{rangeRankingPoints:[400,450],avgPerformance:2.5,singleRange:true},
			{rangeRankingPoints:[450,500],avgPerformance:2.25,singleRange:true},

			//to calculate intermediate ranges, subtract 0.1s to minAvgPerformance multiplied by (current user ranking points - rangeRankingPoints[0])/50
			{rangeRankingPoints:[500,1300],avgPerformance:2,subtractator:0.1,singleRange:false},

			//this is the last range possible. For every ranking points between 1300 and infinity, the related avg performance is 0.4s
			{rangeRankingPoints:[1300,Infinity],avgPerformance:0.4,singleRange:true}
		]
	}
}

export {countries,skills,lineChartColors,skillAvgPerformanceRanking};