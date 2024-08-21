class Player {
	constructor({ x, y, score = 0, id, width = 20, height = 20 }) {
		this.id = id; // Unique identifier for the player
		this.x = x; // X coordinate of the player
		this.y = y; // Y coordinate of the player
		this.score = score; // Player's score, default is 0

		this.width = width; // Default width of the player
		this.height = height; // Default height of the player
	}

	// Method to move the player
	movePlayer(dir, speed) {
		switch (dir) {
			case "up":
				this.y -= speed;
				break;
			case "down":
				this.y += speed;
				break;
			case "left":
				this.x -= speed;
				break;
			case "right":
				this.x += speed;
				break;
		}
	}

	// Method to check collision with a collectible item
	collision(item) {
		// Simple axis-aligned bounding box (AABB) collision detection
		return (
			this.x < item.x + item.width &&
			this.x + this.width > item.x &&
			this.y < item.y + item.height &&
			this.y + this.height > item.y
		);
	}

	// Method to calculate the player's rank
	calculateRank(arr) {
		// Sort players by score in descending order
		arr.sort((a, b) => b.score - a.score);

		// Find the player's rank
		const rank = arr.findIndex((player) => player.id === this.id) + 1;
		return `Rank: ${rank}/${arr.length}`;
	}
}

export default Player;
