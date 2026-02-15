import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  worlds: defineTable({
    // Agent identifier (lowercase, no spaces)
    agentKey: v.string(),
    // Display name
    name: v.string(),
    // Theme (neon, candy, forest, swamp, cyber)
    theme: v.string(),
    // World size
    size: v.number(),
    // Zones data (array of zone objects)
    zones: v.array(v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      centerX: v.number(),
      centerY: v.number(),
      radius: v.number(),
      color: v.string(),
      description: v.string(),
      decorations: v.array(v.any()),
    })),
    // Paths between zones
    paths: v.array(v.object({
      x: v.number(),
      y: v.number(),
    })),
    // Center hub location
    centerHub: v.object({
      x: v.number(),
      y: v.number(),
    }),
    // Decorations
    decorations: v.array(v.any()),
    // Lore text
    lore: v.string(),
    // Ambient particles type
    ambientParticles: v.optional(v.string()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_agentKey", ["agentKey"]),
});
