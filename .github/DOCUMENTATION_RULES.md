# Documentation Structure & Rules

## 🔒 Core Documentation (DO NOT DELETE)

These files are the definitive source of truth for the Amoeba project:

### 1. **MANIFESTO.md** ⭐ REQUIRED READING
**Purpose:** Architecture principles, development standards, strategic roadmap  
**Audience:** All contributors  
**Status:** Living document  
**Update Frequency:** Quarterly or when major decisions are made

### 2. **SIMPLICITY_DOCTRINE.md** ⭐ REQUIRED READING
**Purpose:** Simplicity rules, code standards, refactoring guidelines  
**Audience:** All contributors  
**Status:** The Law (mandatory compliance)  
**Update Frequency:** As needed when patterns emerge

### 3. **DEFINITIVE_GUIDE.md**
**Purpose:** Comprehensive guide synthesizing all key information  
**Audience:** New contributors, users, decision-makers  
**Status:** Living document  
**Update Frequency:** Monthly or when significant changes occur

### 4. **VISION_PROTOOLZ.md**
**Purpose:** Long-term vision, ultimate capabilities, use cases  
**Audience:** Contributors, potential users, investors  
**Status:** Vision document  
**Update Frequency:** Annually or when strategy shifts

### 5. **CONTRIBUTING.md**
**Purpose:** Contribution process, PR guidelines, code of conduct  
**Audience:** Contributors  
**Status:** Standard  
**Update Frequency:** As needed

### 6. **README.md**
**Purpose:** User-facing overview, quick start, installation  
**Audience:** End users, potential users  
**Status:** Marketing + technical  
**Update Frequency:** With each release

### 7. **CHANGELOG.md**
**Purpose:** Version history, release notes  
**Audience:** Users, maintainers  
**Status:** Append-only  
**Update Frequency:** With each release

---

## ❌ What NOT to Create

### DO NOT create these files (or delete if they exist):

- ❌ Session summaries (e.g., `SESSION_COMPLETE_*.md`)
- ❌ Status updates (e.g., `BACKEND_COMPLETE.md`)
- ❌ Completion checklists (e.g., `COMPLETION_CHECKLIST.md`)
- ❌ Implementation details (e.g., `CLI_DESIGN.md`)
- ❌ Temporary guides (e.g., `NPM_PUBLISHING_GUIDE.md`)
- ❌ Progress trackers (e.g., `MONETIZATION_PROGRESS.md`)
- ❌ Random READMEs (e.g., `START_HERE.md`, `replit.md`)

**Why?** These create documentation debt and become outdated quickly.

**Instead:** Update the core documents or create tickets/issues.

---

## 📁 Where Documentation Lives

```
Ameoba/
├── MANIFESTO.md              # ⭐ Architecture & principles
├── SIMPLICITY_DOCTRINE.md    # ⭐ Simplicity rules
├── DEFINITIVE_GUIDE.md       # 📖 Comprehensive guide
├── VISION_PROTOOLZ.md        # 🔮 Long-term vision
├── CONTRIBUTING.md           # 🤝 Contribution guide
├── README.md                 # 👋 User-facing docs
├── CHANGELOG.md              # 📝 Version history
├── LICENSE                   # ⚖️ Legal
│
├── docs/                     # Detailed documentation
│   ├── getting-started.md   # Setup & installation
│   ├── user-guide.md        # Feature documentation
│   ├── api-reference.md     # REST API docs
│   ├── cli-reference.md     # CLI commands
│   ├── architecture.md      # System design
│   ├── development.md       # Dev environment
│   ├── testing.md           # Testing guide
│   ├── deployment.md        # Deployment guide
│   └── examples/            # Example workflows
│
├── .github/
│   ├── DOCUMENTATION_RULES.md  # This file
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
└── ADR/                      # Architecture Decision Records
    ├── 001-typescript.md
    ├── 002-postgresql.md
    └── ...
```

---

## 🔄 Documentation Lifecycle

### When to Update Core Docs

**MANIFESTO.md:**
- New architectural principles
- Major technology decisions
- Roadmap phase changes
- Significant policy changes

**SIMPLICITY_DOCTRINE.md:**
- New code patterns emerge
- Complexity thresholds change
- New "code smells" identified
- Refactoring strategies added

**DEFINITIVE_GUIDE.md:**
- Any major change to other docs
- New features added
- Process changes
- Monthly review cycle

**VISION_PROTOOLZ.md:**
- Strategic direction shifts
- New market opportunities
- Competitive landscape changes
- Annual review

**CONTRIBUTING.md:**
- Process improvements
- New tools/workflows
- Community feedback
- Contribution patterns change

**README.md:**
- New features
- Installation changes
- Quick start updates
- With each release

**CHANGELOG.md:**
- Every release (mandatory)
- Following semantic versioning
- User-facing changes only

---

## ✅ Documentation Checklist

Before merging any PR that affects documentation:

- [ ] Core docs updated if architectural change
- [ ] README.md updated if user-facing change
- [ ] API docs updated if endpoints changed
- [ ] CLI docs updated if commands changed
- [ ] Examples updated if API changed
- [ ] CHANGELOG.md updated if release
- [ ] No new root-level .md files created
- [ ] Old/temporary docs deleted

---

## 🚫 Pull Request Review: Documentation

Reviewers must reject PRs that:

1. Create root-level .md files without justification
2. Duplicate information across multiple files
3. Add temporary/session documentation
4. Don't update relevant docs when code changes
5. Break links to existing documentation
6. Don't follow the documentation structure

---

## 📖 Documentation Standards

### Writing Style

**Tone:**
- Direct and clear
- Professional but approachable
- Technical when necessary
- Examples over explanation

**Structure:**
- Start with "why" (problem)
- Then "what" (solution)
- Then "how" (implementation)
- End with examples

**Formatting:**
- Use markdown properly
- Code blocks with language tags
- Tables for comparisons
- Bullet points for lists
- Emojis sparingly (headings only)

### Code Examples

**Good:**
```typescript
// Clear, complete, runnable
const result = await generateContent({
  templateId: 'blog-post',
  variables: { topic: 'AI' }
});
```

**Bad:**
```typescript
// Vague, incomplete
const x = await fn(y);
```

---

## 🏆 Documentation Quality

### Metrics

Track these metrics:
- **Freshness:** Days since last update
- **Accuracy:** User-reported errors
- **Coverage:** % of features documented
- **Clarity:** Time to first workflow

### Goals

- All public APIs documented: **100%**
- Code examples for features: **100%**
- Average doc age: **<90 days**
- User satisfaction: **>4.5/5**

---

## 📚 References

External documentation guidelines we follow:

- [Divio Documentation System](https://documentation.divio.com/)
- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Write the Docs](https://www.writethedocs.org/guide/)

---

## 🔒 This File is Protected

**DO NOT DELETE THIS FILE**

This file defines the documentation structure and must be preserved.

If you believe changes are needed, open an issue first for discussion.

---

**Last Updated:** January 2025  
**Status:** Protected  
**Applies To:** All contributors




