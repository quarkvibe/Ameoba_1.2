# Knowledge Graph System

This directory contains the organism's **genetic memory** - everything it learns from every modification.

## Structure

```
knowledge/
├── patterns/           # Reusable code patterns (like genes)
├── traits/             # Inheritable characteristics
├── modifications/      # Complete history of changes
├── lineage/            # Branch relationships
├── db.json            # Indexed knowledge database
└── vectors.json       # Semantic search index
```

## How It Works

### 1. Every Modification is Recorded

When the AI makes a change:
```typescript
{
  "id": "mod-20240115-143201",
  "command": "add comment system",
  "files": ["routes/comments.ts", "services/commentService.ts"],
  "success": true,
  "rating": 5/5,
  "time": "18s"
}
```

### 2. Patterns are Extracted

Successful modifications become reusable patterns:
```typescript
{
  "pattern_id": "comment-system-pattern",
  "success_rate": 95%,
  "reused": 5 times,
  "files_template": [...],
  "code_template": {...}
}
```

### 3. Patterns are Indexed

Semantic search finds similar requests:
```
User: "add comment system"
AI: Found pattern "comment-system-pattern" (95% success)
    Apply in 2s? [y/n]
```

### 4. Knowledge is Inherited

Child branches inherit parent knowledge:
```
CORE → learned "auth-pattern"
  ↓
BLOG → inherits "auth-pattern"
  ↓
BLOG-TECH → inherits "auth-pattern"
```

## Knowledge Commands

```bash
# Search patterns
amoeba-knowledge search "authentication"

# Show pattern
amoeba-knowledge show auth-pattern

# Rate pattern
amoeba-knowledge rate mod-123 --rating 5

# Share pattern
amoeba-knowledge share auth-pattern --to core
```

## The Learning Loop

```
Modification → Success? → Extract Pattern → Index Pattern
                                                  ↓
                                            Store in Knowledge
                                                  ↓
                                            Available for Reuse
                                                  ↓
                                              Reused? → Improve Rating
```

**The more the AI works, the smarter it gets.**



