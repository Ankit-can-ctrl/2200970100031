# URL Shortener Logging Middleware

A reusable logging package that sends logs to the evaluation test server at `http://20.244.56.144/evaluation-service/logs`.

## Features

- ✅ Reusable `Log(stack, level, package, message)` function
- ✅ Parameter validation according to API constraints
- ✅ Retry mechanism with exponential backoff
- ✅ Offline queue management
- ✅ No console.log or built-in language loggers
- ✅ Browser and Node.js compatible
- ✅ TypeScript-ready

## Installation

```bash
npm install
```

## Usage

### Basic Usage

```javascript
import { Log } from "./index.js";

// Basic log
await Log("frontend", "error", "component", "User authentication failed");

// Backend log
await Log("backend", "info", "handler", "Request processed successfully");
```

### Convenience Methods

```javascript
import { LogError, LogInfo, LogDebug, LogWarn, LogFatal } from "./index.js";

// Convenience methods (automatically include level)
await LogError("frontend", "component", "Button click handler failed");
await LogInfo("frontend", "api", "User data fetched successfully");
await LogDebug("frontend", "state", "Component state updated");
await LogWarn("frontend", "component", "Deprecated prop used");
await LogFatal("backend", "handler", "Database connection lost");
```

## API Constraints

### Stack (required)

- `"frontend"`
- `"backend"`

### Level (required)

- `"debug"`
- `"info"`
- `"warn"`
- `"error"`
- `"fatal"`

### Package (required)

**Frontend packages:**

- `"api"`
- `"component"`
- `"hook"`
- `"page"`
- `"state"`
- `"style"`
- `"handler"`

**Backend packages:**

- `"handler"`
- `"middleware"`
- `"service"`
- `"database"`
- `"util"`

### Message (required)

- Any string describing the log event

## Advanced Features

### Offline Queue Management

The middleware automatically queues logs when offline and sends them when back online:

```javascript
import { getLoggerStatus, clearLogQueue } from "./index.js";

// Check queue status
const status = getLoggerStatus();
console.log(status);
// { queueLength: 5, isOnline: false, oldestEntry: "2024-01-01T10:00:00.000Z" }

// Clear queue (use with caution)
clearLogQueue();
```

### Error Handling

```javascript
try {
  await Log("frontend", "error", "component", "Something went wrong");
} catch (error) {
  // Handle logging failure
  // Note: Original error is preserved, logging failure doesn't break app flow
}
```

## Response Format

Successful logs return:

```javascript
{
  success: true,
  logID: "a4aad02e-19d0-4153-86d9-58bf55d7c402",
  message: "log created successfully",
  attempt: 1
}
```

Queued logs return:

```javascript
{
  success: true,
  queued: true,
  message: "Log queued for when online"
}
```

## Integration Examples

### React Component

```javascript
import { LogError, LogInfo } from "../../../Logging_middleware/index.js";

const MyComponent = () => {
  const handleClick = async () => {
    try {
      await LogInfo("frontend", "component", "Button clicked");
      // ... component logic
    } catch (error) {
      await LogError(
        "frontend",
        "component",
        `Button click failed: ${error.message}`
      );
    }
  };

  return <button onClick={handleClick}>Click me</button>;
};
```

### API Calls

```javascript
import { LogInfo, LogError } from "../../../Logging_middleware/index.js";

const fetchUserData = async () => {
  try {
    await LogInfo("frontend", "api", "Fetching user data");
    const response = await fetch("/api/user");
    await LogInfo("frontend", "api", "User data fetched successfully");
    return response.json();
  } catch (error) {
    await LogError(
      "frontend",
      "api",
      `Failed to fetch user data: ${error.message}`
    );
    throw error;
  }
};
```

## Technical Details

- Uses `fetch` API for HTTP requests
- Automatic retry with exponential backoff (3 attempts)
- Offline detection and queue management
- LocalStorage for persistence
- Parameter validation before API calls
- No dependencies except development tools
