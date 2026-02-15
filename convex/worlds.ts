import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get a world by agentKey
export const getWorld = query({
  args: { agentKey: v.string() },
  handler: async (ctx, args) => {
    const world = await ctx.db
      .query("worlds")
      .withIndex("by_agentKey", (q) => q.eq("agentKey", args.agentKey.toLowerCase()))
      .first();
    return world;
  },
});

// List all worlds
export const listWorlds = query({
  args: {},
  handler: async (ctx) => {
    const worlds = await ctx.db.query("worlds").collect();
    return worlds.map((w) => ({
      agentKey: w.agentKey,
      name: w.name,
      theme: w.theme,
      zonesCount: w.zones.length,
      createdAt: w.createdAt,
    }));
  },
});

// Create or update a world
export const upsertWorld = mutation({
  args: {
    agentKey: v.string(),
    name: v.string(),
    theme: v.string(),
    size: v.number(),
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
    paths: v.array(v.object({
      x: v.number(),
      y: v.number(),
    })),
    centerHub: v.object({
      x: v.number(),
      y: v.number(),
    }),
    decorations: v.array(v.any()),
    lore: v.string(),
    ambientParticles: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agentKey = args.agentKey.toLowerCase();
    const existing = await ctx.db
      .query("worlds")
      .withIndex("by_agentKey", (q) => q.eq("agentKey", agentKey))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing world
      await ctx.db.patch(existing._id, {
        ...args,
        agentKey,
        updatedAt: now,
      });
      return { action: "updated", agentKey };
    } else {
      // Create new world
      await ctx.db.insert("worlds", {
        ...args,
        agentKey,
        createdAt: now,
        updatedAt: now,
      });
      return { action: "created", agentKey };
    }
  },
});

// Delete a world
export const deleteWorld = mutation({
  args: { agentKey: v.string() },
  handler: async (ctx, args) => {
    const world = await ctx.db
      .query("worlds")
      .withIndex("by_agentKey", (q) => q.eq("agentKey", args.agentKey.toLowerCase()))
      .first();

    if (world) {
      await ctx.db.delete(world._id);
      return { deleted: true };
    }
    return { deleted: false };
  },
});
