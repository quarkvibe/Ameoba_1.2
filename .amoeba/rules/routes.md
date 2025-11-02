# Route Module Rules

## Every route file must:

1. **Export a single registration function**
   ```typescript
   export function register*Routes(router: Router) { ... }
   ```

2. **Use rate limiting on all endpoints**
   - `strictRateLimit` (5 req/min) - Expensive operations
   - `standardRateLimit` (60 req/min) - Normal operations
   - `generousRateLimit` (120 req/min) - Read operations
   - `publicRateLimit` (30 req/min) - Unauthenticated endpoints

3. **Use `isAuthenticated` for protected routes**
   ```typescript
   router.get('/path', isAuthenticated, rateLimit, async (req, res) => { ... })
   ```

4. **Include error handling in every route**
   ```typescript
   try {
     // ... logic
     res.json({ success: true, data });
   } catch (error) {
     console.error('Error:', error);
     res.status(500).json({ message: 'Error message' });
   }
   ```

5. **Follow RESTful conventions**
   - GET for retrieval
   - POST for creation
   - PUT/PATCH for updates
   - DELETE for removal

## Route files cannot:

1. Import from other route files (circular dependencies)
2. Contain business logic (use services instead)
3. Exceed 400 lines (split by subdomain if needed)
4. Use `any` types without explicit reason

## All routes must:

1. **Validate input with Zod schemas or explicit checks**
   ```typescript
   validateBody(schema)
   // or
   if (!req.body.field) return res.status(400).json({ message: 'field required' })
   ```

2. **Return consistent error format**
   ```typescript
   { message: string, errors?: array }
   ```

3. **Log to activityMonitor for important actions**
   ```typescript
   activityMonitor.logActivity('info', 'User performed action')
   ```

4. **Check resource ownership for user data**
   ```typescript
   const userId = req.user.claims.sub;
   const resource = await storage.getResource(id, userId);
   if (!resource) return res.status(404).json({ message: 'Not found' });
   ```

## Naming Conventions

- Route files: `camelCase.ts` (e.g., `dataSources.ts`)
- Function names: `register[Domain]Routes` (e.g., `registerDataSourceRoutes`)
- Route paths: `/kebab-case` (e.g., `/data-sources`)

## Documentation

Every route file must include a header comment:
```typescript
/**
 * [DOMAIN] ROUTES
 * [Brief description of what this handles]
 */
```




