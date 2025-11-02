# Contributing to Amoeba

First off, thank you for considering contributing to Amoeba! It's people like you that make Amoeba such a great tool.

## 🌟 Philosophy

Amoeba is built on the principles outlined in our [MANIFESTO.md](./MANIFESTO.md). Please read it to understand our design philosophy and development standards.

**TL;DR:**
- **Utility over features** - Every feature must solve a real problem
- **Clinical precision** - Code quality and performance matter
- **Self-hosting first** - Users own their data and destiny
- **Documentation is code** - If it's not documented, it's not done

---

## 🚀 How Can I Contribute?

### Reporting Bugs

**Before submitting a bug report:**
1. Check the [existing issues](https://github.com/yourusername/Ameoba/issues)
2. Try the latest version
3. Search the documentation

**When submitting a bug report, include:**
- Clear, descriptive title
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable
- Environment details (OS, Node version, etc.)

### Suggesting Features

We love feature ideas, but they must align with our philosophy.

**Before suggesting a feature:**
1. Read [MANIFESTO.md](./MANIFESTO.md) to understand what we build
2. Check if it's already been suggested
3. Consider if it's core or could be a plugin

**Feature request template:**
```markdown
## Problem
What problem does this solve? (1-2 sentences)

## Proposed Solution
How should this work?

## Alternatives Considered
What other approaches did you think about?

## Business Case
Who needs this? How many users would benefit?

## Implementation Complexity
Rough estimate: Simple / Medium / Complex
```

### Pull Requests

**Before starting work:**
1. Open an issue to discuss your idea
2. Wait for maintainer approval
3. Fork the repository
4. Create a feature branch

**Development workflow:**
```bash
# 1. Fork and clone
git clone https://github.com/yourusername/Ameoba.git
cd Ameoba

# 2. Create branch
git checkout -b feature/your-feature-name

# 3. Install dependencies
npm install

# 4. Make changes

# 5. Run tests
npm test

# 6. Run linter
npm run lint

# 7. Type check
npm run check

# 8. Commit with conventional commits
git commit -m "feat: add amazing feature"

# 9. Push and create PR
git push origin feature/your-feature-name
```

---

## 📝 Development Standards

### Code Quality

**Required for all PRs:**
- [ ] TypeScript strict mode (no `any` types)
- [ ] Tests with >80% coverage for new code
- [ ] ESLint passes with no warnings
- [ ] Type checking passes
- [ ] Documentation updated
- [ ] Changelog updated (for user-facing changes)

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add amazing feature
fix: resolve critical bug
docs: update installation guide
style: format code according to standards
refactor: restructure auth module
test: add tests for email service
chore: update dependencies
```

### Code Style

**File naming:**
- `camelCase.ts` for utilities
- `PascalCase.tsx` for React components
- `kebab-case.md` for documentation

**Code structure:**
- Maximum 400 lines per file (split if larger)
- Clear, descriptive variable names
- Comments explain "why", not "what"
- Functions do one thing well

**Example:**
```typescript
// Good
async function generateContentFromTemplate(
  templateId: string,
  variables: Record<string, any>
): Promise<GeneratedContent> {
  // Validate template exists before generation
  const template = await validateTemplate(templateId);
  
  const result = await aiProvider.generate({
    systemPrompt: template.systemPrompt,
    userPrompt: substituteVariables(template.userPrompt, variables)
  });
  
  return result;
}

// Bad
async function gen(t: any, v: any): Promise<any> {
  // does stuff
  const r = await x.do(t.p, v);
  return r;
}
```

### Testing

**Required tests:**
```typescript
// Unit tests for services
describe('ContentGenerationService', () => {
  it('should generate content with correct AI provider', async () => {
    // Arrange
    const templateId = 'test-template';
    const variables = { topic: 'AI' };
    
    // Act
    const result = await contentGenerationService.generate({
      templateId,
      variables
    });
    
    // Assert
    expect(result).toBeDefined();
    expect(result.content).toBeTruthy();
    expect(result.metadata.provider).toBe('openai');
  });
});

// Integration tests for APIs
describe('POST /api/content/generate', () => {
  it('should generate content with valid template', async () => {
    const response = await request(app)
      .post('/api/content/generate')
      .set('Authorization', `Bearer ${testToken}`)
      .send({ templateId: 'test-template' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

### Documentation

**Every PR must update:**
- [ ] Code comments for complex logic
- [ ] README.md (if user-facing)
- [ ] API documentation (if adding/changing endpoints)
- [ ] CHANGELOG.md (for releases)

---

## 🏗️ Project Structure

```
Amoeba/
├── server/              # Backend
│   ├── routes/          # API endpoints (modular, 150-200 lines each)
│   ├── services/        # Business logic (200-400 lines each)
│   ├── middleware/      # Express middleware
│   └── validation/      # Zod schemas
├── client/              # Frontend
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       └── hooks/       # Custom hooks
├── shared/              # Shared code
│   └── schema.ts        # Database schema (Drizzle ORM)
├── cli/                 # CLI tool
│   ├── commands/        # CLI commands
│   └── utils/           # CLI utilities
└── landing/             # Marketing site (Next.js)
```

---

## 🎯 Good First Issues

Look for issues labeled `good first issue`:
- Documentation improvements
- UI polish
- Test coverage
- Bug fixes

---

## 🔍 Review Process

**All PRs go through:**
1. **Automated checks** (CI/CD)
   - TypeScript type checking
   - ESLint
   - Tests (must pass with >80% coverage)
   - Build verification

2. **Code review** (2 maintainers minimum)
   - Architecture alignment
   - Code quality
   - Test coverage
   - Documentation

3. **Testing** (QA)
   - Manual testing in dev environment
   - Regression testing

**Timeline:**
- Small PRs (<100 lines): 1-2 days
- Medium PRs (100-500 lines): 3-5 days
- Large PRs (>500 lines): 1-2 weeks

---

## 🎁 Recognition

We value our contributors!

**All contributors get:**
- [ ] Name in README.md contributors section
- [ ] "Contributor" GitHub badge
- [ ] Invitation to contributor Discord channel

**Regular contributors get:**
- [ ] Free enterprise license
- [ ] Swag pack (stickers, t-shirt)
- [ ] Voice in roadmap decisions

**Core contributors get:**
- [ ] Revenue share on marketplace items
- [ ] Speaking opportunities at events
- [ ] Early access to new features

---

## 💬 Communication

**Where to reach us:**
- **GitHub Issues**: Bug reports, feature requests
- **GitHub Discussions**: Questions, ideas, show & tell
- **Discord**: Real-time chat ([discord.gg/amoeba](https://discord.gg/amoeba))
- **Email**: dev@amoeba.io

**Response times:**
- Issues: 24-48 hours
- PRs: 2-5 days
- Discord: Real-time (best effort)

---

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## 🙏 Thank You!

Your contributions make Amoeba better for everyone. We appreciate your time, effort, and expertise.

**Together, we're building the future of AI-powered content generation.** 🦠

---

**Questions?** Open a [GitHub Discussion](https://github.com/yourusername/Ameoba/discussions) or join our [Discord](https://discord.gg/amoeba).
