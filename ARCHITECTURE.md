# Amoeba Architecture: Cellular Design

> **"A simple blob with a million little cilia directing it wherever."**

Amoeba follows biological cell organization. Each component has a specific function, communicates through well-defined interfaces, and can be replaced without disrupting the whole organism.

---

## 🧬 The Cell Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    CELL MEMBRANE (API Layer)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Authentication │ Rate Limiting │ Validation         │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ NUCLEUS  │  │ RIBOSOMES│  │  GOLGI   │  │MITOCHON- │  │
│  │  (Core)  │  │ (Routes) │  │(Services)│  │DRIA (DB) │  │
│  │          │  │          │  │          │  │          │  │
│  │ Business │  │ HTTP     │  │ Content  │  │ Postgres │  │
│  │ Logic    │  │ Handlers │  │ Gen      │  │ Storage  │  │
│  │          │  │          │  │ Delivery │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         CYTOPLASM (Shared Infrastructure)            │  │
│  │  Encryption │ Validation │ Monitoring │ Queue        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│              CILIA (External Integrations)                  │
│  OpenAI │ Anthropic │ Cohere │ Ollama │ SendGrid │ Stripe  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

### The Organism

```
server/
├── index.ts                    # Cell initialization
├── db.ts                       # Mitochondria connection
│
├── routes/                     # RIBOSOMES (protein synthesis = request handling)
│   ├── index.ts                # Route registry (70 lines)
│   ├── licenses.ts             # License CRUD (150 lines)
│   ├── ollama.ts               # Ollama management (120 lines)
│   ├── payments.ts             # Stripe checkout (180 lines)
│   ├── subscriptions.ts        # Subscription lifecycle (140 lines)
│   ├── content.ts              # Content generation (200 lines)
│   ├── templates.ts            # Template CRUD (180 lines)
│   ├── dataSources.ts          # Data source management (160 lines)
│   ├── outputs.ts              # Output channels (170 lines)
│   ├── schedules.ts            # Scheduled jobs (150 lines)
│   ├── credentials.ts          # BYOK AI/email (140 lines)
│   ├── health.ts               # System health (80 lines)
│   ├── agent.ts                # AI agent chat (100 lines)
│   └── webhooks.ts             # External webhooks (60 lines)
│
├── services/                   # GOLGI APPARATUS (processing & packaging)
│   ├── contentGenerationService.ts   # AI content generation
│   ├── deliveryService.ts            # Content distribution
│   ├── dataSourceService.ts          # Data fetching & parsing
│   ├── licenseService.ts             # License management
│   ├── stripeService.ts              # Payment processing
│   ├── ollamaService.ts              # Local AI models
│   ├── aiAgent.ts                    # Natural language control
│   ├── encryptionService.ts          # Data protection
│   ├── emailService.ts               # Email delivery
│   ├── cronService.ts                # Scheduled execution
│   ├── activityMonitor.ts            # Real-time logging
│   ├── commandExecutor.ts            # Terminal commands
│   ├── systemReadiness.ts            # Health checks
│   ├── queueService.ts               # Background jobs
│   └── integrationService.ts         # API key management
│
├── middleware/                 # CELL MEMBRANE (protection & filtering)
│   ├── errorHandler.ts         # Centralized error handling
│   ├── validation.ts           # Request validation
│   └── rateLimiter.ts          # Rate limiting
│
├── validation/                 # DNA (schemas & rules)
│   ├── monetization.ts         # License & payment schemas
│   ├── ollama.ts               # Ollama validation
│   ├── content.ts              # Content generation schemas
│   └── common.ts               # Shared validation utilities
│
├── storage.ts                  # MITOCHONDRIA (energy = data)
├── replitAuth.ts               # Membrane receptor (auth)
└── vite.ts                     # Membrane pore (static assets)

shared/
└── schema.ts                   # NUCLEUS (core data models)

client/                         # EXTERNAL ENVIRONMENT (UI)
└── src/
    ├── components/dashboard/   # Visual cilia
    ├── contexts/               # Signal transduction
    └── hooks/                  # Cellular receptors
```

---

## 🧪 Design Principles

### 1. **DNA Philosophy: Information Density**

> *"DNA is the most complex molecule in the universe, but the information is so dense that if one thing is wrong, it breaks the system. That's what we're aiming for."*

Every file follows:
- **Complete, not constrained** (200 lines is a target, not a limit)
- **One purpose** (single responsibility)
- **Maximum information density** (every line serves a purpose)
- **Precision over brevity** (better 300 robust lines than 3 fragile files)
- **Clear naming** (no abbreviations)
- **No nesting > 3 levels** (flat is better)

**The Rule**: An organelle can be as large as it needs to be to fulfill its purpose completely and correctly. Split only when responsibilities diverge, never for arbitrary size limits.

### 2. **Cellular Isolation**

Each organelle can be:
- **Tested independently**
- **Replaced without surgery**
- **Understood in isolation**
- **Evolved separately**

### 3. **Interface Contracts**

Communication happens through:
- **TypeScript interfaces** (compile-time contracts)
- **Zod schemas** (runtime validation)
- **Clear return types** (no `any`)

---

## 🔬 Component Responsibilities

### **NUCLEUS** (`shared/schema.ts`)
- **Role**: Genetic code, core data models
- **Contains**: Database schema, types, validation
- **Size**: 1 file, ~1000 lines (exception: it's the genome)
- **Rule**: All data structures defined here

### **RIBOSOMES** (`server/routes/`)
- **Role**: Protein synthesis = HTTP request handling
- **Contains**: Express route handlers
- **Size**: 14 files, 150-200 lines each
- **Rule**: No business logic, only HTTP → service calls

### **GOLGI APPARATUS** (`server/services/`)
- **Role**: Processing, packaging, distribution
- **Contains**: All business logic
- **Size**: 15+ files, 200-400 lines each
- **Rule**: Pure functions, testable, no HTTP knowledge

### **MITOCHONDRIA** (`server/storage.ts` + `server/db.ts`)
- **Role**: Energy production = data persistence
- **Contains**: Database queries, Drizzle ORM
- **Size**: 2 files, storage.ts ~800 lines (getting large)
- **Rule**: Only SQL/ORM queries, no business logic

### **CELL MEMBRANE** (`server/middleware/`)
- **Role**: Protection, filtering, selective permeability
- **Contains**: Auth, rate limiting, validation
- **Size**: 3 files, 100-150 lines each
- **Rule**: Reusable, composable, no side effects

### **DNA** (`server/validation/`)
- **Role**: Instructions for protein synthesis
- **Contains**: Zod schemas for validation
- **Size**: 4-5 files, 50-100 lines each
- **Rule**: Pure schemas, no logic

### **CYTOPLASM** (Utilities, helpers)
- **Role**: Medium for chemical reactions
- **Contains**: Shared utilities, constants
- **Size**: Multiple small files
- **Rule**: No state, pure functions

### **CILIA** (External integrations)
- **Role**: Movement, sensing environment
- **Contains**: API clients (OpenAI, Stripe, etc.)
- **Size**: Embedded in services
- **Rule**: Isolated, replaceable

---

## 🧬 Example: Content Generation Flow

```typescript
// 1. REQUEST enters through MEMBRANE
POST /api/content/generate
  ↓
// 2. MEMBRANE filters & validates
middleware: [isAuthenticated, aiGenerationRateLimit, validateBody(schema)]
  ↓
// 3. RIBOSOME receives request
routes/content.ts → async (req, res) => { ... }
  ↓
// 4. GOLGI processes
contentGenerationService.generate(params)
  ↓
// 5. CILIA reach out (AI APIs)
OpenAI/Anthropic/Cohere/Ollama API call
  ↓
// 6. MITOCHONDRIA stores result
storage.createGeneratedContent(result)
  ↓
// 7. GOLGI packages for delivery
deliveryService.deliver(content)
  ↓
// 8. Response exits through MEMBRANE
res.json({ success, data })
```

---

## 🔄 Migration Path

### Phase 1: Split Routes (Now)
```bash
server/routes.ts (1685 lines)
  → server/routes/*.ts (10-14 files, complete implementations)
  
Each route file contains ALL logic for its domain:
- Full CRUD operations
- All validation
- All error handling
- Complete middleware chains
- Comprehensive comments

Size doesn't matter. Completeness does.
```

### Phase 2: Extract Storage Queries (Later)
```bash
server/storage.ts (800 lines)
  → server/repositories/*.ts (licenses, content, users, etc.)
```

### Phase 3: Modularize Services (Ongoing)
```bash
Keep services focused, split if > 400 lines
```

### Phase 4: Add Tests (Continuous)
```bash
Each organelle gets its own test file
```

---

## 🎯 Rules of Evolution

### ✅ DO
- **Split when responsibilities diverge** (not by line count)
- **One file per domain** (licenses, payments, content, etc.)
- **Complete implementations** (all CRUD, validation, error handling)
- **Information density** (every line serves a clear purpose)
- **Test each organelle independently**
- **Use dependency injection**
- **Document interfaces**
- **Prioritize correctness over size**

### ❌ DON'T
- **Create circular dependencies**
- **Mix concerns (HTTP + business logic)**
- **Create deep hierarchies**
- **Use global state**
- **Skip validation**

---

## 🧪 Testing Strategy

Each organelle is testable:

```typescript
// Test RIBOSOME (route)
import { registerLicenseRoutes } from './routes/licenses';
// Mock services, test HTTP behavior

// Test GOLGI (service)
import { licenseService } from './services/licenseService';
// Mock storage, test business logic

// Test MITOCHONDRIA (storage)
import { storage } from './storage';
// Use test database, test queries
```

---

## 📊 Metrics

Track architectural health:

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Single responsibility | 100% | Mixed | 🔴 |
| Information density | High | Medium | 🟡 |
| Circular deps | 0 | ? | 🟡 |
| Test coverage | 80% | 0% | 🔴 |
| Type safety | 100% | ~95% | 🟡 |
| Route modularity | By domain | Monolithic | 🔴 |
| Complete implementations | 100% | Partial | 🟡 |

---

## 🚀 Next Steps

1. **Refactor `routes.ts`** → 14 modular files
2. **Add route tests** → Each route file gets `.test.ts`
3. **Extract repositories** → Split `storage.ts` by domain
4. **Document interfaces** → TypeDoc for all services
5. **Add health checks** → Per-organelle status

---

**Remember**: The organism grows by adding cilia (features), not by making existing organelles larger. Each new feature gets its own file, its own test, its own documentation.

**Architecture is not abstract—it's the difference between a single-celled amoeba and a million-celled organism that still behaves like one.** 🦠

