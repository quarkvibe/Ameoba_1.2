# Service Module Rules

## Every service must:

1. **Be a class or object export**
   ```typescript
   export class MyService { ... }
   export const myService = new MyService();
   ```

2. **Have a single, clear responsibility**
   - One domain, one service
   - If it does multiple things, split it

3. **Export a singleton instance**
   ```typescript
   export const myService = new MyService();
   ```

4. **Be testable in isolation**
   - No hidden dependencies
   - Injectable dependencies
   - Pure methods where possible

## Services cannot:

1. **Import Express types** (no HTTP knowledge)
   - Services don't know about `req`/`res`
   - Routes call services, services don't call routes

2. **Directly access req/res objects**
   - Pass data as parameters
   - Return data, let routes handle HTTP

3. **Import from route files**
   - One-way dependency: routes → services

4. **Use global state**
   - All state passed as parameters
   - Or stored in database

## All service methods must:

1. **Have TypeScript type signatures**
   ```typescript
   async myMethod(param: string): Promise<ResultType> { ... }
   ```

2. **Handle errors explicitly**
   ```typescript
   try {
     // ...
   } catch (error) {
     console.error('Service error:', error);
     throw new Error('Meaningful error message');
   }
   ```

3. **Return consistent types**
   - No mixing `Promise<T>` and `T`
   - No `any` returns

4. **Be pure functions when possible**
   - Same input = same output
   - No side effects (except I/O)

## Service Organization

```
server/services/
├── contentGenerationService.ts   # AI content generation
├── deliveryService.ts             # Content distribution
├── dataSourceService.ts           # Data fetching
├── licenseService.ts              # License management
└── ...
```

Each service is an **organelle** - specialized, isolated, purposeful.

## Error Handling

Services throw meaningful errors:
```typescript
if (!valid) {
  throw new Error('Invalid input: expected X, got Y');
}
```

Routes catch and convert to HTTP responses:
```typescript
try {
  await myService.doThing();
} catch (error: any) {
  res.status(500).json({ message: error.message });
}
```

## Documentation

Every service must include:
```typescript
/**
 * [SERVICE NAME]
 * [What it does]
 * [How it fits into the system]
 */
```

Every public method must have JSDoc:
```typescript
/**
 * Generate content using AI
 * @param params - Generation parameters
 * @returns Generated content with metadata
 */
async generate(params: GenerateParams): Promise<GeneratedContent> { ... }
```




