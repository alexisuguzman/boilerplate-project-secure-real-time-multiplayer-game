import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";

const socket = io();
const canvas = document.getElementById("game-window"); // get canvas element to load game into
const context = canvas.getContext("2d"); // define context to use for drawing elements

let players = {}; // Store connected players
let collectibles = {}; // Store collectibles
let currentPlayerId = null; // Track the current player's ID

// ----------------------------------------------------------------
// Preloaded game images
// ----------------------------------------------------------------

// background image
let backgroundImage = new Image();
backgroundImage.src = "./assets/background.png";
backgroundImage.onload = () => {};

// Player images
let playerImage = new Image();
playerImage.src = "./assets/mainPlayer.png";
playerImage.onload = () => {}; // Image ready

let opponentImage = new Image();
opponentImage.src = "./assets/opponentPlayer.png";
opponentImage.onload = () => {}; // Image ready

// Collectible images
let collectibleImageCopper = new Image();
collectibleImageCopper.src = "./assets/copperIngot.png";
collectibleImageCopper.onload = () => {}; // Image ready

let collectibleImageIron = new Image();
collectibleImageIron.src = "./assets/ironIngot.png";
collectibleImageIron.onload = () => {}; // Image ready

let collectibleImageGold = new Image();
collectibleImageGold.src = "./assets/goldIngot.png";
collectibleImageGold.onload = () => {}; // Image ready

// ----------------------------------------------------------------
// Canvas management
// ----------------------------------------------------------------

// Canvas dimensions
const canvasWidth = 854;
const canvasHeight = 480;

function clearCanvas() {
	context.clearRect(0, 0, canvas.width, canvas.height);
}

// Function to advance the game by one frame
function updateGameCanvas() {
	clearCanvas();

	// Draw background
	context.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

	// Controls text
	context.fillStyle = "white";
	context.font = `20px 'Minecraft'`;
	context.textAlign = "center";
	context.fillText("Controls: WASD", 100, 32.5);

	// Game title
	context.font = `25px 'Minecraft'`;
	context.fillText("Ingot Race", canvas.width / 2, 32.5);

	console.log("Current Player ID:", currentPlayerId);
	console.log("Current Player Object:", players[currentPlayerId]);

	//Update player rank of client:
	if (players[currentPlayerId]) {
		let rank = players[currentPlayerId].calculateRank(players);
		console.log(`Player rank: ${rank}`);
		context.font = `20px 'Minecraft'`;
		context.fillText(rank, canvas.width - 100, 32.5);
	}

	// Draw all players
	for (let id in players) {
		let img = players[id].id === currentPlayerId ? playerImage : opponentImage; // Draw image
		players[id].drawPlayer(img, context);
	}

	// Draw all collectibles
	for (let id in collectibles) {
		drawCollectible(collectibles[id]);
	}

	checkPlayerCollectibleCollision();

	requestAnimationFrame(updateGameCanvas);
}
// ----------------------------------------------------------------
// Helper functions
// ----------------------------------------------------------------

function getRandomPosition() {
	return {
		x: Math.floor(Math.random() * (canvasWidth - 64)), // Ensure collectible is within bounds
		y: Math.floor(Math.random() * (canvasHeight - 64)), // Ensure collectible is within bounds
	};
}
// Function to send movement updates to the server
setInterval(() => {
	movePlayer(movement);
}, 16); // Adjust the interval as needed 60fps = 16, 30fps = 33

// ----------------------------------------------------------------
// Collectible related functions
// ----------------------------------------------------------------

// Collectible Variables
let idCounter = 0;

function generateCollectible() {
	idCounter++;
	let id = `collectible-${idCounter}`;
	let position = getRandomPosition();
	let possibleValues = [1, 5, 10];
	let randomIndex = Math.floor(Math.random() * possibleValues.length);
	collectibles[id] = new Collectible({
		id: id,
		x: position.x,
		y: position.y,
		width: 32,
		height: 32,
		value: possibleValues[randomIndex],
	});
}

// Function to draw a collectible
function drawCollectible(collectible) {
	let img;
	switch (collectible.value) {
		case 1:
			img = collectibleImageCopper;
			break;
		case 5:
			img = collectibleImageIron;
			break;
		case 10:
			img = collectibleImageGold;
			break;
		default:
			img = collectibleImageCopper;
			break; // Default to copper if value is invalid
	}

	context.drawImage(
		img,
		collectible.x,
		collectible.y,
		collectible.width,
		collectible.height
	);
}

// ----------------------------------------------------------------
// Player logic
// ----------------------------------------------------------------

// Check for collisions between players and collectibles
function checkPlayerCollectibleCollision() {
	for (let playerId in players) {
		let player = players[playerId];
		if (player.handleCollisions(collectibles, socket)) {
			generateCollectible(); // Make a new collectible
			socket.emit("updateCollectibles", collectibles); // Update all clients with new collectibles
		}
	}
}

// Handle player movement
let movement = {
	left: false,
	right: false,
	up: false,
	down: false,
};

const movePlayer = (directions) => {
	let player = players[currentPlayerId];
	if (!player) return;

	player.move(directions, canvasWidth, canvasHeight);

	// Update all players with the new player position
	socket.emit("updatePlayers", players);
};

// Update movement state based on key presses
window.addEventListener("keydown", (event) => {
	switch (event.key) {
		case "ArrowLeft":
		case "a":
			movement.left = true;
			break;
		case "ArrowRight":
		case "d":
			movement.right = true;
			break;
		case "ArrowUp":
		case "w":
			movement.up = true;
			break;
		case "ArrowDown":
		case "s":
			movement.down = true;
			break;
	}
});

window.addEventListener("keyup", (event) => {
	switch (event.key) {
		case "ArrowLeft":
		case "a":
			movement.left = false;
			break;
		case "ArrowRight":
		case "d":
			movement.right = false;
			break;
		case "ArrowUp":
		case "w":
			movement.up = false;
			break;
		case "ArrowDown":
		case "s":
			movement.down = false;
			break;
	}
});

// ----------------------------------------------------------------
// Socket.io Logic
// ----------------------------------------------------------------

socket.emit("isGameInitialized");

socket.on("generateCanvas", () => {
	clearCanvas();
	//Generate collectibles
	for (let i = 0; i < 10; i++) {
		generateCollectible();
	}
	// Draw all collectibles
	for (let id in collectibles) {
		drawCollectible(collectibles[id]);
	}
	socket.emit("loadCollectibles", collectibles);
});

// Listen for the connection of a new player
socket.on("connect", () => {
	// Create the player using the client-side Player constructor
	const newPlayer = new Player({
		id: socket.id,
		x: getRandomPosition().x,
		y: getRandomPosition().y,
		score: 0,
		width: 32,
		height: 32,
	});

	// Send the player data to the server
	socket.emit("newPlayer", newPlayer);
});

socket.on("deletePlayer", (id) => {
	delete players[id];
});

// Listen for player updates from the server
socket.on("updatePlayers", (updatedPlayers) => {
	players = {};
	for (let id in updatedPlayers) {
		players[id] = new Player(updatedPlayers[id]); // Update local players object
	}
	if (!currentPlayerId) {
		// Identify current player based on first connection
		currentPlayerId = socket.id;
	}
});

// Listen for collectible updates from the server
socket.on("updateCollectibles", (updatedCollectibles) => {
	for (let id in updatedCollectibles) {
		collectibles[id] = new Collectible(updatedCollectibles[id]);
	}
});

// Start the game loop
updateGameCanvas();
