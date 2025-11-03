# 🦠 Amoeba - Start Here

**Welcome to Amoeba!** This 5-minute guide gets you oriented.

---

## 🎯 What is Amoeba?

**The world's first AI agent platform you can control from your phone.**

Amoeba is not just another AI tool. It's an **enterprise-grade AI communication platform** with:
- **SMS command interface** (text "generate newsletter", it happens)
- **Quality control pipeline** (every output scored 0-100)
- **Native AI tools** (autonomous data fetching)
- **Multi-channel delivery** (email, SMS, voice, webhook, API, file)
- **Three first-class interfaces** (Dashboard, CLI, SMS)
- **Universal storage** (SQLite baseline, PostgreSQL production)
- **Self-modifying capabilities** (AI can add features with approval)

**Self-hosted. BYOK. Perfect architecture. $29/month.**

---

## ⚡ Quick Start (30 Seconds)

```bash
git clone https://github.com/quarkvibe/Ameoba_1.2.git
cd Ameoba_1.2
npm install
npm run dev
```

Open **http://localhost:5000**

**That's it.** SQLite database auto-created. Works immediately.

---

## 🎨 Three Ways to Use Amoeba

### 1. 📊 Beautiful Dashboard

```
http://localhost:5000

Visual interface with:
✅ Real-time monitoring (WebSocket updates)
✅ Traffic light health indicators (🟢🟡🔴)
✅ One-click operations
✅ Guided workflows
✅ Live terminal
✅ No technical knowledge needed

Perfect for: Anyone, teams, visual learners
```

---

### 2. 💻 Powerful CLI (61 Commands)

```bash
amoeba status                    # System health
amoeba generate newsletter       # Create content
amoeba database:switch sqlite    # Configure database
amoeba env:set OPENAI_API_KEY sk-...  # Add credentials
amoeba review:approve-all        # Clear queue
amoeba deployment:analyze        # Check deployment
amoeba test                      # Run tests

# All scriptable, automatable, embeddable
```

**Perfect for: Developers, automation, CI/CD, embedding in apps**

---

### 3. 📱 SMS Commands (UNIQUE!)

```
Text your Twilio number:

"status" → "✅ All healthy. 3 jobs running."
"generate newsletter" → "🤖 Done! Q: 92/100."
"queue" → "📋 2 pending reviews"
"approve all" → "✅ Approved & delivered!"

Control from any phone. No app needed.
```

**Perfect for: On-the-go, emergencies, mobile-first**

---

## 🔑 Core Concepts

### 1. Templates (Content Blueprints)

```
Template = Instructions for AI

Example:
Name: "Daily Newsletter"
Prompt: "Summarize top tech news in 500 words"
Tools: Enabled (AI can fetch news automatically)
Deliver: Email + SMS
Schedule: Daily at 9 AM

Create once, run forever.
```

---

### 2. AI Tools (Autonomous Data Fetching)

```
User: "Fetch top HackerNews posts and summarize"

AI automatically:
1. Calls fetch_rss_feed("https://hnrss.org/newest")
2. Gets 10 posts
3. Analyzes content
4. Generates summary

No manual configuration! AI handles it.
```

**7 native tools. All free. No extra API keys.**

---

### 3. Quality Pipeline (Professional Output)

```
AI generates → Parse → Safety Check → Quality Score
           → Cleanup → Validate → Review → Deliver

Every output:
✅ Scored 0-100
✅ Checked for PII, harmful content
✅ Cleaned & formatted
✅ Optionally reviewed by human
✅ Delivered when approved

Not just raw AI output!
```

---

### 4. Multi-Channel Delivery

```
One content → Multiple channels (auto-optimized):

Email:  Full article with HTML formatting
SMS:    160-char summary with link
Voice:  TTS-optimized with pauses
Webhook: JSON payload
API:    Retrieve programmatically
File:   Save to S3/local

Same content, perfect for each channel.
```

---

## 🎯 First 5 Minutes

### Dashboard Path (Visual):

```
1. Open http://localhost:5000
2. Dashboard → Database: 🟢 SQLite Connected (auto!)
3. Dashboard → Credentials → Add AI Credential
   - Select OpenAI
   - Paste API key
   - Save
4. Dashboard → Templates → Create Template
   - Name: "Test"
   - Prompt: "Write a haiku about AI"
   - Save
5. Click "Generate"
6. Wait 3 seconds
7. See: Quality score 88/100, content generated! ✅

5 minutes. Working.
```

---

### CLI Path (Terminal):

```bash
# 1. Add credential
amoeba credentials:ai add \
  --provider openai \
  --name "My OpenAI" \
  --api-key sk-...

# 2. Create template
amoeba templates:create \
  --name "Test" \
  --prompt "Write a haiku about AI"

# 3. Generate
amoeba generate test

# Output: Content + quality score
# 5 commands. Working. ✅
```

---

### SMS Path (Mobile):

```
1. Dashboard → Credentials → Phone → Add Twilio
2. Dashboard → SMS Commands → Authorize Your Phone
3. Text your Twilio number: "help"
4. Reply: List of commands
5. Text: "status"
6. Reply: "✅ All healthy"

Works from any phone! ✅
```

---

## 📊 What's Included

### 13 Complete Systems:

1. **AI Generation** - 4 providers, function calling, 7 native tools
2. **Quality Pipeline** - 6-stage processing, scoring (0-100), safety
3. **Review Workflow** - Human approval, auto-rules, statistics
4. **Multi-Channel Delivery** - Email, SMS, voice, webhook, API, file
5. **SMS Commands** - Control via text message (UNIQUE!)
6. **Testing System** - 5 test suites, logs, diagnostics
7. **Deployment Intelligence** - Conflict detection, nginx, DNS, SSL
8. **Universal Storage** - SQLite baseline, PostgreSQL production, swappable
9. **Environment Management** - .env from UI/CLI with validation
10. **Database Configuration** - Traffic lights (🟢🟡🔴), switcher UI
11. **Self-Modification** - AI adds features with safety boundaries
12. **Self-Preservation** - Health guardian, auto-healing, validation
13. **Self-Reproduction** - Spawn children for 10-100x efficiency!

**Plus:**
- Real-time monitoring
- Traffic light health system
- Credential management (UI/CLI)
- Agent configuration
- Database switcher
- 61 CLI commands
- 35+ dashboard views
- Complete API (100+ endpoints)

---

## 🏆 What Makes It Special

### Unique Combination (NO Competitor Has This):

**Living System Capabilities:**
- ✅ **Self-Preservation** - Health monitoring, auto-healing, validates changes
- ✅ **Self-Modification** - AI adds features with approval (safety boundaries)
- ✅ **Self-Reproduction** - Spawns children for 10-100x efficiency

**Enterprise Features:**
- ✅ **SMS command interface** - Control from phone (text "status", "generate")
- ✅ **Quality pipeline** - 6-stage processing, 0-100 scoring
- ✅ **Native AI tools** - 7 tools, no extra API keys needed
- ✅ **Review workflow** - Human approval with auto-rules

**Developer-Friendly:**
- ✅ **CLI parity** - 66 commands, scriptable, embeddable
- ✅ **Universal storage** - Swap databases via env var
- ✅ **Headless mode** - Run without UI
- ✅ **API-first** - Programmatic control

**Economic:**
- ✅ **Complete BYOK** - AI, email, phone (your keys, your cost)
- ✅ **Self-hosted** - Your data, your infrastructure
- ✅ **$29/month** - vs $470 competitors

**This is the first LIVING AI platform.** 🦠

---

## 📚 Next Steps

### For Users:
1. Read [Quick Start Guide](docs/guides/QUICK_START_GUIDE.md)
2. Add your credentials (OpenAI, Twilio, etc.)
3. Create your first template
4. Generate content
5. Set up delivery channels
6. Automate with schedules

### For Developers:
1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Explore CLI: `amoeba --help`
3. Check API: [API docs]
4. Clone a branch (specialized use case)
5. Customize for your needs
6. Contribute back!

### For Deploying:
1. Read [Deployment Guide](docs/guides/DEPLOYMENT_GUIDE.md)
2. Choose database (SQLite or PostgreSQL)
3. Configure via Dashboard or CLI
4. Use deployment analyzer
5. Follow nginx/DNS guidance
6. Deploy with confidence

---

## 🔮 The Vision

**From VISION.md:**

> Amoeba is not a tool. It's a **living system**.
>
> Like a biological amoeba:
> - **Adaptable** - Takes any form required
> - **Self-sufficient** - Runs with minimal resources
> - **Self-modifying** - Evolves based on needs
> - **Simple** - Complex from simple components
> - **Resilient** - Survives any environment

**Phase 1:** Configuration via natural language ✅ (DONE)  
**Phase 2:** Template intelligence ✅ (READY)  
**Phase 3:** Code modification ✅ (Foundation complete!)  
**Phase 4:** Self-evolution ⏳ (Future)

**The platform that improves itself. Safely. Under user control.**

---

## 🎯 Philosophy

**From MANIFESTO.md:**

> "Every line of code is a commitment.  
> Every feature is a promise.  
> Every release is a declaration of values."

**We believe in:**
- **Precision over bloat** (focused features)
- **Freedom over lock-in** (BYOK, self-hosted)
- **Community over corporation** (open source)
- **Craftsmanship over speed** (quality code)

**From ARCHITECTURE.md:**

> "A simple blob with a million little cilia."

**Cellular design:**
- Simple core (stable, unchanging)
- Specialized extensions (cilia - swappable)
- Each component independent
- Perfect cohesion

**This is how professional software is built.**

---

## 🚀 Ready to Build?

```bash
# Install
git clone https://github.com/quarkvibe/Ameoba_1.2.git
cd Ameoba_1.2
npm install

# Run
npm run dev

# Generate your first content
# Via UI: http://localhost:5000
# Via CLI: amoeba generate <template>
# Via SMS: Text "help" to your Twilio number

# You're in control. Three ways.
```

---

## 📞 Quick Links

**Essential:**
- [README.md](README.md) - Complete overview
- [ARCHITECTURE.md](ARCHITECTURE.md) - How it's built
- [VISION.md](VISION.md) - Where it's going
- [CLI_PARITY_MATRIX.md](CLI_PARITY_MATRIX.md) - UI/CLI feature comparison

**Guides:**
- [Quick Start](docs/guides/QUICK_START_GUIDE.md)
- [Deployment](docs/guides/DEPLOYMENT_GUIDE.md)
- [CLI Commands](docs/guides/CLI_COMMANDS.md)

**Contributing:**
- [CONTRIBUTING.md](CONTRIBUTING.md)
- [MANIFESTO.md](MANIFESTO.md)
- [SIMPLICITY_DOCTRINE.md](SIMPLICITY_DOCTRINE.md)

---

## 🎊 Welcome to Amoeba!

**You've discovered:**
- The only AI platform with SMS commands
- The only platform with enterprise quality control at $29/mo
- The only self-hosted platform with this feature set
- The platform that will evolve with you

**Three interfaces. Complete BYOK. Perfect architecture.**

**Let's build something amazing.** 🦠🚀

---

**Made with ❤️ by QuarkVibe Inc.**
