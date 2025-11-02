# 🦠 Amoeba - The Universal Application Assembler

[![npm version](https://badge.fury.io/js/amoeba-cli.svg)](https://www.npmjs.com/package/amoeba-cli)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**The self-evolving platform that assembles ANY application through natural language + AI.**

Amoeba is not just a content generator - it's a **universal substrate** that adapts to become whatever application you need. Use YOUR API keys, self-host anywhere, and watch it evolve based on your requirements. Perfect for content automation, data processing, workflow orchestration, and any AI-powered application.

---

## ✨ Features

### 🔑 Bring Your Own Keys (BYOK)
- **Complete Cost Control**: Use your own AI provider keys (OpenAI, Anthropic, Cohere)
- **No Platform Fees**: Pay only your actual API costs (~$0.001-$0.05 per generation)
- **Multiple Providers**: Switch between AI providers or use different ones for different templates
- **Secure Storage**: AES-256-GCM encryption for all credentials

### 🎨 Powerful Template System
- **Dynamic Variables**: Create reusable templates with placeholder variables
- **Output Formats**: Text, JSON, Markdown, or HTML
- **System Prompts**: Fine-tune AI behavior for each template
- **Validation**: Built-in variable validation and error handling

### 📊 Data Source Integration
- **RSS Feeds**: Auto-fetch from any RSS/Atom feed
- **REST APIs**: Pull data from external services
- **Webhooks**: Receive data from push notifications
- **Static Data**: Use predefined datasets
- **JSONPath Extraction**: Parse and extract specific fields

### 🚀 Multi-Channel Delivery
- **Email**: SendGrid, AWS SES, or SMTP
- **Webhooks**: POST to any endpoint
- **API**: Expose via REST endpoints
- **File**: Save locally or to S3

### ⏰ Automated Scheduling
- **Cron Expressions**: Standard cron syntax for flexible scheduling
- **Dynamic Jobs**: Create, edit, or pause jobs in real-time
- **Error Recovery**: Automatic retry with exponential backoff
- **Execution History**: Track success/failure with detailed logs

### 📡 Real-Time Monitoring
- **Live Terminal**: 23 diagnostic commands for system inspection
- **Traffic Light System**: Instant visual health status (🟢🟡🔴)
- **Activity Feed**: Real-time event streaming via WebSocket
- **Performance Metrics**: Track tokens, costs, and execution times

### 🖥️ Professional CLI
- **25+ Commands**: Manage everything from the terminal
- **Interactive Prompts**: Guided configuration
- **JSON Output**: Scriptable automation
- **Batch Operations**: Bulk content generation

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

## 🆘 Support

- **Documentation**: [/docs](/docs)
- **Issues**: [GitHub Issues](https://github.com/yourusername/Ameoba/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/Ameoba/discussions)

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

| Feature | Amoeba | Zapier | Make | Custom Code |
|---------|--------|--------|------|-------------|
| AI-First | ✅ | ❌ | ❌ | ⚠️ |
| BYOK | ✅ | ❌ | ❌ | ✅ |
| Self-Hosted | ✅ | ❌ | ❌ | ✅ |
| No Per-Use Fees | ✅ | ❌ | ❌ | ✅ |
| Beautiful UI | ✅ | ✅ | ✅ | ❌ |
| Real-time Monitor | ✅ | ❌ | ❌ | ❌ |
| Professional CLI | ✅ | ❌ | ❌ | ⚠️ |

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

**Made with ❤️ by Rex Koopa**

**Give it a ⭐️ if you like it!**



