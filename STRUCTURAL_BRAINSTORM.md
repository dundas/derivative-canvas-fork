# Derivative Canvas: Current State & Structural Brainstorm

## Current State

### What We Have
- **Forked Excalidraw Repository**: https://github.com/dundas/derivative-canvas-fork
- **Complete Excalidraw source code** with all original functionality intact
- **Custom modifications applied**:
  - Derivative Canvas framework package (`framework/derivative-canvas/`)
  - Disabled URL embedding whitelist (allows all domains including helloconvo.com)
  - Plugin architecture with AI chat, auth adapters, storage adapters
  - HelloConvo integration example

### Current Directory Structure
```
derivative-canvas/
├── packages/
│   ├── excalidraw/           # Core Excalidraw (original)
│   ├── element/              # Modified (whitelist disabled)
│   └── utils/                # Excalidraw utilities
├── framework/
│   └── derivative-canvas/    # Our framework package (moved from packages/)
│       ├── core/             # Provider, PluginManager, types
│       ├── layouts/          # Canvas, hybrid, minimal layouts
│       ├── plugins/          # AI chat example plugin
│       ├── utils/            # Auth/storage adapters
│       └── examples/         # HelloConvo integration guide
└── [all other Excalidraw files intact]
```

### Current Functionality
- **Framework Features**: Plugin system, NextAuth integration, MongoDB storage, flexible layouts
- **Canvas-First Vision**: "AI should be ever-present, not a destination" - framework enables drag/drop/collaborate with AI agents
- **Real Workflow**: Import Shopify → summon AI agents → collaborate → export to Facebook Ads

## Structural Considerations & Options

### Problems with Current Structure
1. **Mixing Concerns**: Our framework sits alongside Excalidraw's internal packages
2. **Update Conflicts**: Merging upstream Excalidraw updates could conflict with our framework
3. **Unclear Ownership**: Difficult to distinguish our code from Excalidraw's original code
4. **Build Complexity**: Excalidraw's build system not optimized for our framework additions
5. **Maintenance Overhead**: Framework changes mixed with Excalidraw core changes in git history

### Option 1: Separate Framework Repository ⭐ (Recommended)
```
// Repository 1: Clean Excalidraw Fork
derivative-canvas-core/
└── [Pure Excalidraw fork with minimal modifications only]
    ├── Disabled URL whitelist
    ├── Essential customizations only
    └── Easy to merge upstream updates

// Repository 2: Framework Package
@derivative-canvas/framework/
├── packages/
│   └── derivative-canvas/
├── examples/
│   └── integrations/
└── docs/
```

**Benefits:**
- Clean separation of concerns
- Easy upstream updates to Excalidraw
- Framework can evolve independently
- Clear ownership and versioning
- Can publish framework as npm package

**Drawbacks:**
- Two repositories to maintain
- More complex initial setup

### Option 2: Clean Separation Within Fork (ADOPTED - Phase 1)
```
derivative-canvas/
├── packages/                # Original Excalidraw packages (untouched)
│   ├── excalidraw/
│   ├── element/            # Only essential modifications
│   └── utils/
├── framework/              # Our additions clearly separated
│   └── derivative-canvas/
├── examples/
│   └── integrations/
└── docs/
    └── framework/
```

**Benefits:**
- Everything in one repository
- Clear separation of our code vs Excalidraw
- Single clone/setup process

**Drawbacks:**
- Still potential for update conflicts
- Framework tied to Excalidraw versioning

### Option 3: Wrapper Repository with Submodules
```
derivative-canvas/
├── excalidraw/             # Git submodule pointing to our fork
├── framework/              # Our framework that wraps Excalidraw
├── examples/
└── apps/                   # Example applications
    └── helloconvo-integration/
```

**Benefits:**
- Complete decoupling
- Framework can work with different Excalidraw versions
- Example apps included

**Drawbacks:**
- Git submodule complexity
- More moving parts

## Questions for Engineering Review

1. **Repository Strategy**: Should we prioritize clean separation (Option 1) or convenience (Option 2)?

2. **Framework Scope**: Should our framework be:
   - Excalidraw-specific wrapper
   - Generic canvas framework that could work with other canvas libraries
   - Hybrid approach

3. **Update Strategy**: How do we plan to handle Excalidraw upstream updates?
   - Merge regularly
   - Cherry-pick specific features
   - Fork-and-forget approach

4. **Distribution**: How should the framework be consumed?
   - NPM package (`@derivative-canvas/core`)
   - Direct git dependency
   - Copy-paste integration

5. **Versioning**: Should framework versions be:
   - Tied to Excalidraw versions
   - Independent semantic versioning
   - Date-based versioning

## Immediate Next Steps

Based on engineering feedback, we should:
1. ✅ **Restructure** the repository according to chosen option (Phase 1 started: framework moved to `framework/derivative-canvas/` and workspaces updated)
2. **Define** clear boundaries between Excalidraw modifications and framework code
3. **Create** development/build workflow documentation
4. **Plan** upstream merge strategy
5. **Document** integration patterns for new projects

## Context: HelloConvo Integration Goal
The framework's primary purpose is enabling **canvas-first UI** for HelloConvo, replacing traditional SaaS interfaces with collaborative canvas experiences where AI agents are summoned, collaborate, and ship results to external platforms.