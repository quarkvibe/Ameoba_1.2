# Schema Modification Rules

## Schema changes must:

1. **Be backwards compatible**
   - Don't break existing queries
   - Add fields as nullable
   - Use migrations for data changes

2. **Include migration script**
   - Document the change
   - Provide rollback
   - Test on copy of production data

3. **Update all dependent code**
   - Update storage methods
   - Update validation schemas
   - Update TypeScript types

4. **Document breaking changes**
   - Update CHANGELOG.md
   - Add migration guide
   - Notify users if applicable

## New tables must:

1. **Have proper indexes**
   ```typescript
   index("idx_table_field").on(table.field)
   ```

2. **Use cascade delete appropriately**
   ```typescript
   userId: varchar("user_id").references(() => users.id, { onDelete: 'cascade' })
   ```

3. **Include timestamps**
   ```typescript
   createdAt: timestamp("created_at").defaultNow()
   updatedAt: timestamp("updated_at").defaultNow()
   ```

4. **Follow naming conventions**
   - Tables: `camelCase` (e.g., `contentTemplates`)
   - Fields: `camelCase` (e.g., `userId`)
   - Indexes: `idx_table_field` (e.g., `idx_templates_user`)

## Cannot:

1. **Remove fields without deprecation**
   - Mark as deprecated first
   - Wait for next major version
   - Provide migration path

2. **Change types destructively**
   - varchar → integer is destructive
   - Add new field, migrate, remove old

3. **Break existing queries**
   - Test all storage methods
   - Ensure indexes still work
   - Check performance impact

## Field Types

Use appropriate PostgreSQL types:
- `uuid` for IDs
- `varchar(255)` for short text
- `text` for long text
- `jsonb` for structured data
- `timestamp` for dates
- `boolean` for flags
- `integer` for numbers

## Validation

Every table needs a Zod insert schema:
```typescript
export const insertMyTableSchema = createInsertSchema(myTable);
```

Used in routes for validation:
```typescript
const validatedData = insertMyTableSchema.parse(req.body);
```

## Documentation

Document schema changes:
```typescript
// =============================================================================
// MY DOMAIN TABLES
// =============================================================================

/**
 * Stores X data for Y purpose
 * Relationships: references users, referenced by otherTable
 */
export const myTable = pgTable("my_table", { ... });
```



