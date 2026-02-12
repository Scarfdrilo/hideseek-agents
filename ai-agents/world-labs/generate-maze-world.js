#!/usr/bin/env node
/**
 * Generate HideSeek maze world using World Labs API
 * 
 * Usage:
 *   node generate-maze-world.js "custom prompt"
 *   node generate-maze-world.js --preset dungeon_basic
 *   node generate-maze-world.js --image ./my-reference.jpg
 */

const { WorldLabsClient } = require('./client');
const prompts = require('./examples/maze-prompts.json');
const fs = require('fs');
const path = require('path');

const API_KEY = process.env.WORLDLABS_API_KEY;

async function main() {
  if (!API_KEY) {
    console.error('❌ Set WORLDLABS_API_KEY environment variable');
    console.error('   Get your key at: https://platform.worldlabs.ai');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  let options = {
    model: 'Marble 0.1-plus'
  };

  // Parse arguments
  if (args.includes('--preset')) {
    const presetIndex = args.indexOf('--preset');
    const presetId = args[presetIndex + 1];
    const preset = prompts.mazePrompts.find(p => p.id === presetId);
    
    if (!preset) {
      console.error(`❌ Unknown preset: ${presetId}`);
      console.error('Available presets:');
      prompts.mazePrompts.forEach(p => console.log(`  - ${p.id}: ${p.name}`));
      process.exit(1);
    }
    
    options.prompt = preset.prompt;
    console.log(`🎮 Using preset: ${preset.name}`);
  } else if (args.includes('--image')) {
    const imageIndex = args.indexOf('--image');
    const imagePath = args[imageIndex + 1];
    
    if (imagePath.startsWith('http')) {
      options.imageUrl = imagePath;
    } else {
      // For local files, we'd need to upload first (not implemented yet)
      console.error('❌ Local file upload not yet implemented');
      console.error('   Use a public URL instead: --image https://...');
      process.exit(1);
    }
    console.log(`🖼️ Using image: ${imagePath}`);
  } else if (args.length > 0 && !args[0].startsWith('--')) {
    options.prompt = args.join(' ');
    console.log(`✏️ Custom prompt: ${options.prompt}`);
  } else {
    // Default prompt
    options.prompt = prompts.mazePrompts[0].prompt;
    console.log(`🎮 Using default preset: ${prompts.mazePrompts[0].name}`);
  }

  // Mini model flag
  if (args.includes('--mini')) {
    options.model = 'Marble 0.1-mini';
    console.log('⚡ Using faster mini model');
  }

  console.log('');
  console.log('🌍 Starting World Labs generation...');
  console.log(`   Model: ${options.model}`);
  console.log('');

  const client = new WorldLabsClient(API_KEY);
  
  try {
    const startTime = Date.now();
    
    const world = await client.generate(options);
    
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    
    console.log('');
    console.log('✅ World generated successfully!');
    console.log(`   Time: ${elapsed}s`);
    console.log(`   World ID: ${world.id || world.world_id}`);
    console.log('');
    
    // Save world data
    const outputDir = path.join(__dirname, 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(outputDir, `world-${timestamp}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(world, null, 2));
    console.log(`💾 Saved to: ${outputFile}`);
    
    // Show download URLs
    if (world.downloads || world.assets) {
      console.log('');
      console.log('📥 Download URLs:');
      const downloads = world.downloads || world.assets;
      Object.entries(downloads).forEach(([format, url]) => {
        console.log(`   ${format}: ${url}`);
      });
    }
    
  } catch (error) {
    console.error('');
    console.error(`❌ Generation failed: ${error.message}`);
    process.exit(1);
  }
}

// Show presets if --list flag
if (process.argv.includes('--list')) {
  console.log('🎮 Available Presets:\n');
  prompts.mazePrompts.forEach(p => {
    console.log(`  ${p.id}`);
    console.log(`    Name: ${p.name}`);
    console.log(`    Tags: ${p.tags.join(', ')}`);
    console.log(`    Prompt: "${p.prompt.substring(0, 60)}..."`);
    console.log('');
  });
  process.exit(0);
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🌍 HideSeek World Generator

Generate AI-powered 3D maze worlds using World Labs API.

USAGE:
  node generate-maze-world.js [options] [prompt]

OPTIONS:
  --preset <id>    Use a predefined maze style
  --image <url>    Generate from reference image
  --mini           Use faster (cheaper) mini model
  --list           Show available presets
  --help           Show this help

EXAMPLES:
  node generate-maze-world.js "cyberpunk neon maze"
  node generate-maze-world.js --preset crystal_cave
  node generate-maze-world.js --image https://example.com/ref.jpg
  node generate-maze-world.js --preset scifi_station --mini

ENVIRONMENT:
  WORLDLABS_API_KEY    Your World Labs API key (required)
                       Get one at: https://platform.worldlabs.ai
`);
  process.exit(0);
}

main();
