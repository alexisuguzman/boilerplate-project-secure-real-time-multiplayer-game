require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const expect = require("chai");
const socket = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");

const fccTestingRoutes = require("./routes/fcctesting.js");
const runner = require("./test-runner.js");
const path = require("path");

const app = express();

// Security configurations
app.use(
	helmet({
		contentSecurityPolicy: false,
		noSniff: true,
		xssFilter: true,
		hidePoweredBy: { setTo: "PHP 7.4.3" },
	})
);

// Prevent caching
app.use((req, res, next) => {
	res.set(
		"Cache-Control",
		"no-store, no-cache, must-revalidate, proxy-revalidate"
	);
	res.set("Pragma", "no-cache");
	res.set("Expires", "0");
	res.set("Surrogate-Control", "no-store");
	next();
});

// Existing middleware
app.use("/public", express.static(process.cwd() + "/public"));
app.use(express.static(path.join(__dirname, "public")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ origin: "*" }));

app.route("/").get(function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

fccTestingRoutes(app);

app.use(function (req, res, next) {
	res.status(404).type("text").send("Not Found");
});

const portNum = process.env.PORT || 3000;

// Set up server and tests
const server = app.listen(portNum, () => {
	console.log(`Listening on port ${portNum}`);
	if (process.env.NODE_ENV === "test") {
		console.log("Running Tests...");
		setTimeout(function () {
			try {
				runner.run();
			} catch (error) {
				console.log("Tests are not valid:");
				console.error(error);
			}
		}, 1500);
	}
});

// Set up Socket.io for real-time communication
const io = socket(server);

let players = {}; // Store players on server
let collectibles = {}; // Store collectibles on server
let gameInitialized = false; // Tracks if the game has been initialized

io.on("connection", (socket) => {
	console.log("New player connected:", socket.id);
	console.log("is any player online: " + gameInitialized);

	// Emit if game has been initialized
	socket.on("isGameInitialized", () => {
		if (!gameInitialized) {
			gameInitialized = true;
			// Initialize canvas and collectibles when the first player connects
			io.emit("generateCanvas");
		}
		return;
	});

	socket.on("loadCollectibles", (generatedCollectibles) => {
		collectibles = generatedCollectibles;
		io.emit("updateCollectibles", collectibles); // Broadcast updated state to all clients
	});

	// Handle the new player data received from the client
	socket.on("newPlayer", (playerData) => {
		// Add the new player to the server's players object
		players[socket.id] = playerData;

		// Emit the updated players and collectibles list to all clients
		io.emit("updatePlayers", players);
		io.emit("updateCollectibles", collectibles);
	});

	// Handle player updates from clients
	socket.on("updatePlayers", (updatedPlayers) => {
		players = updatedPlayers; // Update server's players state
		io.emit("updatePlayers", players); // Broadcast updated state to all clients
	});

	// Handle collectible updates from clients
	socket.on("updateCollectibles", (updatedCollectibles) => {
		collectibles = {}; // Clear existing collectibles
		for (let id in updatedCollectibles) {
			collectibles[id] = updatedCollectibles[id];
		}
	});

	// Handle player disconnect
	socket.on("disconnect", () => {
		console.log("Player disconnected:", socket.id);
		delete players[socket.id]; // Remove player from the game
		io.emit("deletePlayer", socket.id); // Notify all clients to remove this player
	});
});

module.exports = app;
