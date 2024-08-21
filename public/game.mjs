import Player from "./Player.mjs";
import Collectible from "./Collectible.mjs";

const socket = io();
const canvas = document.getElementById("game-window");
const context = canvas.getContext("2d");

let players = {}; // Store connected players
let collectibles = {}; // Store collectibles
let currentPlayerId = null; // Track the current player's ID

// ----------------------------------------------------------------
// Canvas related functions
// ----------------------------------------------------------------

// Canvas dimensions
const canvasWidth = 640;
const canvasHeight = 480;

// Function to clear the canvas
function clearCanvas() {
	context.clearRect(0, 0, canvas.width, canvas.height);
	console.log("Canvas cleared");
}

// Function to update the game canvas
function updateGameCanvas() {
	clearCanvas();

	// Draw all players
	for (let id in players) {
		drawPlayer(players[id]);
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
		x: Math.floor(Math.random() * (canvasWidth - 20)), // Ensure collectible is within bounds
		y: Math.floor(Math.random() * (canvasHeight - 20)), // Ensure collectible is within bounds
	};
}

// Function to check if two rectangles collide
function checkCollision(rect1, rect2) {
	return (
		rect1.x < rect2.x + rect2.width &&
		rect1.x + rect1.width > rect2.x &&
		rect1.y < rect2.y + rect2.height &&
		rect1.y + rect1.height > rect2.y
	);
}

// Function to send movement updates to the server
function sendMovementUpdate() {
	console.log("sendMovementUpdate");
	movePlayer(movement);
}

// Set update speeds of the game
// setInterval(() => {
// 	updateGameCanvas();
// }, 100);
setInterval(() => {
	sendMovementUpdate();
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
	collectibles[id] = new Collectible({
		id: id,
		x: position.x,
		y: position.y,
		width: 32,
		height: 32,
		value: 1,
	});
}

let collectibleImage = new Image();
collectibleImage.src = "./assets/goldIngot.png";
collectibleImage.onload = () => {}; // Image ready

// Function to draw a collectible
function drawCollectible(collectible) {
	context.drawImage(
		collectibleImage,
		collectible.x,
		collectible.y,
		collectible.width,
		collectible.height
	);
}

// ----------------------------------------------------------------
// Player related functions
// ----------------------------------------------------------------

// Pre load images for players
let playerImage = new Image();
playerImage.src = "./assets/mainPlayer.png";
playerImage.onload = () => {}; // Image ready

let opponentImage = new Image();
opponentImage.src = "./assets/opponentPlayer.png";
opponentImage.onload = () => {}; // Image ready

function drawPlayer(player) {
	let img = player.id === currentPlayerId ? playerImage : opponentImage;
	context.drawImage(img, player.x, player.y, player.width, player.height); // Draw image
}

// Check for collisions between players and collectibles
function checkPlayerCollectibleCollision() {
	for (let playerId in players) {
		let player = players[playerId];
		for (let collectibleId in collectibles) {
			let collectible = collectibles[collectibleId];
			if (checkCollision(player, collectible)) {
				console.log("collectible collision detected");
				player.score += collectible.value;
				delete collectibles[collectibleId]; // Remove the collectible
				generateCollectible();
				socket.emit("updateScore", player.score); // Update player's score
				socket.emit("updateCollectibles", collectibles); // Update all clients with new collectibles
			}
		}
	}
}

// Handle player movement
const movePlayer = (directions) => {
	const player = players[currentPlayerId];
	const speed = 5; // Adjust speed as needed
	if (!player) return;

	// Apply movement based on active directions
	if (directions.left) player.x -= speed;
	if (directions.right) player.x += speed;
	if (directions.up) player.y -= speed;
	if (directions.down) player.y += speed;

	// Ensure player stays within canvas bounds
	player.x = Math.max(0, Math.min(canvasWidth - player.width, player.x));
	player.y = Math.max(0, Math.min(canvasHeight - player.height, player.y));

	// Check for collisions with collectibles
	checkPlayerCollectibleCollision();

	// Update all players with the new player position
	socket.emit("updatePlayers", players);
};

let movement = {
	left: false,
	right: false,
	up: false,
	down: false,
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
	console.log("Creating player...");
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
	console.log("deleting Player");
	delete players[id];
});

// Listen for player updates from the server
socket.on("updatePlayers", (updatedPlayers) => {
	console.log("Updating players");
	players = updatedPlayers; // Update local players object
	if (!currentPlayerId) {
		// Identify current player based on first connection
		currentPlayerId = socket.id;
	}
	checkPlayerCollectibleCollision(); // Check for collisions after updating players
});

// Listen for collectible updates from the server
socket.on("updateCollectibles", (updatedCollectibles) => {
	collectibles = updatedCollectibles;
	checkPlayerCollectibleCollision(); // Check for collisions after updating collectibles
});

// Listen for player's score update from the server
socket.on("updateScore", (score) => {
	console.log(`Your score: ${score}`);
});

// Start the game loop
updateGameCanvas();
