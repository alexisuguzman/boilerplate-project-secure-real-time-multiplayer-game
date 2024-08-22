class Player {
	constructor({ x, y, score = 0, id, width = 20, height = 20 }) {
		this.id = id; // Unique identifier for the player
		this.x = x; // X coordinate of the player
		this.y = y; // Y coordinate of the player
		this.score = score; // Player's score, default is 0
		this.width = width; // Default width of the player
		this.height = height; // Default height of the player
		this.speed = 5; // Default speed of the player
	}

	drawPlayer(img, context) {
		context.drawImage(img, this.x, this.y, this.width, this.height); // Draw image
	}
	move(directions, canvasWidth, canvasHeight) {
		// Apply movement based on active directions
		if (directions.left) this.x -= this.speed;
		if (directions.right) this.x += this.speed;
		if (directions.up) this.y -= this.speed;
		if (directions.down) this.y += this.speed;

		// Ensure player stays within canvas bounds
		this.x = Math.max(0, Math.min(canvasWidth - this.width, this.x));
		this.y = Math.max(0, Math.min(canvasHeight - this.height, this.y));
	}

	// Method to check collision with a collectible item
	checkCollision(collectible) {
		return (
			this.x < collectible.x + collectible.width &&
			this.x + this.width > collectible.x &&
			this.y < collectible.y + collectible.height &&
			this.y + this.height > collectible.y
		);
	}

	// Method to handle collision detection

	handleCollisions(collectibles) {
		for (let collectibleId in collectibles) {
			let collected = false;
			let collectible = collectibles[collectibleId];
			if (this.checkCollision(collectible)) {
				this.score += collectible.value;
				delete collectibles[collectibleId]; // Remove the collectible
				collected = true;
				return collected;
			}
		}
	}

	// Method to calculate the player's rank
	calculateRank(players) {
		console.log("Calculating rank...");
		console.log(players);
		let playersArray = Object.values(players);
		console.log(playersArray);
		// Sort players by score in descending order
		playersArray.sort((a, b) => b.score - a.score);

		console.log("Sorted array:", playersArray);
		// Find the player's rank
		const rank = playersArray.findIndex((player) => player.id === this.id) + 1;
		console.log("Rank:", rank);
		console.log("Returning:", `Rank: ${rank}/${playersArray.length}`);
		return `Rank: ${rank}/${playersArray.length}`;
	}
}

export default Player;
