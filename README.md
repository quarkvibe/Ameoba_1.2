# 🦠 Amoeba - AI Agent Platform You Control From Your Phone

[![npm version](https://badge.fury.io/js/amoeba-cli.svg)](https://www.npmjs.com/package/amoeba-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

**The world's first AI agent platform with SMS command interface, professional quality control, and self-modifying capabilities.**

Text your Twilio number: **"generate newsletter"** and it happens. Text **"status"** and know everything. Or use the beautiful dashboard. Or the powerful CLI. **Your choice.**

```bash
npm install -g amoeba-cli
amoeba init
amoeba generate "daily tech summary from HackerNews" --deliver sms,email,voice
```

**Self-hosted. BYOK. Three first-class interfaces. $29/month.**

---

## ⚡ What Makes Amoeba Unique

### 📱 Control From Your Phone (NO OTHER PLATFORM HAS THIS)

```
You: Text "status" to your Twilio number
Amoeba: "✅ All healthy. 3 jobs running, 15 generated today"

You: Text "generate newsletter"
Amoeba: "🤖 Done! Quality: 92/100. Delivered via email"

You: Text "approve all"
Amoeba: "✅ Approved 3 items. Delivered!"
```

**Manage your entire AI platform from any phone. No app required.**

---

### 🤖 AI Agent with Native Tools (Not Just Text Generation)

```
User: "Fetch top financial news and send me a text summary"

Amoeba AI:
1. Calls fetch_rss_feed("financial-news-url") → Gets articles
2. Analyzes content
3. Calls optimize_for_sms() → Creates 160-char version
4. Sends SMS via Twilio
5. Done! (3 seconds)

Autonomous. Intelligent. Powerful.
```

**7 native tools. No additional API keys needed. AI fetches data, optimizes, delivers.**

---

### 🛡️ Enterprise Quality Control (Rare in AI Platforms)

```
AI Output → Parse Format → Safety Check → Quality Score (0-100) 
         → Cleanup → Validate → Review (optional) → Deliver

Every piece scored, validated, optionally reviewed.
Not just whatever the AI spits out.
```

**Professional-grade output. Compliance-ready. Review workflow built-in.**

---

### 🎨 Three First-Class Interfaces (Not "No-Code", Not "Code-Only")

**📊 Beautiful Dashboard:**
- Visual configuration, real-time monitoring
- Traffic light health indicators (🟢🟡🔴)
- Anyone can use, no technical knowledge needed

**💻 Powerful CLI (61 commands):**
- Scriptable, automatable, embeddable
- JSON output for CI/CD integration
- Use as library in your apps

**📱 SMS Commands:**
- Control from any phone
- Natural language + CLI commands
- Mobile-first admin

**Choose your interface. They're all powerful.**

---

### 🗄️ Universal Storage (Start Simple, Scale When Ready)

```bash
# Development: SQLite (zero config!)
DATABASE_TYPE=sqlite
npm run dev  # Works immediately

# Production: PostgreSQL (scalable)
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://neon.tech/...  # Free tier!

# Switch anytime, same code
```

**Baseline serverless (SQLite). Production scalable (PostgreSQL). Swap via one env var.**

---

### 🧬 Self-Modifying (Phase 3 - Foundation Ready)

```
You: "Add Discord webhook support"
AI: Generates discordService.ts + routes
You: Review diff → Approve
Amoeba: Applies changes → New feature added

Safety: AI CANNOT modify its own modification code
Result: Infinite extensibility, zero risk
```

**The platform that improves itself. Safely.**

---

### 🔬 Self-Reproducing (Cellular Mitosis - NEW!)

```
Task: Generate 100 product descriptions

Amoeba analyzes:
- Sequential: 100 × 3s = 5 minutes
- Parallel: 10 children × 10 items = 30 seconds
- Efficiency: 90% faster!

Amoeba: "Spawn 10 children for 90% efficiency gain?"
Manager: Approves
→ 10 child Amoebas spawn
→ Each handles 10 descriptions
→ All work in parallel
→ Complete in 30 seconds
→ Children terminate
→ Results merged & delivered

10-100x faster for bulk tasks.
```

**The platform that spawns workers when needed. Efficiently.**

---

### 🛡️ Self-Preserving (Immune System - NEW!)

```
Health Guardian monitors every 30 seconds:
- Database connection
- Service health
- Memory usage
- Configuration validity
- System integrity

Issues detected:
→ Auto-fix attempted (3 tries)
→ Circuit breaker if persistent
→ Alert if critical
→ Emergency recovery if needed

Traffic lights: 🟢 Healthy | 🟡 Degraded | 🔴 Critical

Validation before changes:
→ Syntax checked
→ Types verified
→ System health validated
→ Bad changes BLOCKED

Result: System stays alive and correct as it evolves.
```

**The platform that protects itself. Continuously.**

---

## 🚀 Quick Start (5 Minutes)

### Install

```bash
git clone https://github.com/quarkvibe/Ameoba_1.2.git
cd Ameoba_1.2
npm install
```

### Run (Zero Config with SQLite)

```bash
npm run dev
# Opens http://localhost:5000
# SQLite database auto-created
# Works immediately! ✅
```

**That's it.** No database server, no configuration, just works.

---

## 📖 Complete Feature Set

### 🤖 AI Capabilities

**Multi-Provider Support:**
- OpenAI (GPT-4, GPT-4o, GPT-4o-mini)
- Anthropic (Claude 3.5 Sonnet, Opus)
- Cohere
- Ollama (local, FREE!)

**AI Agent Features:**
- **Function calling** (OpenAI + Anthropic)
- **7 native tools** (RSS, web, APIs - no extra keys!)
- **Autonomous data fetching** (AI decides what it needs)
- **Content optimization** (auto-adapts to delivery channel)

**Tools Included (All FREE):**
1. `fetch_rss_feed` - Get news/articles from any RSS feed
2. `fetch_webpage` - Read content from any URL
3. `extract_text` - Parse HTML to clean text
4. `fetch_json` - Call any JSON API
5. `extract_data` - JSONPath extraction
6. `optimize_for_sms` - Format for text messages
7. `optimize_for_voice` - Format for text-to-speech

---

### 🛡️ Quality & Safety

**6-Stage Output Pipeline:**
1. **Parse Format** - JSON, Markdown, HTML handling
2. **Safety Check** - PII detection, harmful content filtering
3. **Quality Score** - 0-100 based on 10+ factors
4. **Cleanup** - Remove artifacts, fix formatting
5. **Validation** - Length, keywords, requirements
6. **Review** - Optional human approval

**Safety Features:**
- PII detection (emails, phones, SSN, credit cards)
- Placeholder detection (TODO, FIXME)
- Content moderation ready (OpenAI Moderation API)
- Audit trail for all changes

**Review Workflow:**
- Human approval queue
- Auto-approval rules (e.g., "quality > 80")
- Bulk operations
- Statistics dashboard

---

### 📡 Multi-Channel Delivery

**6 Delivery Channels:**
1. **📧 Email** - SendGrid, AWS SES, SMTP
2. **📱 SMS** - Twilio text messages (NEW!)
3. **📞 Voice** - Text-to-speech phone calls (NEW!)
4. **🔗 Webhook** - POST to any URL
5. **🔌 API** - Retrieve via REST
6. **📄 File** - S3, local filesystem

**Auto-Optimization:**
- Email: Full HTML formatting
- SMS: 160-char optimized
- Voice: TTS-friendly with pauses
- Same content, perfect for each channel

---

### 📞 SMS Command Interface ⭐ UNIQUE!

**Control entire platform via text:**

```
Text Commands (to your Twilio number):
• "status" → System health
• "generate newsletter" → Create & deliver content
• "queue" → Show pending reviews
• "approve all" → Clear review queue
• "test" → Run system tests
• "logs error" → View error logs
• "What's the system health?" → Natural language!

2-5 second responses. Works on any phone. No app needed.
```

**Perfect for:**
- On-the-go management
- Weekend emergencies
- In meetings (under-table commands!)
- No-laptop situations
- Remote work

---

### 💻 Professional CLI (61 Commands)

**Full Feature Parity:**

```bash
# System
amoeba status, test, diagnostics, logs

# Database  
amoeba database:status       # Traffic lights: 🟢🟡🔴
amoeba database:switch sqlite

# Environment
amoeba env:set OPENAI_API_KEY sk-...
amoeba env:generate-key encryption

# Credentials
amoeba credentials:ai add
amoeba credentials:phone add

# Content
amoeba generate newsletter --deliver email,sms
amoeba content list --json

# Review
amoeba review:queue
amoeba review:approve-all

# Deployment
amoeba deployment:analyze
amoeba deployment:nginx > /etc/nginx/sites-available/amoeba

# And 40+ more commands!
```

**All with:**
- `--json` flag for automation
- `--interactive` for guided prompts
- Color coding & progress indicators
- Comprehensive help text

**Embeddable, scriptable, automatable.**

---

### 🎨 Beautiful Dashboard

**What You Get:**
- Real-time activity feed (WebSocket)
- Traffic light health system (🟢🟡🔴)
- Live terminal (27+ diagnostic commands)
- Quality metrics & statistics
- Review queue with diff viewer
- Credential management (AI, Email, Phone)
- Environment editor (.env from UI!)
- Agent configurator (system prompts, tools)
- Database switcher (SQLite ↔ PostgreSQL)
- Deployment guide (nginx, DNS, SSL)
- Testing & diagnostics
- SMS command configuration

**Professional SaaS UX. Self-hosted infrastructure.**

---

## 🏗️ Architecture: Cellular Design

**Like a biological cell:**

```
┌──────────────────────────────────────────────┐
│     MEMBRANE (API Layer)                     │
│  Auth │ Rate Limiting │ Validation           │
├──────────────────────────────────────────────┤
│ NUCLEUS     RIBOSOMES    GOLGI     MITOCHONDRIA│
│ (Core)      (Routes)     (Services) (Database) │
│ Business    HTTP         Processing  Storage  │
│ Logic       Handlers     & Delivery           │
├──────────────────────────────────────────────┤
│           CILIA (Integrations)                │
│ OpenAI│Anthropic│Twilio│SendGrid│More...     │
└──────────────────────────────────────────────┘
```

**Pattern:** One service (blob), multiple access points (cilia)

**Example:** Testing system accessible via API, SMS, CLI, Dashboard - all using one service.

**See:** [ARCHITECTURE.md](ARCHITECTURE.md) for complete details.

---

## 🔑 Complete BYOK (Bring Your Own Keys)

**You Provide (Your Cost, Your Control):**
- AI Provider Keys (OpenAI, Anthropic, or Ollama)
- Email Service (SendGrid, AWS SES - optional)
- Phone Service (Twilio - optional)
- Database (Neon.tech free tier or SQLite)

**You Pay:**
- AI: ~$0.0003-0.002 per generation (directly to OpenAI/Anthropic)
- Email: ~$0.0001 per email (directly to SendGrid)
- SMS: ~$0.0075 per message (directly to Twilio)
- Voice: ~$0.013 per minute (directly to Twilio)
- Database: $0 (SQLite or Neon free tier)

**Amoeba Platform:**
- Self-hosted: FREE (open source)
- License: $29/month (or $3.50 one-time for BYOK)

**No middleman fees. No usage surprises. Complete cost control.**

---

## 🌟 Why Amoeba?

| Feature | Amoeba | Zapier | Make | n8n | Twilio Autopilot |
|---------|--------|--------|------|-----|------------------|
| **AI Agent with Tools** | ✅ 7 native | ❌ | ❌ | ⚠️ Limited | ⚠️ Basic |
| **Quality Pipeline** | ✅ 6-stage | ❌ | ❌ | ❌ | ❌ |
| **SMS Commands** | ✅ UNIQUE! | ❌ | ❌ | ❌ | ❌ |
| **CLI (Full Parity)** | ✅ 61 cmds | ❌ | ❌ | ⚠️ Basic | ❌ |
| **SMS Delivery** | ✅ Twilio | ⚠️ Limited | ⚠️ Limited | ❌ | ✅ |
| **Voice/TTS Delivery** | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Self-Modifying AI** | ✅ Phase 3 | ❌ | ❌ | ❌ | ❌ |
| **Universal Storage** | ✅ Swap DBs | ❌ | ❌ | ⚠️ | ❌ |
| **Self-Hosted** | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Complete BYOK** | ✅ All services | ❌ | ❌ | ⚠️ Partial | ❌ |
| **Open Source** | ✅ MIT | ❌ | ❌ | ✅ Apache | ❌ |
| **Price/month** | **$29** | $20-599 | $9-299 | $20-500 | $99-499 |

**Amoeba is the ONLY platform with SMS commands, quality pipeline, AND complete self-hosting!**

---

## 🎯 Use Cases

### For Agencies
```
- Generate client content with quality assurance
- White-label with custom branding
- Multi-client management
- Review workflow before client delivery
- Cost control (clients' API keys)
- SMS alerts for urgent approvals
```

### For Developers
```
- Embed in your applications (CLI/API)
- CI/CD integration (automated workflows)
- Headless deployment (no UI needed)
- Custom integrations (extend via code)
- Self-hosted (complete control)
- Open source (audit, modify, contribute)
```

### For Businesses
```
- Multi-channel communication (email, SMS, voice)
- Quality control (every output scored)
- Compliance ready (audit trail, review workflow)
- Cost effective (BYOK, pay direct to providers)
- Scalable (SQLite → PostgreSQL seamless)
- Professional (enterprise-grade features)
```

### For Content Teams
```
- Content generation with templates
- Quality scoring (know what's good)
- Review queue (approve before publish)
- Multi-format output (blog, social, email)
- Scheduled automation (daily, weekly)
- Real-time collaboration
```

---

## 🚀 Installation & Setup

### Option 1: Quick Start with SQLite (Zero Config!)

```bash
# Install
npm install -g amoeba-cli

# Initialize
amoeba init

# Run
npm run dev

# Visit http://localhost:5000
# Dashboard loads with SQLite (no database server needed!)
# Add your OpenAI key via UI
# Start generating content ✅
```

**5 minutes from install to first generation.**

---

### Option 2: Production with PostgreSQL

```bash
# Install
npm install -g amoeba-cli

# Configure (via UI or CLI)
amoeba database:switch postgres
amoeba env:set DATABASE_URL postgresql://neon.tech/...
amoeba env:set ENCRYPTION_KEY $(amoeba env:generate-key encryption)

# Or via Dashboard:
# → Database → Setup Server-Side DB → Paste Neon.tech URL

# Deploy
npm run build
npm start

# Production ready! ✅
```

**Free PostgreSQL from Neon.tech or Supabase.**

---

## 📚 Documentation

### Quick Links
- **[START_HERE.md](START_HERE.md)** - 5-minute orientation
- **[CLI_PARITY_MATRIX.md](CLI_PARITY_MATRIX.md)** - UI/CLI feature comparison
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Cellular design philosophy
- **[VISION.md](VISION.md)** - Product vision & roadmap

### Guides
- **[Quick Start](docs/guides/QUICK_START_GUIDE.md)** - 30-minute walkthrough
- **[Deployment](docs/guides/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Multi-Service](docs/guides/MULTI_SERVICE_DEPLOYMENT.md)** - Deploy alongside other apps
- **[CLI Commands](docs/guides/CLI_COMMANDS.md)** - Complete CLI reference

### Core Philosophy
- **[MANIFESTO.md](MANIFESTO.md)** - Development principles
- **[SIMPLICITY_DOCTRINE.md](SIMPLICITY_DOCTRINE.md)** - Code standards
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - How to contribute

---

## 🌐 Deployment Scenarios

### Scenario A: Fresh Server
```
Just run Amoeba. Access at http://YOUR_IP:5000
Simple, fast, works.
```

### Scenario B: Existing Website
```
Your site: example.com → nginx → port 3000
Amoeba: amoeba.example.com → nginx → port 5000

Dashboard → Deployment generates nginx config for you.
Copy-paste, reload nginx, done.
```

### Scenario C: Multiple Apps
```
Amoeba detects other services
Suggests subdomain: amoeba.yourdomain.com
Generates nginx config for your exact setup
Provides DNS instructions
Validates everything

Zero-conflict installation.
```

---

## 💰 Pricing

**Platform:** FREE (Open Source, MIT License)

**Your Infrastructure:**
- Development: $0 (SQLite is free!)
- Production: $0-10/month (Neon.tech/Supabase free tier)

**Your API Costs (Pay Direct to Providers):**
- AI: $0.0003-0.002 per generation (OpenAI/Anthropic)
- Email: $0.0001 per email (SendGrid)
- SMS: $0.0075 per message (Twilio)
- Voice: $0.013 per minute (Twilio)

**Amoeba License (Optional):**
- Self-Host: $3.50 one-time (lifetime)
- Pro: $29/month (includes support)
- Business: $79/month (priority support, white-label)
- Enterprise: Custom (SLA, dedicated support)

**No usage-based fees. No surprises. You control costs.**

---

## 🎓 Learn More

### Examples

**Generate & Deliver:**
```bash
amoeba generate newsletter --deliver email,sms
```

**Via Dashboard:**
```
Dashboard → Generation → Select Template → Generate → Quality: 92/100 → Deliver
```

**Via SMS:**
```
Text: "generate newsletter"
Reply: "🤖 Done! Q: 92/100. Email sent."
```

**Via API:**
```javascript
POST /api/content/generate
{
  "templateId": "newsletter",
  "deliverVia": ["email", "sms"]
}
```

**Four ways. Same result.**

---

### Advanced Features

**Quality Control:**
```javascript
// Template settings:
{
  "requireApproval": true,
  "autoApprovalRules": [
    { "field": "qualityScore", "condition": "greater_than", "value": 80 },
    { "field": "safetyFlags", "condition": "equals", "value": [] }
  ],
  "minLength": 500,
  "requiredKeywords": ["AI", "automation"]
}

// High quality auto-approves, low quality requires review
```

**AI Tools:**
```javascript
// Enable autonomous data fetching:
{
  "toolsEnabled": true,
  "maxToolCalls": 5
}

// AI can now:
// - Fetch RSS feeds
// - Read web pages
// - Call APIs
// - All automatically!
```

**SMS Commands:**
```
Configure in Dashboard → SMS Commands → Authorize your phone
Or: amoeba sms-cmd:authorize +1234567890
Then text your Twilio number with commands!
```

---

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md).

**Areas We Need Help:**
- Additional AI provider integrations
- More delivery channels (Slack, Discord, Teams)
- Database adapters (MySQL, MongoDB)
- Template marketplace
- Language translations
- Documentation improvements

**How to Contribute:**
1. Read [MANIFESTO.md](MANIFESTO.md) (core principles)
2. Read [ARCHITECTURE.md](ARCHITECTURE.md) (cellular design)
3. Fork repository
4. Create feature branch
5. Follow coding standards (TypeScript, cellular pattern)
6. Write tests (80% coverage required)
7. Submit PR

**Contributor Benefits:**
- Name in README
- Revenue share (marketplace items)
- Early access to features
- Voice in roadmap

---

## 🗺️ Roadmap

### ✅ Phase 0-1: Foundation (COMPLETE)
- Multi-provider AI generation
- Quality control pipeline (6-stage)
- Native AI tools (7 tools)
- Voice & SMS delivery
- SMS command interface ⭐
- Universal storage (SQLite + PostgreSQL)
- Dual interface (UI + CLI parity - 66 commands!)
- Testing & diagnostics
- Deployment integration
- Database configuration UI
- **Self-preservation system** (health guardian, validation pipeline)
- **Self-modification foundation** (AI code gen with safety)
- **Self-reproduction system** (cellular mitosis)

### 🔄 Phase 2: Polish & Launch (Week 1-3)
- Fix remaining TypeScript errors
- Write automated tests (80% coverage)
- Performance benchmarks
- Production deployment (AWS/Vercel)
- Product Hunt launch! 🚀

### 📅 Phase 3: Full Autonomy (Month 2)
- Connect AI code generation (Claude/GPT-4)
- Auto-spawn rules (remove manager approval)
- Template intelligence
- Learned optimization
- Community beta testing

### 🔮 Phase 4: Ecosystem (Month 3+)
- Branch marketplace
- Template sharing
- Plugin system
- Revenue sharing (70/30 split)
- Developer certification
- Multi-instance orchestration

---

## 📊 Technical Stack

**Backend:**
- Node.js 18+ / TypeScript
- Express.js (HTTP server)
- Drizzle ORM (type-safe database)
- PostgreSQL or SQLite (universal storage)
- WebSocket (real-time updates)

**Frontend:**
- React 18 + TypeScript
- Radix UI (components)
- Tailwind CSS (styling)
- React Query (data fetching)
- Wouter (routing)

**Integrations:**
- OpenAI, Anthropic, Cohere, Ollama (AI)
- Twilio (SMS & voice)
- SendGrid, AWS SES (email)
- Stripe (payments)

**Infrastructure:**
- Docker (containerization)
- Nginx (reverse proxy)
- Let's Encrypt (SSL)
- PM2 (process management)

---

## 🆘 Support

- **Documentation**: [/docs](/docs)
- **Issues**: [GitHub Issues](https://github.com/quarkvibe/Ameoba_1.2/issues)
- **Discussions**: [GitHub Discussions](https://github.com/quarkvibe/Ameoba_1.2/discussions)
- **Email**: support@quarkvibe.com

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

Copyright (c) 2025 QuarkVibe Inc.

---

## 🙏 Acknowledgments

- OpenAI, Anthropic, Cohere for AI APIs
- Twilio for SMS & voice infrastructure
- Neon.tech, Supabase for database hosting
- Radix UI for component primitives
- Drizzle Team for excellent ORM
- The open-source community

---

## ⭐ Star History

If you find Amoeba useful, give it a star! It helps others discover the project.

[![Star History Chart](https://api.star-history.com/svg?repos=quarkvibe/Ameoba_1.2&type=Date)](https://star-history.com/#quarkvibe/Ameoba_1.2&Date)

---

**Made with ❤️ and architectural precision by QuarkVibe Inc.**

**Give it a ⭐️ if you like it!**

---

## 🚀 What People Are Saying

> "The SMS command interface is genius. I can check my system from anywhere." - Early Adopter

> "Finally, an AI platform where I control the costs. BYOK is the future." - Agency Owner  

> "The CLI is so powerful. I embedded Amoeba in my app in 30 minutes." - Developer

> "Quality pipeline caught issues before they went to clients. Saved us!" - Content Team

---

## 🔥 Get Started Now

```bash
npx amoeba-cli init
cd amoeba
npm run dev
```

**3 commands. 30 seconds. You're generating AI content.**

**Welcome to the future of AI platforms.** 🦠🚀
