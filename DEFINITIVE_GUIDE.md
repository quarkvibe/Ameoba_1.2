# Amoeba Platform: The Definitive Guide
## Everything You Need to Know in One Place

---

## 📚 Document Index

This guide synthesizes all key documents into one authoritative reference. For deep dives, see:

- **[MANIFESTO.md](./MANIFESTO.md)** - Core principles, architecture standards, roadmap (REQUIRED READING)
- **[VISION_PROTOOLZ.md](./VISION_PROTOOLZ.md)** - Long-term vision, ultimate capabilities
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution process, pull request guidelines
- **[README.md](./README.md)** - User-facing documentation, quick start guide
- **[DASHBOARD_IMPROVEMENTS.md](./DASHBOARD_IMPROVEMENTS.md)** - Recent UI enhancements
- **[MONETIZATION_PROGRESS.md](./MONETIZATION_PROGRESS.md)** - Business model implementation

---

## 🎯 What is Amoeba?

### Elevator Pitch
**Amoeba is the precision instrument for AI-powered microservices.**

Transform any data source into AI-generated content and deliver it anywhere—in minutes, not months. Self-hosted or managed. One-time license or predictable pricing. Your data, your infrastructure, your control.

### The Problem We Solve
Modern software development is drowning in boilerplate:
- **Content generation** requires managing multiple AI APIs
- **Data integration** means writing connectors for every source
- **Automation** demands cron jobs, queues, error handling
- **Delivery** needs email templates, webhook logic, retry systems

**Result:** Weeks of development for simple workflows.

### The Amoeba Solution
```
Data Source → AI Processing → Delivery
     ↓              ↓             ↓
  [3 clicks]   [1 template]  [1 config]
     ↓              ↓             ↓
  5 minutes total, not 5 weeks
```

**We handle the plumbing. You focus on the value.**

---

## 🏛️ Core Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│               User Interface Layer                   │
│    CLI ─────── Web Dashboard ─────── REST API       │
└──────────────────┬──────────────────────────────────┘
                   │
            ┌──────┴──────┐
            │   Gateway   │ (Auth, Rate Limit, Routing)
            └──────┬──────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
   ┌───▼───┐   ┌──▼──┐   ┌───▼────┐
   │ Data  │   │ AI  │   │Delivery│
   │Source │   │Proc │   │Service │
   └───┬───┘   └──┬──┘   └───┬────┘
       │          │          │
       └──────────┼──────────┘
                  │
          ┌───────┴───────┐
          │               │
       [Queue]        [Database]
    (RabbitMQ)      (PostgreSQL)
```

### Data Flow

**1. Input → Amoeba**
- RSS feeds
- REST APIs
- Webhooks (incoming)
- Static data
- Databases (coming Phase 2)
- Message queues (coming Phase 2)

**2. Processing in Amoeba**
- Template-based transformation
- Variable substitution
- AI content generation (OpenAI, Anthropic, Cohere, Ollama)
- Data validation
- Error handling

**3. Output → Anywhere**
- Email (SendGrid, AWS SES, SMTP)
- Webhooks (outgoing)
- REST API responses
- File system
- Slack/Discord (coming Phase 2)
- SMS (coming Phase 2)

### Technology Stack

**Backend:**
- **Runtime:** Node.js 18+ (TypeScript)
- **Framework:** Express.js
- **Database:** PostgreSQL 14+ (Drizzle ORM)
- **Queue:** In-memory (Phase 1), RabbitMQ (Phase 2)
- **Auth:** OAuth 2.0 (Kinde)
- **Encryption:** AES-256-GCM

**Frontend:**
- **Framework:** React 18+ (TypeScript)
- **Styling:** Tailwind CSS + Radix UI
- **State:** React Query (TanStack Query)
- **Routing:** Wouter

**CLI:**
- **Framework:** Commander.js
- **UI:** Chalk, Ora, Prompts, CLI-Table3

**Infrastructure:**
- **Containerization:** Docker + Docker Compose
- **Orchestration:** Kubernetes (Helm charts in Phase 3)
- **Monitoring:** Built-in metrics (Prometheus in Phase 3)
- **Logging:** Structured JSON logs

---

## 🎨 Core Principles (from MANIFESTO.md)

### 1. Utility Over Features
If a feature can't be justified in one sentence, it doesn't belong.

### 2. Cohesion Like a Folding Knife
Components fit together perfectly, like a knife folding into its handle. Each part serves one purpose excellently.

### 3. Performance is a Feature
- API responses: < 100ms (p95)
- Dashboard load: < 2s
- Memory: < 512MB base
- Docker image: < 500MB

### 4. Self-Hosting is Sacred
Users own their data, infrastructure, and destiny. No lock-in.

### 5. Developer Experience Drives Adoption
- Setup in < 5 minutes
- First workflow in < 10 minutes
- Documentation for everything
- Error messages that explain AND fix

### 6. Open Core, Not Open Chaos
- Core is open source (MIT)
- Clear governance
- Sustainable business model
- Community-driven development

### 7. Security is Non-Negotiable
- All secrets encrypted (AES-256-GCM)
- TLS everywhere
- Input validation
- Regular security audits
- 24-hour CVE response

### 8. AI is a Tool, Not a Gimmick
Only use AI where it provides clear, measurable value.

### 9. Documentation is Code
If it's not documented, it's not done.

### 10. Economics Matter
Fair to users, sustainable for maintainers.

---

## 🗺️ Strategic Roadmap (from MANIFESTO.md)

### ✅ Phase 0: Foundation (COMPLETE)
- Multi-model AI support
- Basic data sources & delivery
- Scheduling, CLI, monitoring
- License management
- Encryption

**Status:** Production-ready core ✅

### 🔄 Phase 1: Stabilization (Q1 2025 - CURRENT)
**Goal:** Production-ready for 1,000 users

**Priorities:**
1. Backend completion (license & Ollama APIs)
2. 80% test coverage
3. Comprehensive documentation
4. Docker Compose + Kubernetes
5. CI/CD pipeline

**Timeline:** 8 weeks  
**Success:** <100ms p95, <2s load, 80% tests

### 🚀 Phase 2: Growth Features (Q2 2025)
**Goal:** Reach 10,000 users

**Key Features:**
1. **Visual Workflow Builder** - Drag-and-drop, no code required
2. **Database Integrations** - PostgreSQL, MySQL, MongoDB, Redis
3. **Messaging Platforms** - Slack, Discord, Teams, Telegram
4. **Plugin System** - Community extensions, marketplace

**Timeline:** 12 weeks  
**Success:** 10k users, 100+ workflows, 20+ plugins

### 🏢 Phase 3: Enterprise (Q3 2025)
**Goal:** 10+ enterprise contracts

**Key Features:**
1. **Multi-Tenancy** - Orgs, teams, RBAC, SSO
2. **Advanced Monitoring** - Tracing, alerts, custom dashboards
3. **High Availability** - Multi-region, auto-failover, 99.9% SLA
4. **Compliance** - GDPR, HIPAA, SOC 2

**Timeline:** 12 weeks  
**Success:** 10+ enterprises, $500k ARR, 99.9% uptime

### 🌍 Phase 4: Ecosystem (Q4 2025)
**Goal:** Self-sustaining community

**Initiatives:**
1. **Marketplace** - Plugins, templates, revenue share
2. **Developer Program** - Certification, partners
3. **Community** - Discord, meetups, conference

**Timeline:** 12 weeks  
**Success:** 100+ marketplace items, 1k Discord members

---

## 💰 Business Model

### Pricing Tiers

#### 🟢 Self-Hosted: $3.50 (One-Time)
**Target:** Developers, small teams, hobbyists

**Includes:**
- Full source code
- All core features
- Unlimited content generation
- Ollama support (zero API costs)
- Community support
- Lifetime updates

**Why $3.50?**
- Accessible to everyone
- Reference to South Park ("tree fiddy")
- Not about revenue, about adoption
- Real money (prevents tire-kickers)

#### 🔵 Managed Basic: $15/month
**Target:** Solo developers, startups

**Includes:**
- Everything in Self-Hosted
- Managed DigitalOcean droplet (1GB RAM, 1 vCPU)
- Automated backups
- SSL certificate
- Email support
- 1 operator

#### 🟣 Managed Pro: $60/month
**Target:** Growing teams, agencies

**Includes:**
- Everything in Basic
- Larger droplet (4GB RAM, 4 vCPU)
- Priority support (4h SLA)
- Custom domain
- Performance monitoring
- Unlimited operators
- White-label option

#### ⚫ Enterprise: Custom Pricing
**Target:** Large organizations, healthcare, finance

**Includes:**
- Everything in Pro
- Multi-region deployment
- SAML SSO, LDAP
- Dedicated account manager
- SLA guarantees (99.9%+)
- Custom feature development
- On-site training

### Additional Revenue Streams

1. **Marketplace** (70/30 split with creators)
   - Premium templates
   - Premium plugins
   - Integration packs

2. **Support Plans**
   - Bronze: $50/month (email, 48h)
   - Silver: $200/month (email + chat, 24h)
   - Gold: $500/month (phone + priority, 4h)

3. **Training & Services**
   - Online courses: $99-499
   - Certification: $299
   - Consulting: $200/hour
   - Implementation: Custom quotes

4. **White-Label**
   - License platform to agencies
   - $1,000/month + rev share

---

## 🛠️ Development Standards

### Code Quality

**Required:**
- TypeScript strict mode
- ESLint + Prettier
- >80% test coverage
- No console.logs in production
- Semantic versioning
- Conventional commits

**File Structure:**
```
amoeba/
├── server/              # Backend
│   ├── routes/         # API endpoints
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   └── index.ts        # Entry point
├── client/             # Frontend
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   └── hooks/      # Custom hooks
├── cli/                # Command-line
│   ├── commands/       # CLI commands
│   └── utils/          # CLI utilities
└── shared/             # Shared code
    └── schema.ts       # Database schema
```

### Naming Conventions

**Files:**
- `camelCase.ts` - Utilities
- `PascalCase.tsx` - React components
- `kebab-case.md` - Documentation

**Variables:**
- `camelCase` - Variables, functions
- `PascalCase` - Classes, types
- `SCREAMING_SNAKE_CASE` - Constants

**Database:**
- `snake_case` - Tables, columns
- Singular table names (`user`, not `users`)
- Foreign keys: `{table}_id`

### API Design

**REST Conventions:**
```
GET    /api/resources       # List
GET    /api/resources/:id   # Get one
POST   /api/resources       # Create
PUT    /api/resources/:id   # Update
DELETE /api/resources/:id   # Delete
```

**Response Format:**
```json
{
  "data": { ... },
  "error": "message",
  "meta": { "page": 1, "total": 100 }
}
```

### Testing Strategy

**Pyramid:**
```
         /\
        /E2E\      (10% - Critical paths)
       /------\
      /  INT  \    (20% - API endpoints)
     /--------\
    /   UNIT   \   (70% - Business logic)
   /------------\
```

**Coverage Targets:**
- Overall: >80%
- Services: >90%
- Routes: >80%
- Components: >70%

---

## 🚀 Quick Start (for Contributors)

### 1. Prerequisites
```bash
node -v    # 18.0.0 or higher
npm -v     # 9.0.0 or higher
docker -v  # 20.0.0 or higher (optional)
psql --version  # PostgreSQL 14+ (or Docker)
```

### 2. Clone & Install
```bash
git clone https://github.com/yourusername/Ameoba.git
cd Ameoba
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
# Edit .env with your values:
# - DATABASE_URL
# - ENCRYPTION_KEY
# - KINDE_* (auth)
# - OPENAI_API_KEY (optional)
```

### 4. Database Setup
```bash
# Option A: Docker
docker-compose up -d postgres

# Option B: Local PostgreSQL
createdb amoeba

# Run migrations
npm run db:push
```

### 5. Start Development
```bash
# Terminal 1: Backend
npm run dev:server

# Terminal 2: Frontend
npm run dev:client

# Terminal 3: CLI (optional)
npm run cli
```

### 6. Run Tests
```bash
npm test              # All tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### 7. Make Changes
```bash
git checkout -b feature/your-feature
# Make changes, add tests, update docs
npm run lint          # Check code style
npm run type-check    # Check TypeScript
npm test              # Run tests
```

### 8. Submit PR
```bash
git add .
git commit -m "feat: add your feature"
git push origin feature/your-feature
# Open PR on GitHub
```

---

## 📖 Documentation Structure

### For Users
- **README.md** - Overview, installation, quick start
- **docs/getting-started.md** - Detailed setup guide
- **docs/user-guide.md** - Feature documentation
- **docs/api-reference.md** - REST API docs
- **docs/cli-reference.md** - CLI commands
- **docs/examples/** - Example workflows

### For Contributors
- **MANIFESTO.md** - Principles, standards, roadmap ⭐
- **CONTRIBUTING.md** - Contribution process
- **docs/architecture.md** - System design
- **docs/development.md** - Dev environment setup
- **docs/testing.md** - Testing guide
- **docs/deployment.md** - Deployment guide

### For Decision-Making
- **ADR/** (Architecture Decision Records)
  - `001-typescript.md`
  - `002-postgresql.md`
  - `003-react.md`
  - etc.

---

## 🎯 Feature Decision Framework

### Before Adding a Feature, Ask:

**1. What problem does this solve?**
- Be specific
- Provide examples
- Quantify pain (1-10)

**2. Who needs this?**
- User personas
- Market size
- Willingness to pay

**3. What's the cost?**
- Dev time (hours)
- Maintenance burden
- Performance impact
- Tech debt

**4. Does it align?**
- Mission fit
- Business model
- Strategic value
- Community desire

### Decision Matrix

| Impact | Cost | Decision |
|--------|------|----------|
| High   | Low  | ✅ Do now |
| High   | High | 📋 Roadmap |
| Low    | Low  | 🤝 Community |
| Low    | High | ❌ Reject |

---

## 🏆 Contribution Recognition

### How We Recognize Contributors

**1. Code Contributors**
- Name in README.md
- "Core Contributor" GitHub badge
- Swag pack (stickers, t-shirt)
- Free enterprise license

**2. Major Contributors**
- Early access to features
- Voice in roadmap decisions
- Revenue share on marketplace items
- Speaking opportunities

**3. Bounty Program**
- Bug fixes: $50-500
- Security: $100-1,000
- Major features: $500-5,000
- Plugins: $100-1,000

### Hall of Fame

Updated monthly with:
- Lines contributed
- PRs merged
- Issues resolved
- Community help

---

## 📊 Success Metrics

### Technical Health
- [ ] Test coverage >80%
- [ ] Build time <2 minutes
- [ ] Zero critical vulnerabilities
- [ ] API p95 <100ms
- [ ] Dashboard load <2s

### User Success
- [ ] Setup time <5 minutes
- [ ] Time to first workflow <10 minutes
- [ ] Documentation score >4.5/5
- [ ] NPS >50
- [ ] Support response <24h

### Business Health
- [ ] MAU growth >20% MoM
- [ ] Churn <5%
- [ ] Revenue growth >20% MoM
- [ ] Gross margin >80%
- [ ] Runway >12 months

### Community Health
- [ ] Discord members growing
- [ ] GitHub stars growing
- [ ] PR merge rate >80%
- [ ] Issue close rate >90%
- [ ] Community plugins growing

---

## 🚫 What We Won't Build

### Anti-Features

**1. Native Mobile Apps**
- Mobile browsers work fine
- 2x maintenance burden
- **Use:** Progressive Web App instead

**2. Built-in CRM**
- Not our core competency
- Saturated market
- **Use:** Integrate with Salesforce, HubSpot

**3. Social Network Features**
- Users don't need to "friend" each other
- Scope creep
- **Use:** External communication tools

**4. Blockchain Integration**
- No clear use case
- Technical complexity
- **Use:** Traditional databases

**5. Video Conferencing**
- Use Zoom, Meet, Teams
- Not our wheelhouse
- **Use:** Calendar integrations instead

---

## 🔮 Long-Term Vision (2026+)

### The Goal
**Amoeba becomes the default choice for AI-powered microservices.**

### Success Looks Like
- 100,000+ active users
- 1,000+ marketplace items
- 500+ community plugins
- 100+ enterprise customers
- $10M+ ARR
- Profitable and sustainable

### Impact
- Developers ship 10x faster
- Small teams compete with enterprises
- AI becomes accessible to all
- Fair pricing becomes industry norm
- Community-driven innovation thrives

---

## 💬 Get Involved

### Join the Community

**Discord:** [discord.gg/ameoba](https://discord.gg/ameoba)
- Get help
- Share workflows
- Discuss features
- Meet other users

**GitHub:** [github.com/yourusername/Ameoba](https://github.com/yourusername/Ameoba)
- Report bugs
- Request features
- Submit PRs
- Star the repo ⭐

**Email:**
- General: hello@ameoba.org
- Support: support@ameoba.org
- Security: security@ameoba.org

### Ways to Contribute

**1. Code**
- Fix bugs
- Add features
- Improve performance
- Write tests

**2. Documentation**
- Write guides
- Create examples
- Improve clarity
- Add translations

**3. Design**
- UI mockups
- UX improvements
- Iconography
- Branding

**4. Community**
- Answer questions
- Write blog posts
- Create videos
- Share on social media

**5. Testing**
- Try beta features
- Report bugs
- Suggest improvements
- Provide feedback

---

## 📜 Philosophy

**We believe:**

1. **Software should be a tool, not a trap.**  
   Users should own their data and infrastructure.

2. **Complexity is the enemy.**  
   Simple systems scale. Complex systems fail.

3. **Performance is respect.**  
   Fast software respects users' time.

4. **Documentation is empathy.**  
   Good docs show you care about users.

5. **Open source is the future.**  
   Transparency builds trust. Community builds excellence.

6. **Economics must align.**  
   Fair pricing for users. Sustainable revenue for maintainers.

7. **AI is a means, not an end.**  
   Use AI where it adds value, not for buzzwords.

8. **Community over corporation.**  
   User needs drive decisions, not quarterly earnings.

9. **Quality over speed.**  
   Better to ship late than ship broken.

10. **Excellence is achievable.**  
    With discipline, principles, and pride in craft.

---

## 🔑 Key Takeaways

### For Users
✅ Self-host or managed - your choice  
✅ One-time license ($3.50) or predictable monthly  
✅ Connect any data source to any AI to any destination  
✅ Visual builder + CLI + API for all skill levels  
✅ Zero lock-in, full data ownership  

### For Contributors
✅ Clear principles and standards  
✅ Welcoming, active community  
✅ Fair recognition and rewards  
✅ Transparent roadmap and governance  
✅ Modern, well-architected codebase  

### For the Industry
✅ Proof that open core can be sustainable  
✅ Fair pricing is possible and profitable  
✅ Community-driven beats corporate-driven  
✅ Quality and speed aren't mutually exclusive  
✅ The best tools empower users, not trap them  

---

## 📚 Further Reading

**Essential Documents:**
1. [MANIFESTO.md](./MANIFESTO.md) - Start here ⭐
2. [VISION_PROTOOLZ.md](./VISION_PROTOOLZ.md) - Where we're going
3. [CONTRIBUTING.md](./CONTRIBUTING.md) - How to help

**Technical Docs:**
- [Architecture Overview](./docs/architecture.md)
- [API Reference](./docs/api-reference.md)
- [CLI Reference](./docs/cli-reference.md)

**Learning Resources:**
- [Getting Started Guide](./docs/getting-started.md)
- [Example Workflows](./docs/examples/)
- [Video Tutorials](https://youtube.com/@ameobadev)

---

**Last Updated:** January 2025  
**Version:** 1.0.0  
**Status:** Living Document

---

*"The best software is invisible. It just works."*

*"Build tools you'd want to use. Then others will too."*

*"Precision, utility, cohesion - like a folding knife."*

— **The Amoeba Way**




