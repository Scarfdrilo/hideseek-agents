/**
 * Example usage of MazeGenerator
 */

const MazeGenerator = require('./maze-generator');

// Generate a medium difficulty maze
const generator = new MazeGenerator(25, 25, 'medium');
const maze = generator.generate(12345); // Seed for reproducibility

console.log('🎮 HideSeek Agents - Procedural Maze\n');
console.log(generator.toASCII());

console.log('\n📊 Maze Stats:');
console.log(`Size: ${generator.width}x${generator.height}`);
console.log(`Difficulty: ${generator.difficulty}`);
console.log(`Hiding Spots: ${generator.hidingSpots.length}`);

console.log('\n📍 Hiding Spot Locations:');
generator.hidingSpots.forEach(spot => {
  console.log(`  Spot ${spot.id}: (${spot.x}, ${spot.y})`);
});

// Export as JSON
const fs = require('fs');
fs.writeFileSync(
  __dirname + '/example-maze.json',
  JSON.stringify(generator.toJSON(), null, 2)
);

console.log('\n✅ Maze exported to example-maze.json');
