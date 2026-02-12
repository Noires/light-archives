# Database Query Logging Configuration

## Overview

SQL query logging is now configurable per environment using the `DB_LOGGING` environment variable or config files.

## Default Behavior

By default (in `config/default.yml`), only errors and warnings are logged:
```yaml
logging:
  - error
  - warn
```

This provides a good balance for production - you see problems without drowning in query logs.

## Environment Variable

Set `DB_LOGGING` as a JSON value:

### Development - Log Everything
```bash
export DB_LOGGING='true'
# or for more control:
export DB_LOGGING='["query","error","warn","schema"]'
```

### Production - Errors Only
```bash
export DB_LOGGING='["error"]'
```

### Disable All Logging
```bash
export DB_LOGGING='false'
```

## Available Log Types

- `query` - Every SQL query executed (verbose!)
- `error` - Failed queries and database errors
- `schema` - Schema creation/migration queries
- `warn` - Warnings from TypeORM
- `info` - General info messages
- `log` - General log messages
- `migration` - Migration-related queries

## Recommended Configurations

### Local Development
```bash
DB_LOGGING='["query","error","warn"]'
```
See all queries for debugging, plus errors and warnings.

### Staging/Testing
```bash
DB_LOGGING='["error","warn"]'
```
See problems without query noise.

### Production
```bash
DB_LOGGING='["error"]'
```
Only log actual errors to minimize log volume and performance impact.

### Debug Performance Issues
```bash
DB_LOGGING='["query","error"]'
```
Temporarily enable query logging to debug slow queries or N+1 problems.

## Docker Compose Example

```yaml
services:
  chaosarchives:
    environment:
      - DB_LOGGING=["error","warn"]
```

## Performance Considerations

- **`query` logging** adds overhead to every database operation
- In production with high traffic, `query` logging can:
  - Significantly increase log file sizes (GB per day)
  - Impact response times (I/O overhead)
  - Make it harder to find actual errors in logs

**Best practice:** Only enable `query` logging when actively debugging, not as a default.

## Checking Current Configuration

The logging configuration is logged when TypeORM connects. Check the server startup logs to verify your settings are applied.
