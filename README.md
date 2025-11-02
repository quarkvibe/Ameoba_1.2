# 🦠 Amoeba - The AI Platform You Control From Your Phone

[![npm version](https://badge.fury.io/js/amoeba-cli.svg)](https://www.npmjs.com/package/amoeba-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The world's first AI agent platform with SMS command interface, professional quality control, and complete UI configuration. Self-hosted, BYOK, $29/month.**

Text "generate newsletter" and it happens. Text "status" and know everything. Or use the beautiful web dashboard. Your choice.

Amoeba is not just a tool - it's an **enterprise AI communication platform** that delivers via email, SMS, voice calls, webhooks, and more. With AI agents that fetch data autonomously and quality pipelines that ensure professional output.

---

## ✨ Features

### 🤖 AI Agent with Native Tools (NEW!)
- **Autonomous Data Fetching**: AI automatically fetches RSS, web pages, APIs
- **7 Native Tools**: fetch_rss_feed, fetch_webpage, extract_text, fetch_json, extract_data, optimize_for_sms, optimize_for_voice
- **Function Calling**: OpenAI & Anthropic tool use
- **Zero Extra API Keys**: All tools built-in and free!
- **Example**: "Fetch top tech news and summarize" → AI does everything automatically

### 🛡️ Enterprise Quality Control (NEW!)
- **6-Stage Pipeline**: Parse → Safety → Quality → Cleanup → Validate → Review
- **Quality Scoring**: 0-100 score for every AI output
- **Safety Checks**: PII detection, placeholder detection, content moderation
- **Human Review Workflow**: Optional approval queue with auto-approval rules
- **Statistics Dashboard**: Track quality metrics over time

### 📱 Multi-Channel Delivery (ENHANCED!)
- **Email**: SendGrid, AWS SES, or SMTP
- **SMS**: Twilio text messages (NEW!)
- **Voice Calls**: Text-to-speech phone calls (NEW!)
- **Webhooks**: POST to any endpoint
- **API**: Expose via REST endpoints
- **File**: Save locally or to S3
- **Auto-Optimization**: Content adapts to each channel

### 📞 SMS Command Interface ⭐ UNIQUE!
- **Control via Text**: Text "status", "generate", "approve all"
- **Natural Language**: "What's the system health?"
- **Mobile-First Admin**: Manage from your phone, no laptop needed
- **Secure**: Authorized phone numbers only
- **Fast**: 2-5 second responses
- **No App Required**: Works on any phone

### 🎨 Dual Interface: UI + CLI (Both First-Class!)
- **Beautiful Dashboard**: Visual configuration, real-time monitoring, anyone can use
- **Powerful CLI**: 40+ commands, JSON output, scriptable automation, embeddable
- **Your Choice**: Use UI, CLI, or both - same features, different interface
- **Credentials Manager**: Add via UI forms OR CLI commands
- **Environment Manager**: Edit via dashboard OR `amoeba env set`
- **Agent Configurator**: Visual editor OR CLI configuration
- **API Access**: Programmatic control for custom integrations

### 🔑 Complete BYOK (Enhanced!)
- **AI Providers**: OpenAI, Anthropic, Cohere, Ollama
- **Email Services**: SendGrid, AWS SES
- **Phone Services**: Twilio (SMS & Voice)
- **Secure Storage**: AES-256-GCM encryption
- **Complete Cost Control**: Pay only actual API costs

### 🧪 Built-in Testing & Diagnostics (NEW!)
- **System Tests**: 5 test suites, 10+ tests
- **Accessible Everywhere**: API, SMS, CLI, Dashboard
- **Log Viewing**: Real-time, filterable logs
- **Diagnostics**: System health, memory, services
- **SMS Testing**: Text "test" to run system checks

### ⏰ Automated Scheduling
- **Cron Expressions**: Standard cron syntax
- **Dynamic Jobs**: Create, edit, pause in real-time
- **Error Recovery**: Automatic retry with backoff
- **Execution History**: Track success/failure

### 📡 Real-Time Monitoring
- **Live Terminal**: 27+ diagnostic commands
- **Traffic Light System**: Visual health status (🟢🟡🔴)
- **Activity Feed**: Real-time event streaming
- **Performance Metrics**: Tokens, costs, execution times

### 🖥️ Professional CLI (First-Class Interface!)
- **40+ Commands**: Full feature parity with UI
- **JSON Output**: Scriptable automation, CI/CD integration
- **Embeddable**: Use Amoeba as a library in your apps
- **Interactive Prompts**: Guided configuration when needed
- **Batch Operations**: Bulk processing, shell scripting
- **Headless Mode**: Run without UI (perfect for servers)
- **Power User**: Everything configurable via terminal

---

## 🚀 Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/Ameoba.git
cd Ameoba

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your DATABASE_URL and ENCRYPTION_KEY
```

### Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add this to your `.env` as `ENCRYPTION_KEY`.

### Start the Platform

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

Open http://localhost:5000

### First-Time Setup

1. **Sign Up**: Create your account
2. **Add AI Credential**: Settings → AI Credentials → Add your OpenAI/Anthropic key
3. **Add Email Credential** (optional): Settings → Email Credentials → Add SendGrid/SES
4. **Create Template**: Templates → Create → Define your content template
5. **Generate**: Click "Generate Now" → Get REAL AI content!

---

## 💻 CLI Usage

### Global Installation

```bash
npm install -g amoeba-cli
```

### Commands

```bash
# Check system health
amoeba status

# List templates
amoeba templates list

# Create a new template
amoeba templates create

# Generate content
amoeba generate run <template-id>

# View scheduled jobs
amoeba jobs list

# Run a job manually
amoeba jobs run <job-id>

# Manage credentials
amoeba credentials ai list
amoeba credentials ai add

# View generated content
amoeba content list
```

---

## 📚 Use Cases

### 📰 Daily Newsletter
```javascript
// Template: "Daily Tech Digest"
// Data Source: Hacker News RSS
// Schedule: Every day at 9 AM
// Delivery: Email to subscribers
```

### 📱 Social Media Automation
```javascript
// Template: "Tweet Generator"
// Data Source: Industry news API
// Schedule: Every 2 hours
// Delivery: Webhook to Twitter API
```

### 📝 Blog Post Creation
```javascript
// Template: "SEO Blog Post"
// Variables: topic, keywords, tone
// Provider: GPT-4
// Delivery: Save as markdown file
```

### 📊 Weekly Report
```javascript
// Template: "Sales Summary"
// Data Source: Your CRM API
// Schedule: Every Monday at 8 AM
// Delivery: Email to team
```

---

## 🏗️ Architecture

```
┌─────────────┐
│   Browser   │  ← Web Dashboard (React)
└──────┬──────┘
       │
┌──────▼──────┐
│  WebSocket  │  ← Real-time updates
└──────┬──────┘
       │
┌──────▼──────┐
│ Express API │  ← REST endpoints
└──────┬──────┘
       │
┌──────▼──────────────────┐
│      Services           │
│  ┌─────────────────┐   │
│  │ Content Gen     │   │  ← AI Integration
│  ├─────────────────┤   │
│  │ Delivery        │   │  ← Email/Webhook
│  ├─────────────────┤   │
│  │ Data Source     │   │  ← RSS/API fetch
│  ├─────────────────┤   │
│  │ Scheduler       │   │  ← Cron jobs
│  └─────────────────┘   │
└─────────┬───────────────┘
          │
    ┌─────▼─────┐
    │ PostgreSQL│  ← Neon/Supabase
    └───────────┘
```

---

## 🔒 Security

- **AES-256-GCM Encryption**: All API keys encrypted at rest
- **User Data Isolation**: Row-level security with userId
- **Cascade Deletes**: Automatic cleanup on user deletion
- **Input Validation**: Zod schemas for all inputs
- **Session Management**: Secure cookie-based sessions
- **SQL Injection Protection**: Drizzle ORM with parameterized queries

---

## 🛠️ Tech Stack

### Backend
- **Framework**: Express.js
- **Database**: PostgreSQL (Drizzle ORM)
- **Authentication**: Passport.js + Replit Auth
- **Real-time**: WebSocket (ws)
- **Scheduling**: cron-parser
- **Validation**: Zod

### Frontend
- **Framework**: React 18
- **UI Library**: Radix UI
- **Styling**: Tailwind CSS
- **State**: React Query
- **Routing**: Wouter

### CLI
- **Framework**: Commander.js
- **UI**: Chalk, Ora, CLI-Table3
- **Prompts**: Inquirer

---

## 📊 Database Schema

Key tables:
- `users` - User accounts
- `aiCredentials` - Encrypted AI API keys
- `emailServiceCredentials` - Encrypted email provider keys
- `contentTemplates` - Reusable content templates
- `dataSources` - External data sources
- `outputChannels` - Delivery configurations
- `scheduledJobs` - Cron job definitions
- `generatedContent` - Content generation history
- `deliveryLogs` - Delivery tracking

Full schema: [shared/schema.ts](./shared/schema.ts)

---

## 🧪 Terminal Commands

The built-in terminal supports 23+ diagnostic commands:

```bash
status          # System health check
memory          # Memory usage
db              # Database info
templates       # List templates
jobs            # Scheduled jobs
queue           # Queue status
logs            # Recent logs
generate <id>   # Generate content
help            # Show all commands
```

---

## 🚦 Traffic Light System

Visual health indicators:

- 🟢 **Green (85-100%)**: All systems operational
- 🟡 **Yellow (60-84%)**: Minor warnings, system functional
- 🔴 **Red (<60%)**: Critical issues, attention needed

Click the indicator for detailed breakdown and quick-fix actions.

---

## 📦 Deployment

### Option 1: Replit
1. Connect your GitHub repo
2. Set environment variables
3. Click "Deploy"

### Option 2: Vercel (Frontend) + Railway (Backend)
```bash
# Frontend
vercel --prod

# Backend
railway up
```

### Option 3: Docker
```dockerfile
FROM node:20
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
CMD ["npm", "start"]
```

---

## 🤝 Contributing

Contributions welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 📚 Documentation

### Quick Links
- **[START_HERE.md](START_HERE.md)** ⭐ Start here! (5-minute orientation)
- **[Quick Start Guide](docs/guides/QUICK_START_GUIDE.md)** - 30-minute setup
- **[Immediate Action Plan](docs/guides/IMMEDIATE_ACTION_PLAN.md)** - 21-day launch timeline

### Core Philosophy
- **[MANIFESTO.md](MANIFESTO.md)** - Core principles & standards
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Cellular design philosophy
- **[VISION.md](VISION.md)** - Product vision & roadmap
- **[SIMPLICITY_DOCTRINE.md](SIMPLICITY_DOCTRINE.md)** - Development philosophy

### Implementation Guides
- **[AI Tools](docs/implementation/AI_TOOLS_IMPLEMENTATION.md)** - 7 native tools
- **[Quality Pipeline](docs/implementation/OUTPUT_PIPELINE_IMPLEMENTATION.md)** - Quality control
- **[Voice & SMS](docs/implementation/VOICE_SMS_IMPLEMENTATION.md)** - Multi-channel delivery
- **[SMS Commands](docs/implementation/SMS_COMMAND_INTERFACE.md)** ⭐ Mobile admin
- **[UI Configuration](docs/implementation/UI_FIRST_ARCHITECTURE.md)** - Dashboard setup
- **[Testing System](docs/implementation/TESTING_SYSTEM_IMPLEMENTATION.md)** - Testing & logs

### More Documentation
- **[Full Documentation Index](docs/README.md)** - Complete docs navigation

---

## 🆘 Support

- **Documentation**: [/docs](/docs) (comprehensive guides)
- **Issues**: [GitHub Issues](https://github.com/quarkvibe/Ameoba/issues)
- **Discussions**: [GitHub Discussions](https://github.com/quarkvibe/Ameoba/discussions)

---

## 🎯 Roadmap

- [ ] Template Marketplace
- [ ] A/B Testing
- [ ] Content Approval Workflow
- [ ] Multi-language Support
- [ ] Advanced Analytics
- [ ] Team Collaboration
- [ ] Plugin System
- [ ] Mobile App

---

## 💰 Pricing

**Platform**: FREE & Open Source

**Your Costs**:
- AI Provider: ~$0.001-$0.05 per generation (pay directly to OpenAI/Anthropic)
- Email Provider: ~$0.0001 per email (pay directly to SendGrid/AWS)
- Database: Free tier available (Neon, Supabase)

**No middleman fees!**

---

## 🌟 Why Amoeba?

| Feature | Amoeba | Zapier | Make | n8n | Twilio Autopilot |
|---------|--------|--------|------|-----|------------------|
| AI Agent with Tools | ✅ | ❌ | ❌ | ⚠️ | ⚠️ |
| Quality Pipeline | ✅ | ❌ | ❌ | ❌ | ❌ |
| SMS Delivery | ✅ | ⚠️ | ⚠️ | ❌ | ✅ |
| Voice Delivery | ✅ | ❌ | ❌ | ❌ | ✅ |
| **SMS Command Interface** | ✅ | ❌ | ❌ | ❌ | ❌ |
| UI-First Config | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| Self-Hosted | ✅ | ❌ | ❌ | ✅ | ❌ |
| Complete BYOK | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| Open Source | ✅ | ❌ | ❌ | ✅ | ❌ |
| Price/month | $29 | $20-599 | $9-299 | $20-500 | $99-499 |

**Amoeba is the ONLY platform with SMS command interface!** ⭐

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/Ameoba&type=Date)](https://star-history.com/#yourusername/Ameoba&Date)

---

## 🙏 Acknowledgments

- OpenAI, Anthropic, Cohere for AI APIs
- Radix UI for component primitives
- Drizzle ORM for database management
- The open-source community

---

**Made with ❤️ by QuarkVibe Inc.**

**Give it a ⭐️ if you like it!**



