# Amoeba CLI Commands Reference

Complete command reference for the evolutionary Amoeba system.

---

## Core AI Agent Commands

### Basic Operations
```bash
# Execute simple modification
amoeba ai "add user avatar upload"

# Complex multi-agent task
amoeba ai "build complete analytics system"

# Simulate without applying
amoeba ai --simulate "rewrite auth system"

# Explain how something works
amoeba ai --explain "content generation flow"
```

### Agent Management
```bash
# List running agents
amoeba agents list

# Spawn specific agent
amoeba agents spawn --type backend --task "optimize database queries"

# Kill agent
amoeba agents kill <agent-id>

# Kill all agents
amoeba agents kill-all
```

---

## Evolution & Branching

### Create New Branch (Specialize)
```bash
# Create specialized Amoeba
amoeba evolve --branch blog --from main
amoeba evolve --branch ecommerce --from main
amoeba evolve --branch crm --from main

# Create sub-specialization
amoeba evolve --branch blog-tech --from blog
```

### Branch Management
```bash
# List all branches
amoeba branches list
amoeba tree                    # Visual tree

# Switch branch
amoeba checkout blog

# Show current branch
amoeba branch

# Compare branches
amoeba diff --branches blog ecommerce

# Show lineage
amoeba lineage blog
```

---

## Knowledge System

### Search & Query
```bash
# Search for patterns
amoeba knowledge search "authentication"
amoeba knowledge search "payment processing"

# Show pattern details
amoeba knowledge show auth-pattern

# Find similar modifications
amoeba knowledge similar "add user roles"

# List all patterns
amoeba knowledge list

# List patterns by tag
amoeba knowledge list --tag security
```

### Pattern Management
```bash
# Rate a modification
amoeba knowledge rate mod-123 --rating 5

# Share pattern with parent
amoeba knowledge share redis-caching --to core

# Share pattern with sibling
amoeba knowledge share comment-system --to blog-tech

# Export pattern
amoeba knowledge export auth-pattern --file auth.json

# Import pattern
amoeba knowledge import --file payment.json
```

---

## Traits System

### List & Inspect
```bash
# List all traits
amoeba traits list

# Show inherited traits
amoeba traits inherited

# Show learned traits
amoeba traits learned

# Show trait details
amoeba traits show seo-optimization
```

### Trait Operations
```bash
# Add trait to branch
amoeba traits add comment-system

# Remove trait
amoeba traits remove old-feature

# Share trait with parent
amoeba traits share seo-optimization --to core
```

---

## Modification History

### View History
```bash
# Show recent modifications
amoeba history

# Show last N modifications
amoeba history --last 10

# Show modifications by date
amoeba history --date 2024-01-15

# Show modifications by agent
amoeba history --agent backend

# Show successful modifications only
amoeba history --success-only
```

### Rollback
```bash
# Rollback last modification
amoeba rollback

# Rollback specific modification
amoeba rollback mod-123

# Rollback to date
amoeba rollback --to 2024-01-15
```

---

## Statistics & Analytics

### Branch Statistics
```bash
# Show branch stats
amoeba stats

# Compare success rates
amoeba stats --compare blog ecommerce

# Show learning rate
amoeba stats --learning

# Show pattern reuse rate
amoeba stats --patterns
```

### Performance Metrics
```bash
# Show time savings from patterns
amoeba metrics --savings

# Show most reused patterns
amoeba metrics --patterns

# Show agent performance
amoeba metrics --agents
```

---

## Cross-Pollination

### Share Successful Adaptations
```bash
# Share pattern with parent
amoeba share redis-caching --to core

# Share with specific branch
amoeba share comment-system --to blog-tech

# Share with all siblings
amoeba share payment-flow --to-siblings

# Auto-share successful patterns
amoeba share --auto-threshold 90
```

---

## Configuration

### Agent Settings
```bash
# Configure agent behavior
amoeba config set agent.require_approval true
amoeba config set agent.auto_commit true
amoeba config set agent.max_changes_per_session 10

# View current config
amoeba config show

# Reset to defaults
amoeba config reset
```

### Knowledge Settings
```bash
# Set learning threshold
amoeba config set knowledge.learn_threshold 80

# Set pattern sharing threshold
amoeba config set knowledge.share_threshold 90

# Enable auto-learning
amoeba config set knowledge.auto_learn true
```

---

## Advanced Operations

### Self-Modification
```bash
# Improve AI agent itself
amoeba self-improve "better natural language understanding"

# Optimize AI performance
amoeba self-optimize --target speed

# Update AI rules
amoeba self-modify --rule "routes: allow 500 lines"
```

### Architecture Evolution
```bash
# Propose architectural change
amoeba architecture propose "microservices split"

# Apply architecture change
amoeba architecture apply --plan arch-plan-123

# Revert architecture change
amoeba architecture revert arch-plan-123
```

### Ecosystem Management
```bash
# Sync knowledge across branches
amoeba sync --all

# Propagate pattern to all branches
amoeba propagate redis-caching --to-all

# Merge branch back to parent
amoeba merge blog --into core

# Prune inactive branches
amoeba prune --inactive 90d
```

---

## Examples

### Complete Workflow

```bash
# 1. Create specialized Amoeba for blog
amoeba evolve --branch blog --from main

# 2. Switch to blog branch
amoeba checkout blog

# 3. Add feature
amoeba ai "add comment system with moderation"

# 4. Rate the modification
amoeba knowledge rate mod-latest --rating 5

# 5. Share successful pattern
amoeba knowledge share comment-system --to core

# 6. View learning
amoeba stats --patterns

# 7. Create sub-specialization
amoeba evolve --branch blog-tech --from blog

# 8. Switch to tech blog
amoeba checkout blog-tech

# 9. Add tech-specific features
amoeba ai "add code syntax highlighting"

# 10. View full evolutionary tree
amoeba tree
```

### Knowledge Reuse

```bash
# First time (slow, learning)
amoeba ai "add authentication"
# Takes: 15 seconds (learning new pattern)

# Second time (fast, reusing)
amoeba ai "add authentication to admin panel"
# AI: Found pattern "auth-flow" (95% success)
# Takes: 2 seconds (applied existing pattern)

# Pattern has evolved:
amoeba knowledge show auth-flow
# Pattern: auth-flow
# Created: 2024-01-15
# Reused: 8 times
# Success rate: 96%
# Time savings: 104 seconds total
```

---

## Help & Documentation

```bash
# General help
amoeba help

# Command-specific help
amoeba help ai
amoeba help evolve
amoeba help knowledge

# Show examples
amoeba examples

# Interactive tutorial
amoeba tutorial

# Version info
amoeba version
```

---

## Keyboard Shortcuts (Terminal Mode)

```
Ctrl+A   - AI command mode
Ctrl+K   - Knowledge search
Ctrl+B   - Branch switch
Ctrl+H   - Show history
Ctrl+T   - Show tree
Ctrl+S   - Show stats
Ctrl+Z   - Rollback last
Ctrl+Q   - Quit
```

---

## Configuration Files

### User Config: `~/.amoebarc`
```json
{
  "default_branch": "main",
  "auto_commit": true,
  "require_approval": true,
  "learning_threshold": 80,
  "share_threshold": 90
}
```

### Branch Config: `.amoeba/config.json`
```json
{
  "branch": "blog",
  "parent": "main",
  "auto_learn": true,
  "auto_share": false,
  "pattern_threshold": 85
}
```

---

**The CLI is the interface to the evolutionary organism. Every command teaches it. Every branch specializes it. Every pattern evolves it.** 🦠




