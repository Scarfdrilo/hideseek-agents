/**
 * Example: Simple Maze Generator
 */

const SimpleMazeGenerator = require('./simple-maze');

// Generate a 21x21 maze (odd dimensions work best with recursive backtracking)
const generator = new SimpleMazeGenerator(21, 21, 'medium');
const maze = generator.generate(42069); // Fun seed

console.log('🎮 HideSeek Agents - Procedural Maze (Simplified)\n');
console.log(generator.toASCII());

console.log('\n📊 Maze Stats:');
console.log(`Size: ${generator.width}x${generator.height}`);
console.log(`Difficulty: ${generator.difficulty}`);
console.log(`Hiding Spots: ${generator.hidingSpots.length}`);

console.log('\n📍 Hiding Spot Locations:');
generator.hidingSpots.forEach(spot => {
  console.log(`  Spot ${spot.id}: (${spot.x}, ${spot.y})`);
});

// Export
const fs = require('fs');
fs.writeFileSync(
  __dirname + '/maze-playable.json',
  JSON.stringify(generator.toJSON(), null, 2)
);

console.log('\n✅ Playable maze exported to maze-playable.json');
console.log('\nLegend:');
console.log('  # = Wall');
console.log('  . = Floor (walkable)');
console.log('  H = Hiding Spot');
console.log('  S = Start Position');
