# AI Code Agent: Self-Modifying Organism

> **"The amoeba can evolve itself, but only within the rules of its DNA."**

## Concept

An AI-powered code modification system integrated directly into Amoeba's terminal. It can read the codebase, understand the architecture, and make targeted changes while following strict rules.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   AI CODE AGENT                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Context Loader                                   │  │
│  │  - ARCHITECTURE.md (structure)                    │  │
│  │  - MANIFESTO.md (principles)                      │  │
│  │  - SIMPLICITY_DOCTRINE.md (rules)                │  │
│  │  - .amoeba/rules/*.md (custom rules)             │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Code Analyzer                                    │  │
│  │  - Read files (with permissions)                 │  │
│  │  - Understand structure                          │  │
│  │  - Find relevant code                            │  │
│  │  - Generate AST                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  AI Planning Engine                               │  │
│  │  - Propose changes                               │  │
│  │  - Explain reasoning                             │  │
│  │  - Check against rules                           │  │
│  │  - Estimate impact                               │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Safety Layer                                     │  │
│  │  - Validate changes                              │  │
│  │  - Check whitelist/blacklist                     │  │
│  │  - Require approval                              │  │
│  │  - Create rollback point                         │  │
│  └──────────────────────────────────────────────────┘  │
│                          ↓                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Code Writer                                      │  │
│  │  - Apply changes atomically                      │  │
│  │  - Git commit                                    │  │
│  │  - Run linters/tests                             │  │
│  │  - Report results                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Safety Rules

### 🔒 **Protected (Cannot Modify)**
```
.amoeba/rules/          # The DNA itself
ARCHITECTURE.md         # The blueprint
MANIFESTO.md           # The principles
SIMPLICITY_DOCTRINE.md # The rules
LICENSE                # Legal
.git/                  # Version control
node_modules/          # Dependencies
.env                   # Secrets
```

### ✅ **Modifiable (With Rules)**
```
server/routes/         # Can add/modify routes (must follow patterns)
server/services/       # Can add/modify services (must be single-purpose)
server/middleware/     # Can add middleware (must be composable)
server/validation/     # Can add schemas (must use Zod)
client/src/           # Can modify UI (must follow design system)
shared/schema.ts      # Can extend schema (must maintain compatibility)
```

### ⚠️ **Restricted (Approval Required)**
```
server/index.ts        # Core entry point
server/routes/index.ts # Route registry
server/db.ts           # Database connection
server/storage.ts      # Data layer
```

---

## Usage

### Terminal Commands

```bash
# Simple modifications
ai-code "add user avatar upload feature"
ai-code "create a new route for analytics"
ai-code "add validation schema for webhooks"

# Refactoring
ai-code "refactor templates.ts to use async/await consistently"
ai-code "optimize dataSources service"

# Bug fixes
ai-code "fix the race condition in cronService"
ai-code "handle null values in license validation"

# Analysis
ai-code --analyze "check for memory leaks"
ai-code --explain "how does content generation work?"

# Rule enforcement
ai-code --audit "check all routes follow patterns"
ai-code --enforce "ensure all services have error handling"
```

### Workflow

1. **User issues command**
   ```
   ai-code "add email verification"
   ```

2. **Agent loads context**
   - Reads ARCHITECTURE.md to understand where email code lives
   - Reads MANIFESTO.md to understand principles
   - Reads SIMPLICITY_DOCTRINE.md for rules
   - Scans relevant files

3. **Agent proposes plan**
   ```
   📋 PLAN: Add Email Verification
   
   Files to modify:
   1. server/routes/users.ts (add verification routes)
   2. server/services/emailService.ts (add verification email)
   3. shared/schema.ts (add emailVerified field)
   4. server/storage.ts (add verification methods)
   
   Changes align with:
   ✅ Single responsibility (each file has one purpose)
   ✅ Information density (no fluff)
   ✅ Modular design (isolated changes)
   
   Estimated impact: Medium
   Breaking changes: None
   Tests needed: 4 new tests
   
   Proceed? [y/n/explain]
   ```

4. **User approves**
   ```
   y
   ```

5. **Agent applies changes**
   ```
   🔄 Applying changes...
   ✅ Modified server/routes/users.ts (+42 lines)
   ✅ Modified server/services/emailService.ts (+28 lines)
   ✅ Modified shared/schema.ts (+3 lines)
   ✅ Modified server/storage.ts (+15 lines)
   🔍 Running linter... ✅
   📝 Creating git commit... ✅
   
   Commit: "feat: add email verification"
   Branch: feature/email-verification
   
   Done! Review the changes with: git diff HEAD~1
   ```

---

## Rules Engine

### `.amoeba/rules/`

Custom rules for the AI agent, written in markdown:

**`.amoeba/rules/routes.md`**
```markdown
# Route Module Rules

1. Every route file must:
   - Export a single `register*Routes(router: Router)` function
   - Use rate limiting on all endpoints
   - Use `isAuthenticated` for protected routes
   - Include error handling in every route
   - Follow RESTful conventions

2. Route files cannot:
   - Import from other route files
   - Contain business logic (use services)
   - Exceed 400 lines (split by subdomain)
   - Use `any` types without explicit comment

3. All routes must:
   - Validate input with Zod schemas
   - Return consistent error format
   - Log to activityMonitor for important actions
   - Check resource ownership for user data
```

**`.amoeba/rules/services.md`**
```markdown
# Service Module Rules

1. Every service must:
   - Be a class or object export
   - Have a single, clear responsibility
   - Export a singleton instance
   - Be testable in isolation

2. Services cannot:
   - Import Express types (no HTTP knowledge)
   - Directly access req/res objects
   - Import from route files
   - Use global state

3. All service methods must:
   - Have TypeScript type signatures
   - Handle errors explicitly
   - Return consistent types
   - Be pure functions when possible
```

**`.amoeba/rules/schema.md`**
```markdown
# Schema Modification Rules

1. Schema changes must:
   - Be backwards compatible
   - Include migration script
   - Update all dependent code
   - Document breaking changes

2. New tables must:
   - Have proper indexes
   - Use cascade delete appropriately
   - Include created_at timestamp
   - Follow naming conventions

3. Cannot:
   - Remove fields without deprecation
   - Change types destructively
   - Break existing queries
```

---

## Implementation

### File Structure

```
server/services/
├── aiCodeAgent.ts         # Main AI code agent
├── codeAnalyzer.ts        # Code analysis utilities
├── codeWriter.ts          # Safe file writing
├── rulesEngine.ts         # Load and enforce rules
└── gitIntegration.ts      # Git operations

.amoeba/
├── rules/
│   ├── routes.md          # Route patterns
│   ├── services.md        # Service patterns
│   ├── schema.md          # Database rules
│   ├── ui.md              # Frontend rules
│   └── testing.md         # Test requirements
├── whitelist.json         # Modifiable files/dirs
├── blacklist.json         # Protected files/dirs
└── config.json            # Agent configuration
```

### Key Features

1. **Context-Aware**
   - Understands Amoeba's architecture
   - Follows established patterns
   - Maintains consistency

2. **Rule-Bound**
   - Cannot violate SIMPLICITY_DOCTRINE
   - Cannot modify protected files
   - Must explain changes

3. **Safe**
   - Creates git branches
   - Atomic operations
   - Easy rollback
   - Runs validation

4. **Interactive**
   - Shows plan before applying
   - Explains reasoning
   - Allows approval/rejection
   - Provides alternatives

5. **Educational**
   - Explains architectural decisions
   - Shows how code fits into system
   - Teaches patterns
   - Documents changes

---

## Example Session

```bash
Terminal> ai-code "add rate limiting to all unprotected routes"

🤖 AI Code Agent
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 Loading context...
✅ Loaded ARCHITECTURE.md (331 lines)
✅ Loaded MANIFESTO.md (180 lines)
✅ Loaded SIMPLICITY_DOCTRINE.md (95 lines)
✅ Loaded .amoeba/rules/*.md (5 rule files)

🔍 Analyzing codebase...
Found 17 route modules in server/routes/
Checking for unprotected routes...

⚠️  Found 3 unprotected routes:
1. GET /api/health (routes/health.ts:18)
2. POST /api/webhooks/stripe (routes/webhooks.ts:16)
3. GET /api/ollama/recommended (routes/ollama.ts:54)

📋 PROPOSED CHANGES:

File: server/routes/health.ts
Action: Add publicRateLimit middleware
Line: 18
Before:
  router.get('/health', async (req, res) => {

After:
  router.get('/health', 
    publicRateLimit,  // Added: Prevent health check abuse
    async (req, res) => {

Reasoning: Public health endpoint should have rate limiting to
prevent abuse. Using publicRateLimit (30 req/min per IP) as per
ARCHITECTURE.md guidelines.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Similar analysis for other 2 routes...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
- Files to modify: 3
- Lines to add: 6
- Imports to add: 3
- Breaking changes: None
- Estimated risk: Low

All changes follow:
✅ SIMPLICITY_DOCTRINE (minimal, purposeful changes)
✅ ARCHITECTURE.md patterns (consistent rate limiting)
✅ .amoeba/rules/routes.md (proper middleware usage)

Proceed with changes? [y/n/d for diff]
> y

🔄 Applying changes...
✅ Modified server/routes/health.ts
✅ Modified server/routes/webhooks.ts
✅ Modified server/routes/ollama.ts
🔍 Running TypeScript check... ✅
🔍 Running linter... ✅
📝 Git commit created

Commit: "feat: add rate limiting to public routes"
Files changed: 3
Insertions: 6
Deletions: 0

Changes applied successfully! 🎉

Review: git diff HEAD~1
Rollback: git reset --hard HEAD~1
```

---

## Configuration

**`.amoeba/config.json`**
```json
{
  "aiCodeAgent": {
    "enabled": true,
    "model": "gpt-4",
    "maxFileSize": 10000,
    "requireApproval": true,
    "autoCommit": true,
    "branchPrefix": "ai-agent/",
    "rules": {
      "enforceSimplicityDoctrine": true,
      "checkArchitectureAlignment": true,
      "validateBeforeApply": true,
      "runTests": false,
      "maxChangesPerSession": 10
    }
  }
}
```

**`.amoeba/whitelist.json`**
```json
{
  "directories": [
    "server/routes/",
    "server/services/",
    "server/middleware/",
    "server/validation/",
    "client/src/"
  ],
  "files": [
    "shared/schema.ts"
  ],
  "patterns": [
    "**/*.test.ts",
    "**/*.md"
  ]
}
```

**`.amoeba/blacklist.json`**
```json
{
  "files": [
    ".env",
    ".env.local",
    "LICENSE",
    "ARCHITECTURE.md",
    "MANIFESTO.md",
    "SIMPLICITY_DOCTRINE.md"
  ],
  "directories": [
    ".git/",
    "node_modules/",
    ".amoeba/rules/"
  ],
  "patterns": [
    "**/*.key",
    "**/*.pem",
    "**/secrets/**"
  ]
}
```

---

## Benefits

1. **Rapid Development**
   - Delegate boilerplate to AI
   - Focus on high-level architecture
   - Maintain consistency automatically

2. **Knowledge Preservation**
   - Rules encoded in markdown
   - Architecture enforced automatically
   - Patterns replicated correctly

3. **Onboarding**
   - New developers see patterns
   - AI explains decisions
   - Learn by watching

4. **Quality**
   - Consistent code style
   - Enforced patterns
   - Automatic validation

5. **Evolution**
   - Organism can grow itself
   - Within the rules of its DNA
   - Maintains architectural integrity

---

## Next Steps

1. Build `aiCodeAgent.ts` service
2. Create rules engine
3. Implement safety layer
4. Add terminal commands
5. Create initial rule set
6. Test with simple modifications
7. Gradually expand permissions

---

**The amoeba learns to modify itself, but only within the constraints of its DNA. Every change must serve a purpose. Every modification must follow the rules. The organism evolves, but never loses its identity.** 🧬




