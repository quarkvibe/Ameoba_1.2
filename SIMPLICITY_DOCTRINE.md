# The Simplicity Doctrine
## Amoeba: A Blob with a Million Little Cilia

---

## 🦠 The Core Metaphor

**Amoeba is a blob with a million little cilia directing it wherever.**

```
              ╱▔▔▔▔▔▔▔▔▔▔▔╲
            ╱  SIMPLE CORE  ╲
           │   (The Blob)    │
            ╲               ╱
              ╲▁▁▁▁▁▁▁▁▁▁╱
               ┃ ┃ ┃ ┃ ┃         ← Cilia (Extensions)
              Slack Discord RSS   Each one small, specialized
              Email Ollama  API   Each one optional
              ...∞ more possible  Each one independent
```

**The Blob (Core):**
- Simple
- Stable
- Self-contained
- Barely changes

**The Cilia (Extensions):**
- Tiny
- Specialized
- Pluggable
- Infinite variety

---

## 📐 The Simplicity Rules

### Rule 1: The Core is Sacred
**The core should fit in your head.**

**What belongs in core:**
- Auth & user management
- Template engine (variables → content)
- AI API caller (send prompt, get response)
- Queue (job scheduling)
- Storage (read/write data)
- HTTP server (handle requests)

**What does NOT belong in core:**
- Specific AI providers (OpenAI, Anthropic) → Cilia
- Specific data sources (RSS, API) → Cilia
- Specific delivery channels (Email, Slack) → Cilia
- UI frameworks → Separate client
- Business logic → Services (thin layer)

**Core size limit: < 5,000 lines of actual business logic**

If core grows beyond this, something has become a cilium.

---

### Rule 2: Everything is a Cilium
**If it can be a plugin, it must be a plugin.**

#### Data Sources (Cilia)
```typescript
interface DataSource {
  name: string;
  fetch: (config: any) => Promise<Data>;
}

// That's it. That's the whole interface.
```

**Each source is ~50-200 lines:**
- RSS Reader: 100 lines
- REST API: 80 lines
- Webhook Handler: 60 lines
- Database Query: 150 lines

#### AI Providers (Cilia)
```typescript
interface AIProvider {
  name: string;
  generate: (prompt: string, options: any) => Promise<string>;
}

// Simple. Predictable. Replaceable.
```

**Each provider is ~100-300 lines:**
- OpenAI: 200 lines
- Anthropic: 180 lines
- Ollama: 150 lines
- Cohere: 170 lines

#### Delivery Channels (Cilia)
```typescript
interface DeliveryChannel {
  name: string;
  send: (content: string, config: any) => Promise<Result>;
}

// One job: deliver content.
```

**Each channel is ~100-250 lines:**
- Email (SendGrid): 150 lines
- Slack: 200 lines
- Discord: 180 lines
- Webhook: 80 lines

---

### Rule 3: No Abstraction for One Use Case
**Don't build a framework for a single feature.**

**❌ Bad:**
```typescript
class AbstractProviderFactory {
  createProvider(type: ProviderType): IProvider {
    // 500 lines of abstraction for 2 providers
  }
}
```

**✅ Good:**
```typescript
const providers = {
  openai: (prompt) => callOpenAI(prompt),
  anthropic: (prompt) => callAnthropic(prompt)
};

// Simple map. Easy to understand. Easy to extend.
```

**Rule:** Only abstract when you have 3+ similar things. Even then, keep it simple.

---

### Rule 4: Configuration Over Code
**Let users configure, don't make them code.**

**❌ Bad - Requires coding:**
```typescript
class CustomTransformer extends BaseTransformer {
  transform(data: any) {
    // User writes code here
  }
}
```

**✅ Good - Configuration:**
```json
{
  "transform": {
    "type": "template",
    "template": "Hello {{name}}, you have {{count}} items",
    "variables": {
      "name": "$.user.name",
      "count": "$.items.length"
    }
  }
}
```

**95% of use cases should be configurable, not programmable.**

For the other 5%, provide a simple function hook:
```typescript
transform: (data) => { /* custom code */ }
```

---

### Rule 5: Flat is Better Than Nested
**Avoid deep hierarchies. Keep things flat.**

**❌ Bad - Deep nesting:**
```typescript
app.services.ai.providers.openai.models.gpt4.chat.create()
```

**✅ Good - Flat:**
```typescript
generateContent(templateId, providerId)
```

**File structure - Flat:**
```
server/
├── routes/      # All routes, one per resource
├── services/    # All services, one per domain
└── plugins/     # All plugins, one per integration
```

Not this:
```
server/
├── api/
│   └── v1/
│       └── routes/
│           └── resources/
│               └── templates/
│                   └── handlers/
```

---

### Rule 6: Delete More Than You Add
**Every PR should remove code, not just add it.**

**Metrics to track:**
- Lines added
- Lines deleted
- **Net change: Should trend toward 0 or negative**

**When adding a feature:**
1. Can we delete an old one?
2. Can we simplify something else?
3. Can we consolidate similar code?

**Example:**
- Add Slack integration: +200 lines
- Delete old Discord code: -50 lines
- Consolidate message formatting: -80 lines
- **Net: +70 lines (acceptable)**

---

### Rule 7: One File, One Purpose
**If you can't describe the file in 5 words, split it.**

**Good file names:**
- `openai.ts` - "Calls OpenAI API"
- `email.ts` - "Sends email messages"
- `rss.ts` - "Fetches RSS feeds"
- `auth.ts` - "Handles user authentication"

**Bad file names:**
- `utils.ts` - What utilities? Too vague.
- `helpers.ts` - Helpers for what? Split it.
- `common.ts` - Common what? Be specific.

**Rule:** Max 300 lines per file. If longer, split by responsibility.

---

### Rule 8: No Premature Optimization
**Make it work, then make it fast (only if needed).**

**Don't optimize until you measure:**
1. Write simple code
2. Ship it
3. Measure performance
4. If <100ms, done
5. If >100ms, optimize THAT code

**❌ Bad - Premature:**
```typescript
// "Let's cache this for performance"
const cache = new LRU({ max: 1000 });
// ...200 lines of cache management
// Used by 1 request/minute
```

**✅ Good - As needed:**
```typescript
// Simple first
const result = await database.query(sql);
// If slow, add cache later with metrics
```

---

### Rule 9: Explicit is Better Than Magic
**No clever tricks. Obvious code wins.**

**❌ Bad - Magic:**
```typescript
@Autowired()
@Transactional()
@CacheEvict("users")
async updateUser(id: string) {
  // What's happening? Who knows!
}
```

**✅ Good - Explicit:**
```typescript
async updateUser(id: string) {
  const user = await db.users.update(id);
  await cache.delete(`user:${id}`);
  return user;
}
```

**Every step is visible. No hidden behavior.**

---

### Rule 10: Dependencies are Liabilities
**Every dependency is a risk. Minimize them.**

**Current dependencies (core only):**
```json
{
  "express": "For HTTP server",
  "drizzle-orm": "For database",
  "zod": "For validation",
  "openai": "For AI (should be plugin)"
}
```

**Before adding a dependency, ask:**
1. Can I write this in 50 lines myself?
2. Is this actively maintained?
3. Does it have <10 dependencies itself?
4. Is it <50KB?

**If "no" to any, reconsider.**

**Example:**
- Need to parse RSS? Write a simple XML parser (100 lines).
- Need to format dates? Write 3 functions (30 lines).
- Need to send HTTP? Use native `fetch()` (built-in).

---

## 🎯 The Refactoring Checklist

Before any commit, ask:

### Can I Delete Code?
- [ ] Remove unused functions
- [ ] Remove commented code
- [ ] Remove redundant checks
- [ ] Remove dead imports

### Can I Simplify?
- [ ] Fewer lines to do same thing
- [ ] Fewer functions to call
- [ ] Fewer parameters to pass
- [ ] Fewer files to read

### Can I Consolidate?
- [ ] Combine similar functions
- [ ] Merge duplicate code
- [ ] Share common logic
- [ ] Reuse existing patterns

### Can I Clarify?
- [ ] Better variable names
- [ ] Better function names
- [ ] Better comments (why, not what)
- [ ] Better error messages

---

## 📏 Size Limits

**Enforced by CI:**

### Core Limits
- **Core business logic:** <5,000 lines
- **Any single file:** <300 lines
- **Any single function:** <50 lines
- **Total dependencies:** <30

### Cilia Limits
- **Any plugin:** <500 lines
- **Plugin interface:** <50 lines
- **Plugin config:** <100 lines

### Bundle Limits
- **Docker image:** <500MB
- **CLI binary:** <50MB
- **Browser bundle:** <500KB (gzipped)

**If you hit a limit, that's a design problem, not a limit problem.**

---

## 🔬 Examples of Simplicity

### Example 1: The Template Engine

**Complex approach (what we DON'T do):**
```typescript
class TemplateEngine {
  constructor(private ast: AST) {}
  
  parse(template: string): AST {
    // 500 lines of parsing
  }
  
  compile(ast: AST): Function {
    // 300 lines of compilation
  }
  
  execute(fn: Function, data: any): string {
    // 200 lines of execution
  }
}
```

**Simple approach (what we DO):**
```typescript
function renderTemplate(template: string, data: any): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

// 3 lines. Covers 95% of use cases.
// For complex needs, users can write custom code.
```

### Example 2: The Plugin System

**Complex approach:**
```typescript
class PluginManager {
  private plugins: Map<string, Plugin>;
  private loader: PluginLoader;
  private sandbox: Sandbox;
  
  async loadPlugin(name: string) {
    // 800 lines of loading, sandboxing, dependency resolution
  }
}
```

**Simple approach:**
```typescript
const plugins = {
  async load(name: string) {
    return await import(`./plugins/${name}.js`);
  }
};

// Dynamic import. That's it.
// Sandboxing comes later (Phase 3) when we need it.
```

### Example 3: The Workflow Engine

**Complex approach:**
```typescript
class WorkflowEngine {
  async execute(workflow: WorkflowDSL) {
    // Parse DSL (500 lines)
    // Build execution graph (300 lines)
    // Handle branches (400 lines)
    // Handle errors (200 lines)
  }
}
```

**Simple approach:**
```typescript
async function runWorkflow(steps: Step[]) {
  let data = {};
  for (const step of steps) {
    data = await step.execute(data);
  }
  return data;
}

// Sequential execution in 5 lines.
// Parallel? Add Promise.all when needed.
// Branches? Add if/else when needed.
```

---

## 🧪 The Simplicity Test

For any feature, it must pass:

### The Explain Test
**Can you explain it to a junior dev in 2 minutes?**

- If yes: Simple enough ✅
- If no: Too complex ❌

### The Delete Test
**If you deleted this feature, would users revolt?**

- If yes: Essential feature ✅
- If no: Nice-to-have, maybe remove ❌

### The Line Count Test
**Is this feature < 500 lines (including tests)?**

- If yes: Probably simple ✅
- If no: Can you split it? ❌

### The Dependency Test
**Does this add < 3 new dependencies?**

- If yes: Acceptable ✅
- If no: Find simpler way ❌

### The Performance Test
**Does this stay < 100ms for p95?**

- If yes: Fast enough ✅
- If no: Optimize or rethink ❌

---

## 🚨 Code Smells (Red Flags)

### Immediate Rejection
```typescript
// ❌ Abstract factory factory
class AbstractProviderFactoryBuilder {}

// ❌ Generic utility grab-bag
class Utils {
  static doEverything() {}
}

// ❌ God object
class Application {
  // 5000 lines, does everything
}

// ❌ Deep inheritance
class A extends B extends C extends D {}

// ❌ Callback hell
getData((data) => {
  transform(data, (result) => {
    save(result, (saved) => {
      notify(saved, (done) => {
        // ...
      });
    });
  });
});
```

### Requires Justification
```typescript
// ⚠️ More than 3 parameters
function create(a, b, c, d, e) {}
// Consider: function create(options: Options) {}

// ⚠️ Boolean parameters
function get(id, includeDeleted, includeDrafts) {}
// Consider: function get(id, { includeDeleted, includeDrafts })

// ⚠️ Try-catch in a loop
for (const item of items) {
  try { /* ... */ } catch {}
}
// Consider: Filter invalid items first

// ⚠️ Multiple responsibilities
function getUserAndSendEmailAndLogAnalytics() {}
// Split into 3 functions
```

---

## 🎨 The Architecture (Simple Version)

### The Blob (Core)
```typescript
// server/core.ts - The entire core in ~500 lines

interface Core {
  // User management
  auth: {
    login: (email, password) => User;
    logout: (userId) => void;
  };
  
  // Data storage
  storage: {
    get: (key) => Data;
    set: (key, value) => void;
  };
  
  // Job queue
  queue: {
    add: (job) => JobId;
    process: (handler) => void;
  };
  
  // That's it. That's the core.
}
```

### The Cilia (Plugins)
```typescript
// plugins/openai.ts - ~150 lines

export const openai = {
  name: 'openai',
  generate: async (prompt, options) => {
    const response = await fetch('https://api.openai.com/...', {
      method: 'POST',
      body: JSON.stringify({ prompt, ...options })
    });
    return response.json();
  }
};

// That's a complete plugin.
```

### The Glue (Services)
```typescript
// services/contentGeneration.ts - ~200 lines

export async function generateContent(templateId, userId) {
  // 1. Get template
  const template = await storage.get(`template:${templateId}`);
  
  // 2. Get AI provider
  const provider = plugins.ai[template.provider];
  
  // 3. Generate
  const content = await provider.generate(template.prompt);
  
  // 4. Save
  await storage.set(`content:${Date.now()}`, content);
  
  return content;
}

// Simple orchestration. No magic.
```

---

## 🏛️ The Rules of Core

### What Can Go in Core?

**Yes:**
- Authentication (login/logout/sessions)
- Authorization (permissions/roles)
- Storage abstraction (get/set/delete)
- Queue abstraction (add/process/cancel)
- HTTP server (routes/middleware)
- Template rendering (variable substitution)
- Job scheduling (cron/intervals)

**No:**
- Specific storage implementations → Plugins
- Specific AI providers → Plugins
- Specific delivery channels → Plugins
- Business logic → Services
- UI components → Client
- Complex algorithms → Libraries

### Core Modification Rules

**To add something to core, it must:**
1. Be used by >50% of features
2. Have <10 public methods
3. Have zero external dependencies
4. Have 100% test coverage
5. Be approved by 3+ maintainers

**Examples:**

| Proposal | Decision | Why |
|----------|----------|-----|
| Add WebSocket server | ✅ Yes | Used by monitoring, terminal, real-time features |
| Add email templates | ❌ No | Only email plugin needs it → Keep in plugin |
| Add rate limiter | ✅ Yes | Every API endpoint needs it → Core concern |
| Add PDF generator | ❌ No | <10% of users need it → Plugin or library |

---

## 📦 The Plugin Philosophy

### A Plugin Should:
1. **Do one thing** (Slack messages, not "communication")
2. **Be independent** (Doesn't rely on other plugins)
3. **Be optional** (Core works without it)
4. **Be small** (<500 lines)
5. **Be testable** (Mock external APIs)

### Plugin Template
```typescript
// plugins/[name].ts

export interface Config {
  // Plugin-specific config (Zod schema)
}

export async function execute(input: any, config: Config) {
  // Plugin logic
  return output;
}

export async function test(config: Config): Promise<boolean> {
  // Health check
}

// That's all a plugin needs.
```

### Plugin Discovery
```typescript
// Automatic, not manual
const plugins = await import.meta.glob('./plugins/*.ts');

// No registration, no configuration, just files.
```

---

## 🔄 Continuous Simplification

### Weekly Audit
Every week, the team asks:
1. What can we delete this week?
2. What can we consolidate?
3. What's confusing users?
4. What's slowing us down?

### Monthly Refactor
Every month:
1. Pick the most complex file
2. Simplify it by 30%
3. Document the refactor
4. Share learnings

### Quarterly Reset
Every quarter:
1. Review all code
2. Identify "bloat" areas
3. Major simplification sprint
4. Update this document

---

## 📖 Required Reading

Before contributing, read:

1. **This document** (Simplicity Doctrine)
2. [The Zen of Python](https://peps.python.org/pep-0020/) - Simple > Complex
3. [Worse is Better](https://dreamsongs.com/WorseIsBetter.html) - Simplicity beats perfection
4. [KISS Principle](https://en.wikipedia.org/wiki/KISS_principle) - Keep it simple
5. [YAGNI](https://en.wikipedia.org/wiki/You_aren%27t_gonna_need_it) - You aren't gonna need it

---

## 🎯 Measuring Simplicity

### Code Metrics
```bash
# Lines of code (excluding tests, comments)
cloc --exclude-dir=tests --exclude-lang=Markdown .

# Target: <20,000 lines total
# Current: Check README badge

# Complexity score (cyclomatic complexity)
npx complexity-report

# Target: Average <5 per function
```

### Dependency Audit
```bash
# List all dependencies
npm ls --all

# Count dependencies
npm ls --all | wc -l

# Target: <50 total (including transitive)
```

### Bundle Size
```bash
# Docker image
docker images amoeba --format "{{.Size}}"
# Target: <500MB

# CLI
ls -lh cli/dist/
# Target: <50MB

# Browser bundle
ls -lh client/dist/
# Target: <500KB gzipped
```

---

## ✅ Simplicity Checklist

Before merging any PR:

- [ ] Net lines of code ≤ 0 (delete >= add)
- [ ] No new dependencies without justification
- [ ] Every file <300 lines
- [ ] Every function <50 lines
- [ ] Can explain to junior dev in 2 minutes
- [ ] No abstractions for <3 use cases
- [ ] All code has a clear purpose
- [ ] Tests exist and pass
- [ ] Documentation updated
- [ ] Complexity score <5 average

If any checkbox is ❌, justify or simplify.

---

## 🏆 Simplicity Hall of Fame

Examples of great simplicity:

### 1. RSS Parser
**Before:** 800 lines using `rss-parser` library  
**After:** 120 lines using native XML parser  
**Savings:** -680 lines, -1 dependency

### 2. Template Engine
**Before:** 1,200 lines with AST, compiler, optimizer  
**After:** 15 lines using regex replace  
**Savings:** -1,185 lines

### 3. Plugin System
**Before:** 2,000 lines with loader, sandbox, resolver  
**After:** Dynamic imports (built-in)  
**Savings:** -2,000 lines, simpler, faster

---

## 🚫 Simplicity Hall of Shame

Examples to learn from:

### 1. Abstract Factory Pattern (Removed)
**Added:** 600 lines of abstraction  
**Used by:** 2 providers  
**Lesson:** Don't abstract until 3+ cases

### 2. Custom ORM (Never added)
**Proposed:** 5,000 lines  
**Alternative:** Drizzle (existing)  
**Lesson:** Use libraries for complex needs

### 3. Visual Workflow Builder v1 (Scrapped)
**Attempt:** 3,000 lines, 15 dependencies  
**Reality:** Too complex  
**Lesson:** Start simpler, iterate

---

## 💡 The Simplicity Mindset

**Always ask:**
- Can I delete this?
- Can I use less code?
- Can I use fewer files?
- Can I use fewer dependencies?
- Can I make this more obvious?

**Remember:**
- Simple ≠ Easy (simple is hard work)
- Simple ≠ Simplistic (simple is powerful)
- Simple ≠ Feature-poor (simple is focused)

**The goal:**
A developer should be able to:
- Understand Amoeba in **1 day**
- Build a plugin in **1 hour**
- Fix a bug in **30 minutes**
- Deploy to production in **5 minutes**

**That's simplicity.**

---

## 📜 The Simplicity Pledge

As a contributor to Amoeba, I pledge to:

1. **Delete more than I add** - Every PR should reduce complexity
2. **Question every dependency** - Each one is a liability
3. **Favor configuration over code** - Let users configure, not program
4. **Keep files small** - <300 lines per file
5. **Keep functions small** - <50 lines per function
6. **Make code obvious** - No clever tricks
7. **Write for humans first** - Code is read more than written
8. **Test everything** - Simple code is testable code
9. **Document decisions** - Why, not what
10. **Simplify continuously** - It's never "done"

**Signed:** [Your Name]  
**Date:** [Today]

---

## 🦠 Remember the Amoeba

```
Simple core.
Million specialized extensions.
Each one tiny.
Each one optional.
Each one powerful.

Like an amoeba.
```

**That's what we build.**

---

**Last Updated:** January 2025  
**Status:** The Law  
**Compliance:** Mandatory

---

*"Simplicity is prerequisite for reliability."* — Edsger Dijkstra

*"The best code is no code at all."* — Jeff Atwood

*"A blob with a million little cilia."* — Amoeba Philosophy



