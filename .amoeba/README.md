# .amoeba/ - The Organism's Configuration

This directory contains the AI Code Agent's configuration, rules, and operational data.

## Structure

```
.amoeba/
├── README.md              # This file
├── config.json            # Agent configuration
├── whitelist.json         # Modifiable files/directories
├── blacklist.json         # Protected files/directories
├── rules/                 # Domain-specific coding rules
│   ├── routes.md          # Route module patterns
│   ├── services.md        # Service module patterns
│   └── schema.md          # Database schema rules
├── backups/               # Pre-modification backups (auto-created)
└── logs/                  # Agent activity logs (auto-created)
```

## Purpose

The `.amoeba/` directory is the **control center** for the AI Code Agent system. It defines:

1. **What can be modified** (`whitelist.json`)
2. **What is protected** (`blacklist.json`)
3. **How code should be written** (`rules/*.md`)
4. **Agent behavior** (`config.json`)

## The DNA

The only truly immutable files (the organism's DNA) are:
- **MANIFESTO.md** - Philosophical principles
- **SIMPLICITY_DOCTRINE.md** - Architectural rules

These are hardcoded into the AI agent's system prompt and cannot be modified without human approval.

Everything else, including the files in this directory, can be modified by the AI if it determines the change serves the organism's purpose.

## Usage

Agents read these files to understand:
- Which files they can modify
- What patterns to follow
- What rules to enforce
- How to structure code

When the AI makes changes, it:
1. Checks `whitelist.json` / `blacklist.json`
2. Reads relevant `rules/*.md` files
3. Validates against the immutable DNA
4. Creates backup in `backups/`
5. Applies changes
6. Logs action in `logs/`

## Evolution

This directory itself can evolve. If the rules are wrong, the AI can propose changes. If the whitelist is too restrictive, it can be expanded. The organism adapts.

**The only constant is simplicity and purpose.**



