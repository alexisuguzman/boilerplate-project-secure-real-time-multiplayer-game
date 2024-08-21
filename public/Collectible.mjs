class Collectible {
	constructor({ x, y, value, id, width, height }) {
		this.id = id; // Unique identifier for the collectible
		this.x = x; // X coordinate of the collectible
		this.y = y; // Y coordinate of the collectible
		this.value = value; // Value of the collectible (could be points, etc.)

		// You might want to add width and height to define the size of the collectible
		this.width = width; // Default width (can be changed based on game logic)
		this.height = height; // Default height (can be changed based on game logic)
	}
}

try {
	module.exports = Collectible;
} catch (e) {}

export default Collectible;
