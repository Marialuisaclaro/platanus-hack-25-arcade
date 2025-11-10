// Platanus Hack 25: Banana Raider
// Dig sand, push dynamite, collect bananas to the portal!

const ARCADE_CONTROLS = {
	P1U: ["w"],
	P1D: ["s"],
	P1L: ["a"],
	P1R: ["d"],
	P1A: ["u"],
	P1B: ["i"],
	START1: ["1", "Enter"],
	P2U: ["ArrowUp", "Up"],
	P2D: ["ArrowDown", "Down"],
	P2L: ["ArrowLeft", "Left"],
	P2R: ["ArrowRight", "Right"],
	P2A: ["r"],
	START2: ["2"],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keyboardKeys] of Object.entries(ARCADE_CONTROLS)) {
  if (keyboardKeys) {
    const keys = Array.isArray(keyboardKeys) ? keyboardKeys : [keyboardKeys];
		keys.forEach((key) => {
      KEYBOARD_TO_ARCADE[key] = arcadeCode;
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
	backgroundColor: "#2c3e50",
  scene: {
    create: create,
		update: update,
	},
};

const game = new Phaser.Game(config);

// Game constants
const TILE = 40;
const GRID_W = 20;
const GRID_H = 15;

// Tile types
const EMPTY = 0;
const SAND = 1;
const WALL = 2; // Muro café (perímetro) - NO se rompe
const DYNAMITE = 3;
const BANANA = 4;
const TRANSPORT = 5;
const ROCK = 6; // Roca gris - SÍ explota con dinamita

// Game state
let grid = [];
const player = { x: 1, y: 1, leg: 0, isDead: false }; // leg for animation
let graphics = null;
let level = 0;
let bananasLeft = 0;
let gameWon = false;
let statusText;
let timerText;
let scoreText;
let livesText;
const nameSelectorTexts = [];
let levelTime = 0;
let totalScore = 0;
let levelStartTime = 0;
let energy = 100;
let lives = 3;
let maxLevelTime = 30;
let lastTickTime = 0;
let lastGravityTime = 0;

// Player name and leaderboard
let playerName = "";
const nameSelector = {
	active: false,
	currentName: "",
	selectedIndex: 0,
	maxLength: 12,
};
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const alphabetButtons = [];
const clearButton = null;
const startButton = null;
let nameDisplayText = null;
let exitButton = null;
let restartButton = null;

// In-memory leaderboard (persists during session only)
let leaderboard = [];

function addScore(name, score) {
	leaderboard.push({ name, score, date: Date.now() });
	leaderboard.sort((a, b) => b.score - a.score);
	const top10 = leaderboard.slice(0, 10);
	leaderboard = top10; // Keep only top 10
	return top10;
}

function generateRandomName() {
	const coolNames = [
		"ACE", "ALEX", "BOLT", "BUZZ", "CHIEF", "DASH", "DUKE", "EDGE",
		"FLASH", "FOX", "HAWK", "HERO", "JACK", "JET", "KING", "LEO",
		"MAX", "NEO", "NOVA", "PIXEL", "QUEST", "REX", "RIOT", "SAGE",
		"SONIC", "SPIKE", "STAR", "TURBO", "VIPER", "WOLF", "ZACK", "ZERO",
		"BLAZE", "COBRA", "CYBER", "DRAKE", "FALCON", "GHOST", "LASER",
		"NINJA", "OMEGA", "RAID", "RAVEN", "REBEL", "ROCKY", "SHARK",
		"STORM", "TANK", "TITAN", "VENOM", "BLADE", "NIGHT", "FROST"
	];

	const baseName = coolNames[Math.floor(Math.random() * coolNames.length)];
	const number = Math.floor(Math.random() * 100); // 0-99

	// 70% chance to add number, 30% just the name
	if (Math.random() < 0.7) {
		return baseName + number;
	}
	return baseName;
}

// Level definitions (compact format)
const levels = [
	// Level 1
	{
		data: [
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 1, 1, 1, 0, 0, 0, 2, 2, 2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 2],
			[2, 1, 1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 2, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		],
		start: { x: 2, y: 2 },
	},
	// Level 2
	{
		data: [
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 4, 0, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 6, 6, 6, 0, 0, 2],
			[2, 0, 0, 1, 4, 1, 1, 1, 0, 0, 0, 0, 0, 0, 6, 6, 6, 0, 0, 2],
			[2, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 6, 6, 6, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 1, 1, 5, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		],
		start: { x: 1, y: 1 },
	},
	// Level 3
	{
		data: [
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 4, 0, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 6, 6, 6, 6, 6, 6, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		],
		start: { x: 1, y: 1 },
	},
	// Level 4
	{
		data: [
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 0, 0, 2],
			[2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
			[2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 2],
			[2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 6, 1, 1, 1, 1, 4, 1, 1, 6, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 0, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		],
		start: { x: 1, y: 1 },
	},
	// Level 5
	{
		data: [
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 0, 1, 1, 1, 0, 4, 0, 1, 1, 4, 1, 1, 0, 4, 0, 1, 1, 0, 2],
			[2, 0, 1, 1, 1, 0, 3, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 2],
			[2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 2],
			[2, 0, 0, 6, 6, 6, 6, 6, 6, 6, 1, 6, 6, 6, 1, 6, 6, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 1, 1, 1, 1, 0, 0, 2, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 0, 0, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		],
		start: { x: 1, y: 1 },
	},
	// Level 6
	{
    data: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 1, 1, 1, 0, 6, 6, 0, 1, 4, 1, 0, 6, 6, 0, 1, 1, 0, 2],
      [2, 0, 1, 1, 0, 0, 6, 1, 0, 1, 1, 1, 0, 1, 6, 0, 1, 1, 0, 2],
      [2, 0, 1, 0, 0, 0, 0, 1, 0, 6, 3, 6, 0, 1, 0, 0, 1, 1, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 1, 6, 6, 1, 6, 6, 1, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 1, 6, 0, 1, 0, 6, 1, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 6, 6, 1, 6, 0, 1, 0, 6, 1, 6, 6, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 6, 1, 4, 1, 0, 4, 1, 1, 6, 3, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
		start: { x: 1, y: 1 },
	},
	// Level 7
	{
    data: [
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 0, 1, 1, 1, 0, 6, 6, 0, 1, 4, 1, 0, 6, 6, 0, 1, 1, 0, 2],
      [2, 0, 1, 1, 0, 0, 6, 1, 0, 1, 1, 1, 0, 1, 6, 0, 1, 1, 0, 2],
      [2, 0, 1, 0, 0, 0, 0, 1, 0, 6, 3, 6, 0, 1, 0, 0, 1, 1, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 1, 6, 6, 1, 6, 6, 1, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 6, 1, 0, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 6, 0, 1, 6, 0, 1, 0, 6, 1, 6, 6, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 0, 1, 4, 1, 0, 4, 1, 1, 6, 3, 0, 0, 0, 0, 2],
      [2, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    ],
		start: { x: 1, y: 1 },
	},
	// Level 8
	{
		data: [
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 0, 1, 3, 1, 1, 1, 1, 1, 1, 4, 1, 1, 1, 1, 1, 1, 1, 0, 2],
			[2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 2],
			[2, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 2],
			[2, 0, 0, 1, 1, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 1, 1, 0, 0, 2],
			[2, 0, 0, 0, 1, 6, 3, 1, 1, 1, 1, 1, 3, 6, 1, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 6, 1, 1, 1, 1, 4, 1, 1, 6, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 6, 6, 6, 6, 6, 6, 6, 0, 0, 0, 0, 0, 0, 2],
			[2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 4, 1, 0, 0, 0, 0, 0, 0, 0, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 5, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
			[2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
		],
		start: { x: 1, y: 1 },
	},
];

// Leaderboard functions
function getLeaderboard() {
	const stored = localStorage.getItem("bananaRaiderTop10");
	return stored ? JSON.parse(stored) : [];
}

function saveScore(name, score) {
	const leaderboard = getLeaderboard();
	leaderboard.push({ name, score, date: Date.now() });
	leaderboard.sort((a, b) => b.score - a.score);
	const top10 = leaderboard.slice(0, 10);
	localStorage.setItem("bananaRaiderTop10", JSON.stringify(top10));
	return top10;
}

function showNameSelector(scene) {
	nameSelector.active = true;
	nameSelector.selectedIndex = 0;

	// Generate random name
	nameSelector.currentName = generateRandomName();
}

function create() {
  graphics = this.add.graphics();

	// Show name selector ONLY if no player name set
	if (playerName === "") {
		showNameSelector(this);
	}

	// Title
	this.add
		.text(400, 20, "🍌 BANANA RAIDER 🍌", {
			fontSize: "32px",
			fontFamily: "Arial",
			color: "#ffcc00",
			stroke: "#000",
			strokeThickness: 4,
		})
		.setOrigin(0.5);

	// Status bar - 6 elements distributed evenly
	const barY = 55;
	const barSize = 18;
	const positions = [80, 220, 360, 500, 640, 760]; // 6 positions evenly distributed

	// 1. LEVEL
	this.add
		.text(positions[0], barY, "LEVEL", {
			fontSize: "13px",
			fontFamily: "Arial",
			color: "#888",
			stroke: "#000",
			strokeThickness: 1,
		})
		.setOrigin(0.5);

	statusText = this.add
		.text(positions[0], barY + 20, "1", {
			fontSize: barSize + "px",
			fontFamily: "Arial",
			color: "#ffcc00",
			stroke: "#000",
			strokeThickness: 2,
		})
		.setOrigin(0.5);

	// 2. SCORE
	this.add
		.text(positions[1], barY, "SCORE", {
			fontSize: "13px",
			fontFamily: "Arial",
			color: "#888",
			stroke: "#000",
			strokeThickness: 1,
		})
		.setOrigin(0.5);

	scoreText = this.add
		.text(positions[1], barY + 20, "0", {
			fontSize: barSize + "px",
			fontFamily: "Arial",
			color: "#00ffff",
			stroke: "#000",
			strokeThickness: 2,
		})
		.setOrigin(0.5);

	// 3. TIME
	this.add
		.text(positions[2], barY, "TIME", {
			fontSize: "13px",
			fontFamily: "Arial",
			color: "#888",
			stroke: "#000",
			strokeThickness: 1,
		})
		.setOrigin(0.5);

	timerText = this.add
		.text(positions[2], barY + 20, "40s", {
			fontSize: barSize + "px",
			fontFamily: "Arial",
			color: "#ffcc00",
			stroke: "#000",
			strokeThickness: 2,
		})
		.setOrigin(0.5);

	// 4. LIVES
	this.add
		.text(positions[3], barY, "LIVES", {
			fontSize: "13px",
			fontFamily: "Arial",
			color: "#888",
			stroke: "#000",
			strokeThickness: 1,
		})
		.setOrigin(0.5);

	livesText = this.add
		.text(positions[3], barY + 20, "♥♥♥", {
			fontSize: barSize + "px",
			fontFamily: "Arial",
			color: "#ff0000",
			stroke: "#000",
			strokeThickness: 2,
		})
		.setOrigin(0.5);

	// 5. RESTART BUTTON (lose a life)
	restartButton = this.add
		.text(positions[4], barY + 10, "💀", {
			fontSize: "20px",
			fontFamily: "Arial",
			color: "#ffffff",
			backgroundColor: "#990000",
			padding: { x: 10, y: 5 },
		})
		.setOrigin(0.5)
		.setInteractive();

	restartButton.on("pointerdown", () => {
		loseLife(this);
	});

	// 6. EXIT BUTTON (change name)
	exitButton = this.add
		.text(positions[5], barY + 10, "🚪", {
			fontSize: "20px",
			fontFamily: "Arial",
			color: "#ffffff",
			backgroundColor: "#cc6600",
			padding: { x: 10, y: 5 },
		})
		.setOrigin(0.5)
		.setInteractive();

	exitButton.on("pointerdown", () => {
		// Go back to name selector
		level = 0;
		totalScore = 0;
		lives = 3;
		gameWon = false;
		energy = 100;
		playerName = ""; // Reset name
		this.scene.restart();
	});

	// Instructions at bottom
	this.add
		.text(
			400,
			570,
			"WASD: Move | Dig sand | Push to portal | 💀: Restart | 🚪: Exit",
			{
				fontSize: "12px",
				fontFamily: "Arial",
				color: "#888",
				stroke: "#000",
				strokeThickness: 1,
			},
		)
		.setOrigin(0.5);

	this.input.keyboard.on("keydown", (event) => {
		const key = event.key;

		// NAME SELECTOR CONTROLS
		if (nameSelector.active) {
			// Navigate alphabet grid with WASD/Arrows
			if (key === "w" || key === "W" || key === "ArrowUp") {
				nameSelector.selectedIndex = Math.max(
					0,
					nameSelector.selectedIndex - 6,
				);
				playTone(this, 400, 0.05);
				return;
			}
			if (key === "s" || key === "S" || key === "ArrowDown") {
				nameSelector.selectedIndex = Math.min(
					ALPHABET.length - 1,
					nameSelector.selectedIndex + 6,
				);
				playTone(this, 400, 0.05);
				return;
			}
			if (key === "a" || key === "A" || key === "ArrowLeft") {
				nameSelector.selectedIndex = Math.max(
					0,
					nameSelector.selectedIndex - 1,
				);
				playTone(this, 500, 0.05);
				return;
			}
			if (key === "d" || key === "D" || key === "ArrowRight") {
				nameSelector.selectedIndex = Math.min(
					ALPHABET.length - 1,
					nameSelector.selectedIndex + 1,
				);
				playTone(this, 500, 0.05);
				return;
			}
			// Select letter with button A (u key)
			if (key === "u" || key === " ") {
				if (nameSelector.currentName.length < nameSelector.maxLength) {
					nameSelector.currentName += ALPHABET[nameSelector.selectedIndex];
					playTone(this, 600, 0.1);
				}
				return;
			}
			// Backspace/Delete
			if (key === "Backspace" || key === "Delete" || key === "i") {
				if (nameSelector.currentName.length > 0) {
					nameSelector.currentName = nameSelector.currentName.slice(0, -1);
					playTone(this, 300, 0.1);
				}
				return;
			}
			// START to confirm
			if (key === "Enter" || key === "1") {
				if (nameSelector.currentName.length > 0) {
					playerName = nameSelector.currentName;
					nameSelector.active = false;
					playTone(this, 800, 0.2);
					loadLevel(level);
				}
				return;
			}
			return;
		}

		// EXIT - volver a selección de nombre (ESC)
		if (key === "Escape") {
			level = 0;
			totalScore = 0;
			lives = 3;
			gameWon = false;
			energy = 100;
			playerName = ""; // Reset name to show selector
			this.scene.restart();
      return;
    }

		// Restart con START (u = botón arcade, Enter, o 1)
		if (key === "u" || key === "Enter" || key === "1") {
			if (lives <= 0 || gameWon) {
				// Reset del juego pero MANTENER el nombre del jugador
				// (aplica tanto para Game Over como para Victory)
				level = 0;
				totalScore = 0;
				lives = 3;
				gameWon = false;
				energy = 100;
				// NO resetear playerName - seguir jugando con el mismo usuario
				this.scene.restart();
			} else {
				resetLevel(this);
			}
			return;
		}

		if (gameWon) return;

		let dx = 0,
			dy = 0;

		// WASD
		if (key === "w" || key === "W") dy = -1;
		else if (key === "s" || key === "S") dy = 1;
		else if (key === "a" || key === "A") dx = -1;
		else if (key === "d" || key === "D") dx = 1;
		// Flechas
		else if (key === "ArrowUp") dy = -1;
		else if (key === "ArrowDown") dy = 1;
		else if (key === "ArrowLeft") dx = -1;
		else if (key === "ArrowRight") dx = 1;

		if (dx !== 0 || dy !== 0) {
			movePlayer(this, dx, dy);
		}
	});

	// Initialize alphabet buttons first (compact for 800x520 area)
	// 6 columns, 6 rows (36 letters total)
	const startX = 265;
	const startY = 260;
	const buttonSize = 40;
	const spacing = 55;

	for (let i = 0; i < ALPHABET.length; i++) {
		const col = i % 6;
		const row = Math.floor(i / 6);
		const x = startX + col * spacing;
		const y = startY + row * spacing;

		const letterText = this.add
			.text(x, y, ALPHABET[i], {
				fontSize: "20px",
				fontFamily: "Arial",
				color: "#ffffff",
				stroke: "#000",
				strokeThickness: 2,
			})
			.setOrigin(0.5)
			.setVisible(false);

		alphabetButtons.push({
			letter: ALPHABET[i],
			x: x,
			y: y,
			size: buttonSize,
			textObj: letterText,
		});
	}

	// Create name display text
	nameDisplayText = this.add
		.text(400, 155, "", {
			fontSize: "24px",
			fontFamily: "Arial",
			color: "#ffffff",
			stroke: "#000",
			strokeThickness: 2,
		})
		.setOrigin(0.5)
		.setVisible(false);

	// Create name selector title
	const nameSelectorTitle = this.add
		.text(400, 105, "ENTER YOUR NAME", {
			fontSize: "26px",
			fontFamily: "Arial",
			color: "#ffcc00",
			stroke: "#000",
			strokeThickness: 3,
		})
		.setOrigin(0.5)
		.setVisible(false);

	// Create name selector instructions (more compact)
	const nameSelectorInstructions = this.add
		.text(
			400,
			220,
			"WASD: Navigate | A: Select | B: Delete | START: Play",
			{
				fontSize: "11px",
				fontFamily: "Arial",
				color: "#ffcc00",
				stroke: "#000",
				strokeThickness: 1,
			},
		)
		.setOrigin(0.5)
		.setVisible(false);

	// Store references to toggle visibility
	nameDisplayText.titleText = nameSelectorTitle;
	nameDisplayText.instructionsText = nameSelectorInstructions;

	// If player already has a name, start playing directly
	if (playerName !== "") {
		loadLevel(level);
	}

	// Play start sound after a short delay
	this.time.delayedCall(100, () => {
		playTone(this, 440, 0.1);
	});
}

function loadLevel(lvl) {
	gameWon = false;
	const levelData = levels[lvl % levels.length];

	// Deep copy grid
	grid = levelData.data.map((row) => [...row]);
	player.x = levelData.start.x;
	player.y = levelData.start.y;
	player.leg = 0;
	player.isDead = false;

	// Count bananas
	bananasLeft = 0;
	for (let y = 0; y < GRID_H; y++) {
		for (let x = 0; x < GRID_W; x++) {
			if (grid[y][x] === BANANA) bananasLeft++;
		}
	}

	// Reset timer and energy
	levelTime = 0;
	levelStartTime = Date.now();
	energy = 100;
	maxLevelTime = 40; // 40 segundos por nivel
	lastGravityTime = 0;

	updateStatus();
}

function updateStatus() {
	statusText.setText(`${level + 1}`);
	scoreText.setText(`${totalScore}`);

	// Update lives
	let heartsStr = "";
	for (let i = 0; i < lives; i++) {
		heartsStr += "♥";
	}
	for (let i = lives; i < 3; i++) {
		heartsStr += "🖤";
	}
	livesText.setText(heartsStr);
}

function movePlayer(scene, dx, dy) {
	const nx = player.x + dx;
	const ny = player.y + dy;

	// Check bounds
	if (nx < 0 || nx >= GRID_W || ny < 0 || ny >= GRID_H) return;

	const tile = grid[ny][nx];

	// Can't walk through walls or rocks
	if (tile === WALL || tile === ROCK) {
		playTone(scene, 200, 0.1);
    return;
  }

	// Dig sand
	if (tile === SAND) {
		grid[ny][nx] = EMPTY;
		player.x = nx;
		player.y = ny;
		player.leg = (player.leg + 1) % 4;
		playTone(scene, 600, 0.1);

		energy = Math.max(0, energy - 0.5);
		if (energy === 0) {
			loseLife(scene);
      return;
    }

		return;
	}

	// Push objects
	if (tile === DYNAMITE || tile === BANANA) {
		const nx2 = nx + dx;
		const ny2 = ny + dy;

		if (nx2 < 0 || nx2 >= GRID_W || ny2 < 0 || ny2 >= GRID_H) return;

		const tile2 = grid[ny2][nx2];

		if (tile2 !== EMPTY && tile2 !== TRANSPORT) return;

		grid[ny2][nx2] = tile;
		grid[ny][nx] = EMPTY;
		player.x = nx;
		player.y = ny;
		player.leg = (player.leg + 1) % 4;

		playTone(scene, 400, 0.15);

		energy = Math.max(0, energy - 1);
		if (energy === 0) {
			grid[ny][nx] = tile;
			grid[ny2][nx2] = tile2;
			player.x -= dx;
			player.y -= dy;
			loseLife(scene);
      return;
		}

		if (tile === BANANA && tile2 === TRANSPORT) {
			bananasLeft--;
			grid[ny2][nx2] = TRANSPORT; // Keep the portal!
			playTone(scene, 880, 0.3);
			totalScore += 100;
			updateStatus();

			if (bananasLeft === 0) {
				winLevel(scene);
			}
		}

		if (tile === DYNAMITE && tile2 === TRANSPORT) {
			explode(scene, nx2, ny2);
		}

		return;
	}

	// Move to empty space or transporter
	if (tile === EMPTY || tile === TRANSPORT) {
		player.x = nx;
		player.y = ny;
		player.leg = (player.leg + 1) % 4;
		playTone(scene, 300, 0.08);

		energy = Math.max(0, energy - 0.2);
		if (energy === 0) {
			loseLife(scene);
			return;
		}

		return;
	}
}

function applyGravity(scene) {
	// Don't apply gravity if game is won or grid not initialized
	if (gameWon || !grid || grid.length === 0) return;

	// Apply gravity ONE step at a time (fall one space)
	for (let y = GRID_H - 2; y >= 0; y--) {
		for (let x = 0; x < GRID_W; x++) {
			const tile = grid[y][x];

			// Only dynamite and bananas fall
			if (tile === DYNAMITE || tile === BANANA) {
				const below = grid[y + 1][x];

				// DON'T fall on player!
				const playerBelow = player.x === x && player.y === y + 1;
				if (playerBelow) continue;

				// If dynamite falls onto rock OR another dynamite, explode!
				if (tile === DYNAMITE && (below === ROCK || below === DYNAMITE)) {
					grid[y][x] = EMPTY;
					explode(scene, x, y + 1);
					continue;
				}

				// If banana falls onto portal, collect it!
				if (tile === BANANA && below === TRANSPORT) {
					grid[y][x] = EMPTY;
					bananasLeft--;
					playTone(scene, 880, 0.3);
					totalScore += 100;
					updateStatus();

					if (bananasLeft === 0) {
						winLevel(scene);
					}
					continue;
				}

				// Fall into empty space ONLY (not sand, transporter, walls, or rocks)
				if (below === EMPTY) {
					grid[y + 1][x] = tile;
					grid[y][x] = EMPTY;
				}
			}
		}
	}
}

function explode(scene, x, y) {
	playTone(scene, 150, 0.5);

	// Remove dynamite
	grid[y][x] = EMPTY;

	// Destroy everything in 3x3 area EXCEPT walls (type 2)
	for (let dy = -1; dy <= 1; dy++) {
		for (let dx = -1; dx <= 1; dx++) {
			const nx = x + dx;
			const ny = y + dy;

			if (nx >= 0 && nx < GRID_W && ny >= 0 && ny < GRID_H) {
				const tile = grid[ny][nx];
				// Destroy everything EXCEPT walls and transport
				if (tile !== WALL && tile !== TRANSPORT) {
					grid[ny][nx] = EMPTY;
				}
			}
		}
	}

	applyGravity(scene);
}

function winLevel(scene) {
	// Prevent multiple calls
	if (gameWon) return;
	gameWon = true;

	// Calculate score based on time and energy
	const timeTaken = Math.floor(levelTime);
	const baseScore = 1000;
	const timeBonus = Math.max(0, baseScore - timeTaken * 2);
	const energyBonus = Math.floor(energy * 5);
	const levelScore = timeBonus + energyBonus;
	totalScore += levelScore;

	playTone(scene, 523, 0.2);
	playTone(scene, 659, 0.2);
	playTone(scene, 784, 0.3);

	// Show message briefly
	statusText.setText(`LEVEL COMPLETE! +${levelScore} pts`);
	scoreText.setText(`${totalScore}`);

	// Advance to next level immediately
	nextLevel(scene);
}

function loseLife(scene) {
	lives--;
	player.isDead = true;

	if (lives <= 0) {
		gameOver(scene);
    } else {
		playTone(scene, 200, 0.3);

		// Show death animation for 1 second, then restart level
		scene.time.delayedCall(1000, () => {
			player.isDead = false;
			// Reiniciar el nivel completo al estado inicial
			loadLevel(level);
		});
	}
}

function gameOver(scene) {
	gameWon = true;
	playTone(scene, 150, 0.5);

	// Save score to leaderboard
	const top10 = addScore(playerName, totalScore);

	// Draw game over overlay covering the whole screen
	const overlay = scene.add.graphics();
	overlay.fillStyle(0x000000, 0.95);
	overlay.fillRect(0, 0, 800, 600);

	scene.add
		.text(400, 80, "GAME OVER", {
			fontSize: "56px",
			fontFamily: "Arial",
			color: "#ff0000",
			stroke: "#000",
			strokeThickness: 6,
		})
		.setOrigin(0.5)
		.setDepth(1000);

	scene.add
		.text(400, 150, `${playerName}: ${totalScore} pts`, {
			fontSize: "28px",
			fontFamily: "Arial",
			color: "#ffcc00",
			stroke: "#000",
			strokeThickness: 3,
		})
		.setOrigin(0.5)
		.setDepth(1000);

	// Show TOP 10
	scene.add
		.text(400, 200, "═══ TOP 10 ═══", {
			fontSize: "24px",
			fontFamily: "Arial",
			color: "#00ffff",
			stroke: "#000",
			strokeThickness: 2,
		})
		.setOrigin(0.5)
		.setDepth(1000);

	// Display top 10 scores
	top10.forEach((entry, index) => {
		const isPlayer = entry.name === playerName && entry.score === totalScore;
		const color = isPlayer ? "#ffff00" : "#ffffff";
		const rank = index + 1;

		scene.add
			.text(400, 235 + index * 30, `${rank}. ${entry.name} - ${entry.score}`, {
				fontSize: "20px",
				fontFamily: "Arial",
				color: color,
				stroke: "#000",
				strokeThickness: 2,
			})
			.setOrigin(0.5)
			.setDepth(1000);
	});

	scene.add
		.text(400, 550, "START: Play Again | ESC: Change Name", {
			fontSize: "20px",
			fontFamily: "Arial",
			color: "#888888",
			stroke: "#000",
			strokeThickness: 2,
		})
		.setOrigin(0.5)
		.setDepth(1000);

	statusText.setText("");
}

function nextLevel(scene) {
	level++;

	// Check if completed all levels
	if (level >= levels.length) {
		// Victory! Show completion screen with leaderboard
		gameWon = true;

		// Save score to leaderboard
		const top10 = addScore(playerName, totalScore);

		const overlay = scene.add.graphics();
		overlay.fillStyle(0x000000, 0.95);
		overlay.fillRect(0, 0, 800, 600);

		scene.add
			.text(400, 80, "🎉 VICTORY! 🎉", {
				fontSize: "56px",
				fontFamily: "Arial",
				color: "#00ff00",
				stroke: "#000",
				strokeThickness: 6,
			})
			.setOrigin(0.5)
			.setDepth(1000);

		scene.add
			.text(400, 150, `${playerName}: ${totalScore} pts`, {
				fontSize: "28px",
				fontFamily: "Arial",
				color: "#ffcc00",
				stroke: "#000",
				strokeThickness: 3,
			})
			.setOrigin(0.5)
			.setDepth(1000);

		// Show TOP 10
		scene.add
			.text(400, 200, "═══ TOP 10 ═══", {
				fontSize: "24px",
				fontFamily: "Arial",
				color: "#00ffff",
				stroke: "#000",
				strokeThickness: 2,
			})
			.setOrigin(0.5)
			.setDepth(1000);

		// Display top 10 scores
		top10.forEach((entry, index) => {
			const isPlayer = entry.name === playerName && entry.score === totalScore;
			const color = isPlayer ? "#ffff00" : "#ffffff";
			const rank = index + 1;

			scene.add
				.text(400, 235 + index * 30, `${rank}. ${entry.name} - ${entry.score}`, {
					fontSize: "20px",
					fontFamily: "Arial",
					color: color,
					stroke: "#000",
					strokeThickness: 2,
				})
				.setOrigin(0.5)
				.setDepth(1000);
		});

		scene.add
			.text(400, 550, "START: Play Again | ESC: Change Name", {
				fontSize: "20px",
				fontFamily: "Arial",
				color: "#888888",
				stroke: "#000",
				strokeThickness: 2,
			})
			.setOrigin(0.5)
			.setDepth(1000);

		// Reset for replay
		level = 0;
		totalScore = 0;
		lives = 3;
		return;
	}

	loadLevel(level);
	playTone(scene, 440, 0.1);
}

function resetLevel(scene) {
	loadLevel(level);
	playTone(scene, 330, 0.1);
}

function update(time, delta) {
	// Update name selector display
	if (nameSelector.active) {
		// Hide game buttons during name selection
		if (exitButton) exitButton.setVisible(false);
		if (restartButton) restartButton.setVisible(false);

		// Show title
		if (nameDisplayText.titleText) {
			nameDisplayText.titleText.setVisible(true);
		}

		// Show name display
		nameDisplayText.setText(nameSelector.currentName || "_");
		nameDisplayText.setVisible(true);

		// Show instructions
		if (nameDisplayText.instructionsText) {
			nameDisplayText.instructionsText.setVisible(true);
		}

		// Show alphabet button letters
		alphabetButtons.forEach((btn) => {
			btn.textObj.setVisible(true);
		});
	} else {
		// Show game buttons when playing
		if (exitButton) exitButton.setVisible(true);
		if (restartButton) restartButton.setVisible(true);

		// Hide name selector elements
		if (nameDisplayText.titleText) {
			nameDisplayText.titleText.setVisible(false);
		}

		nameDisplayText.setVisible(false);

		// Hide instructions
		if (nameDisplayText.instructionsText) {
			nameDisplayText.instructionsText.setVisible(false);
		}

		alphabetButtons.forEach((btn) => {
			btn.textObj.setVisible(false);
		});
	}

	// Update timer if not won and not in name selector
	if (!gameWon && lives > 0 && !player.isDead && !nameSelector.active) {
		levelTime = (Date.now() - levelStartTime) / 1000;
		const timeLeft = Math.max(0, maxLevelTime - Math.floor(levelTime));

		// Change color when time is running out
		const timeColor =
			timeLeft > 10 ? "#ffcc00" : timeLeft > 5 ? "#ff9900" : "#ff0000";
		timerText.setColor(timeColor);
		timerText.setText(`${timeLeft}s`);

		// Tic tac sound when 5 seconds or less
		if (timeLeft <= 5 && timeLeft > 0) {
			const currentSecond = Math.floor(timeLeft);
			if (currentSecond !== lastTickTime) {
				lastTickTime = currentSecond;
				playTone(this, 800, 0.1); // Tic tac
			}
		}

		// Time's up - lose life
		if (timeLeft === 0 && !player.isDead) {
			loseLife(this);
		}

		// Apply gravity every 150ms (animated falling)
		if (time - lastGravityTime > 150) {
			lastGravityTime = time;
			applyGravity(this);
		}

		updateStatus();
	}

	drawGame();
}

function drawGame() {
	graphics.clear();

	// If name selector is active, draw it instead of game
	if (nameSelector.active) {
		// Draw background
		graphics.fillStyle(0x1a1a2e, 1);
		graphics.fillRect(0, 80, 800, 520);

		// Draw current name display box
		graphics.fillStyle(0x000000, 0.7);
		graphics.fillRect(250, 140, 300, 35);
		graphics.lineStyle(2, 0xffcc00);
		graphics.strokeRect(250, 140, 300, 35);

		// Draw alphabet buttons (6x6 grid)
		alphabetButtons.forEach((btn, index) => {
			const isSelected = index === nameSelector.selectedIndex;

			// Button background
			graphics.fillStyle(isSelected ? 0xffcc00 : 0x333333, 1);
			graphics.fillRect(
				btn.x - btn.size / 2,
				btn.y - btn.size / 2,
				btn.size,
				btn.size,
			);

			// Button border
			graphics.lineStyle(2, isSelected ? 0xffffff : 0x666666);
			graphics.strokeRect(
				btn.x - btn.size / 2,
				btn.y - btn.size / 2,
				btn.size,
				btn.size,
			);
		});

		return;
	}

	// Draw background
	graphics.fillStyle(0x1a1a2e, 1);
	graphics.fillRect(0, 80, 800, 520);

	// Don't draw grid if not initialized
	if (!grid || grid.length === 0) return;

	// Draw grid (offset for title)
	const offsetY = 80;

	for (let y = 0; y < GRID_H; y++) {
		for (let x = 0; x < GRID_W; x++) {
			const tile = grid[y][x];
			const px = x * TILE;
			const py = y * TILE + offsetY;

			if (tile === SAND) {
				// Sand - yellow/brown - TEXTURA FIJA
				graphics.fillStyle(0xc4a24d, 1);
				graphics.fillRect(px, py, TILE, TILE);
				graphics.fillStyle(0x9a7b3d, 1);
				// Puntos fijos basados en posición
				const seed = x * 100 + y;
				graphics.fillCircle(
					px + 5 + (seed % 15),
					py + 8 + ((seed * 7) % 15),
					2,
				);
				graphics.fillCircle(
					px + 20 + ((seed * 3) % 10),
					py + 5 + ((seed * 11) % 12),
					2,
				);
				graphics.fillCircle(
					px + 10 + ((seed * 5) % 12),
					py + 25 + ((seed * 13) % 10),
					2,
				);
				graphics.fillCircle(
					px + 28 + ((seed * 9) % 8),
					py + 18 + ((seed * 17) % 12),
					2,
				);
			} else if (tile === WALL) {
				// Muro CAFÉ (wall) - NO se puede romper ni atravesar
				graphics.fillStyle(0x8b6914, 1);
				graphics.fillRect(px, py, TILE, TILE);
				// Textura café FIJA
				const seed = x * 100 + y;
				graphics.fillStyle(0xa58520, 1);
				graphics.fillCircle(
					px + 7 + (seed % 12),
					py + 7 + ((seed * 3) % 12),
					3,
				);
				graphics.fillCircle(
					px + 22 + ((seed * 7) % 10),
					py + 18 + ((seed * 11) % 10),
					2,
				);
				graphics.fillCircle(
					px + 15 + ((seed * 13) % 8),
					py + 28 + ((seed * 17) % 8),
					2,
				);
				graphics.lineStyle(2, 0x6b5010);
				graphics.strokeRect(px, py, TILE, TILE);
			} else if (tile === ROCK) {
				// Rock GRIS - piedra que SÍ explota con dinamita
				graphics.fillStyle(0x777777, 1);
				graphics.fillRect(px, py, TILE, TILE);
				// Textura de piedras FIJA
				const seed = x * 100 + y;
				graphics.fillStyle(0x999999, 1);
				graphics.fillCircle(
					px + 8 + (seed % 10),
					py + 6 + ((seed * 3) % 10),
					4,
				);
				graphics.fillCircle(
					px + 22 + ((seed * 5) % 8),
					py + 15 + ((seed * 7) % 10),
					5,
				);
				graphics.fillCircle(
					px + 12 + ((seed * 11) % 10),
					py + 28 + ((seed * 13) % 8),
					4,
				);
				graphics.fillCircle(
					px + 30 + ((seed * 17) % 6),
					py + 22 + ((seed * 19) % 8),
					3,
				);
				graphics.lineStyle(2, 0x555555);
				graphics.strokeRect(px, py, TILE, TILE);
			} else if (tile === DYNAMITE) {
				// Dynamite - red stick with fuse
				graphics.fillStyle(0xdd0000, 1);
				graphics.fillRect(px + 8, py + 10, 24, 20);
				graphics.fillStyle(0x000000, 1);
				graphics.fillRect(px + 18, py + 5, 4, 8);
				graphics.fillStyle(0xff6600, 1);
				graphics.fillCircle(px + 20, py + 3, 3);
			} else if (tile === BANANA) {
				// Banana - mejor forma
				graphics.fillStyle(0xffee00, 1);
				// Cuerpo principal del plátano (rectángulo redondeado)
				graphics.fillRoundedRect(px + 12, py + 10, 16, 22, 8);
				// Sombra/profundidad
				graphics.fillStyle(0xccbb00, 1);
				graphics.fillRect(px + 14, py + 12, 3, 18);
				// Highlights brillantes
				graphics.fillStyle(0xffff99, 0.8);
				graphics.fillEllipse(px + 20, py + 18, 4, 8);
				// Tallo marrón
				graphics.fillStyle(0x8b4513, 1);
				graphics.fillRect(px + 18, py + 8, 4, 4);
			} else if (tile === TRANSPORT) {
				// Transporter - glowing green portal
				graphics.fillStyle(0x00ff00, 0.3);
				graphics.fillCircle(px + 20, py + 20, 18);
				graphics.lineStyle(3, 0x00ff00);
				graphics.strokeCircle(px + 20, py + 20, 15);
				graphics.strokeCircle(px + 20, py + 20, 10);
			}
		}
	}

	// Draw player (Human explorer with hat!)
	const px = player.x * TILE;
	const py = player.y * TILE + offsetY;

	if (player.isDead) {
		// Si está muerto, mostrar X roja
		graphics.lineStyle(4, 0xff0000);
		graphics.strokeLineShape(
			new Phaser.Geom.Line(px + 10, py + 10, px + 30, py + 30),
		);
		graphics.strokeLineShape(
			new Phaser.Geom.Line(px + 30, py + 10, px + 10, py + 30),
		);
	} else {
		// Cabeza
		graphics.fillStyle(0xffcc99, 1);
		graphics.fillCircle(px + 20, py + 15, 7);

		// Sombrero (marrón)
		graphics.fillStyle(0x8b4513, 1);
		graphics.fillRect(px + 13, py + 11, 14, 3); // Ala del sombrero
		graphics.fillRect(px + 15, py + 6, 10, 6); // Copa del sombrero

		// Cuerpo (camisa azul)
		graphics.fillStyle(0x0066cc, 1);
		graphics.fillRect(px + 14, py + 22, 12, 12);

		// Brazos
		graphics.fillStyle(0xffcc99, 1);
		graphics.fillCircle(px + 10, py + 26, 3);
		graphics.fillCircle(px + 30, py + 26, 3);

		// Piernas animadas (pantalón azul oscuro)
		graphics.fillStyle(0x003366, 1);
		if (player.leg % 4 < 2) {
			// Pierna izquierda adelante, derecha atrás
			graphics.fillRect(px + 15, py + 34, 4, 8);
			graphics.fillRect(px + 21, py + 32, 4, 8);
		} else {
			// Pierna derecha adelante, izquierda atrás
			graphics.fillRect(px + 15, py + 32, 4, 8);
			graphics.fillRect(px + 21, py + 34, 4, 8);
		}
	}
}

function playTone(scene, frequency, duration) {
  const audioContext = scene.sound.context;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
	oscillator.type = "square";

  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(
		0.01,
		audioContext.currentTime + duration,
	);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}
