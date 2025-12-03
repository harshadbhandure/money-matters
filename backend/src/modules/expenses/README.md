# Expenses Module

This module implements the core expense-splitting functionality for the Money Matters application (Splitwise minimal clone).

## Overview

The ExpensesModule handles:
- Creating expenses within groups
- Automatically splitting expenses equally among group members
- Tracking who paid and who owes
- Calculating balances for each group member

## Architecture

### Entities Used
- **Expense**: Main expense record (from `expense/expense.entity.ts`)
- **ExpenseSplit**: Individual shares for each member (from `expense-split/expense-split.entity.ts`)
- **Group**: The group context (from `group/group.entity.ts`)
- **User**: Group members (from `user/user.entity.ts`)

### Files Structure
```
expenses/
├── dto/
│   ├── create-expense.dto.ts       # Input validation for creating expenses
│   ├── expense-response.dto.ts     # Response format for expenses
│   └── balance-response.dto.ts     # Response format for balances
├── expenses.controller.ts          # API endpoints
├── expenses.service.ts             # Business logic
├── expenses.module.ts              # Module definition
└── index.ts                        # Exports
```

## API Endpoints

### 1. Create Expense
```
POST /groups/:groupId/expenses
```

**Request Body:**
```json
{
  "paidById": "user-uuid",
  "amount": 100.00,
  "description": "Dinner at restaurant",
  "date": "2024-01-15"
}
```

**Response:**
```json
{
  "id": "expense-uuid",
  "groupId": "group-uuid",
  "paidById": "user-uuid",
  "paidByName": "John Doe",
  "amount": 100.00,
  "description": "Dinner at restaurant",
  "date": "2024-01-15",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "splits": [
    {
      "id": "split-uuid-1",
      "userId": "user-uuid-1",
      "userName": "John Doe",
      "share": 33.33,
      "paid": true
    },
    {
      "id": "split-uuid-2",
      "userId": "user-uuid-2",
      "userName": "Jane Smith",
      "share": 33.33,
      "paid": false
    },
    {
      "id": "split-uuid-3",
      "userId": "user-uuid-3",
      "userName": "Bob Wilson",
      "share": 33.34,
      "paid": false
    }
  ]
}
```

**Validations:**
- `paidById` must be a valid UUID and a member of the group
- `amount` must be a positive number (minimum 0.01)
- `description` must be a non-empty string
- `date` must be a valid ISO date string
- Current user must be a member of the group

**Behavior:**
- Expense amount is divided equally among all group members
- ExpenseSplit records are created for each member
- The person who paid is automatically marked as `paid: true`
- Transaction is atomic (all or nothing)

### 2. Get Group Expenses
```
GET /groups/:groupId/expenses
```

**Response:**
```json
[
  {
    "id": "expense-uuid",
    "groupId": "group-uuid",
    "paidById": "user-uuid",
    "paidByName": "John Doe",
    "amount": 100.00,
    "description": "Dinner at restaurant",
    "date": "2024-01-15",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "splits": [...]
  },
  ...
]
```

**Sorting:**
- Expenses are sorted by date (descending)
- Secondary sort by creation date (descending)

**Authorization:**
- Only group members can view expenses

### 3. Get Group Balances
```
GET /groups/:groupId/balances
```

**Response:**
```json
[
  {
    "userId": "user-uuid-1",
    "name": "John Doe",
    "balance": 66.67
  },
  {
    "userId": "user-uuid-2",
    "name": "Jane Smith",
    "balance": -33.33
  },
  {
    "userId": "user-uuid-3",
    "name": "Bob Wilson",
    "balance": -33.34
  }
]
```

**Balance Calculation:**
```
balance = totalPaid - totalOwed
```

- **Positive balance**: Person is owed money (they paid more than their share)
- **Negative balance**: Person owes money (they paid less than their share)
- **Zero balance**: Person is settled up

**Authorization:**
- Only group members can view balances

## Business Logic

### Equal Split Algorithm

When an expense is created:

1. **Validate group membership**: Both the current user and `paidById` user must be members
2. **Calculate per-member share**:
   ```typescript
   sharePerMember = amount / memberCount
   ```
3. **Create ExpenseSplit for each member**:
   - `share` = calculated share (rounded to 2 decimals)
   - `paid` = `true` if this is the person who paid, `false` otherwise
4. **Transaction safety**: All database operations are wrapped in a transaction

### Balance Calculation Logic

Uses a single SQL query with aggregations:

```sql
SELECT 
  user.id,
  user.name,
  COALESCE(SUM(CASE WHEN expense.paidById = user.id THEN expense.amount ELSE 0 END), 0) as totalPaid,
  COALESCE(SUM(CASE WHEN split.userId = user.id THEN split.share ELSE 0 END), 0) as totalOwed
FROM users user
INNER JOIN group_members gm ON gm.userId = user.id
LEFT JOIN expenses expense ON expense.groupId = :groupId AND expense.paidById = user.id
LEFT JOIN expense_splits split ON split.userId = user.id AND split.expenseId IN (...)
WHERE gm.groupId = :groupId
GROUP BY user.id, user.name
```

Then: `balance = totalPaid - totalOwed`

## Security

### Authentication
- All endpoints require JWT authentication via `JwtAuthGuard`
- User identity extracted from JWT token via `@CurrentUser()` decorator

### Authorization
- Users must be members of the group to:
  - Create expenses
  - View expenses
  - View balances
- Only group members can be assigned as `paidById`

### Data Validation
- All inputs validated using `class-validator` decorators
- DTOs ensure type safety and data integrity
- Transaction rollback on any error during expense creation

## Error Handling

| Error | Status Code | Scenario |
|-------|-------------|----------|
| `NotFoundException` | 404 | Group not found |
| `ForbiddenException` | 403 | User not a group member |
| `BadRequestException` | 400 | `paidById` user not in group |
| `ValidationError` | 400 | Invalid input data |

## Database Transactions

The `createExpense` method uses TypeORM transactions to ensure atomicity:

```typescript
const queryRunner = this.dataSource.createQueryRunner();
await queryRunner.startTransaction();
try {
  // 1. Create expense
  // 2. Create all splits
  await queryRunner.commitTransaction();
} catch (error) {
  await queryRunner.rollbackTransaction();
  throw error;
} finally {
  await queryRunner.release();
}
```

This ensures that either:
- Both expense and all splits are created, OR
- Nothing is created (rollback)

## TypeORM Usage

### Repository API
- Used for simple CRUD operations
- `findOne()` with relations loading
- `create()` and `save()` for inserts

### QueryBuilder API
- Used for complex balance calculations
- Enables advanced SQL with aggregations
- Better performance for analytical queries

## Example Usage

### Creating an Expense

```typescript
// POST /groups/abc-123/expenses
const expense = await expensesService.createExpense(
  'abc-123',
  {
    paidById: 'user-456',
    amount: 150.00,
    description: 'Grocery shopping',
    date: '2024-01-20'
  },
  'current-user-id'
);
```

### Getting Balances

```typescript
// GET /groups/abc-123/balances
const balances = await expensesService.getGroupBalances(
  'abc-123',
  'current-user-id'
);

// Result interpretation:
// Alice: +100 (Alice paid $100, owes $0 → balance +$100, others owe her)
// Bob: -50 (Bob paid $0, owes $50 → balance -$50, he owes others)
// Carol: -50 (Carol paid $0, owes $50 → balance -$50, she owes others)
```

## Future Enhancements

Possible improvements:
- [ ] Custom split ratios (not equal)
- [ ] Percentage-based splits
- [ ] Mark individual splits as paid
- [ ] Expense categories/tags
- [ ] Multi-currency support
- [ ] Expense editing/deletion
- [ ] File attachments (receipts)
- [ ] Settlement suggestions (optimal payment plan)

## Testing

### Unit Tests
Test the service methods:
```bash
npm test -- expenses.service.spec
```

### Integration Tests
Test the API endpoints:
```bash
npm run test:e2e -- expenses
```

### Manual Testing
See the main project's `API_TESTING.md` for curl examples.

## Dependencies

- `@nestjs/common`: Core NestJS decorators and utilities
- `@nestjs/typeorm`: TypeORM integration
- `typeorm`: ORM for database operations
- `class-validator`: DTO validation
- `class-transformer`: Object transformation

## Related Modules

- **AuthModule**: Provides JWT authentication
- **ExpenseModule**: Defines the Expense entity
- **ExpenseSplitModule**: Defines the ExpenseSplit entity
- **GroupModule**: Defines the Group entity
- **UserModule**: Defines the User entity
