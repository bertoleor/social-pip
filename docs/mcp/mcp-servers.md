# MCP Servers Configuration — Social-Pip
> Parte de: [[README]] · Relacionados: [[opencode-config]] · [[skills]]

This document details all Model Context Protocol (MCP) servers configured for the Social-Pip project. MCP servers extend OpenCode's capabilities by providing specialized tools for file system access, GitHub integration, database operations, browser automation, and web search.

---

## Overview

| MCP Server | Purpose | Type | Status |
|------------|---------|------|--------|
| **context7** | Documentation lookup for libraries/frameworks | Remote | ✅ Enabled |
| **engram** | Persistent memory across sessions | Local | ✅ Enabled |
| **filesystem** | Read, write, edit files in allowed directories | Local | ✅ Enabled |
| **github** | GitHub API operations (issues, PRs, repos) | Local | ✅ Enabled |
| **sqlite** | SQLite database queries | Local | ✅ Enabled |
| **puppeteer** | Browser automation for social platforms | Local | ⏳ To configure |
| **playwright** | E2E testing and browser automation | Local | ✅ Enabled |

---

## 1. Context7 (Remote MCP)

**Purpose**: Real-time documentation lookup for programming libraries, frameworks, and APIs.

**How it works**: Context7 maintains a continuously updated database of documentation for popular libraries. When you ask about "how to use React useState" or "Express.js middleware", OpenCode queries Context7 to get accurate, up-to-date code examples.

### Configuration

Already configured in `opencode.json`:

```json
{
  "mcp": {
    "context7": {
      "enabled": true,
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    }
  }
}
```

### Usage in OpenCode

```
user: How do I set up authentication with JWT in Express.js?
assistant: [calls Context7 API for Express.js auth examples]
```

---

## 2. Engram (Local MCP)

**Purpose**: Persistent memory system that survives across sessions and compactions. Stores architectural decisions, bug fixes, patterns, and user preferences.

### Installation

```bash
# Build from source
cd C:\Users\Pc Living\go\src\github.com\gentleman-ai\engram
go build -o engram.exe ./cmd/engram

# Or download pre-built binary
# Place in: C:\Users\Pc Living\go\bin\engram.exe
```

### Configuration

Already configured in `opencode.json`:

```json
{
  "mcp": {
    "engram": {
      "command": [
        "C:\\Users\\Pc Living\\go\\bin\\engram.exe",
        "mcp",
        "--tools=agent"
      ],
      "type": "local"
    }
  }
}
```

### Usage

```bash
# Save a memory after completing important work
opencode$ Remember: Fixed N+1 query in UserList, replaced with eager loading
→ Saved to persistent memory

# Later session - recall past work
opencode$ What did we work on last time?
→ [searches memory, returns previous session summary]
```

### Available Tools

| Tool | Description |
|------|-------------|
| `mem_save` | Save structured observation (decision, bugfix, pattern) |
| `mem_search` | Full-text search across all sessions |
| `mem_context` | Get recent context from previous sessions |
| `mem_session_summary` | Save end-of-session summary |
| `mem_get_observation` | Get full content of specific observation |

---

## 3. Filesystem MCP

**Purpose**: File system operations — read, write, edit, glob, grep across allowed directories.

### Installation

```bash
# Using npm (global)
npm install -g @modelcontextprotocol/server-filesystem

# Or install locally in project
cd C:\Users\Pc Living\social-pip
npm install --save-dev @modelcontextprotocol/server-filesystem
```

### Configuration

Add to `opencode.json` `mcp` section:

```json
{
  "mcp": {
    "filesystem": {
      "command": [
        "C:\\Users\\Pc Living\\social-pip\\node_modules\\.bin\\mcp-server-filesystem",
        "C:\\Users\\Pc Living\\social-pip"
      ],
      "type": "local",
      "description": "File system access for social-pip project"
    }
  }
}
```

### Allowed Directories

Configure in `permission.read` and `permission.bash`:

```json
{
  "permission": {
    "read": {
      "C:\\Users\\Pc Living\\social-pip\\**": "allow",
      "C:\\Users\\Pc Living\\social-pip\\docs\\**": "allow"
    },
    "bash": {
      "C:\\Users\\Pc Living\\social-pip\\**": "allow"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `read` | Read file contents (up to 2000 lines) |
| `write` | Write new file or overwrite existing |
| `edit` | Replace exact string in file |
| `glob` | Fast file pattern matching (e.g., `**/*.ts`) |
| `grep` | Content search using regex |
| `bash` | Execute shell commands |

---

## 4. GitHub MCP

**Purpose**: GitHub API operations — create issues, PRs, manage repositories, fetch code.

### Installation

```bash
# Install via npm
npm install -g @modelcontextprotocol/server-github

# Requires GitHub CLI (gh) installed
# Verify: gh --version
```

### Configuration

Add to `opencode.json` `mcp` section:

```json
{
  "mcp": {
    "github": {
      "command": [
        "C:\\Users\\Pc Living\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-github\\dist\\index.js"
      ],
      "type": "local",
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### Environment Setup

Create `.env` file in project root:

```bash
# .env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=your-username/social-pip
```

### Alternative: Use GitHub CLI Directly

If MCP server has issues, configure `gh` CLI as fallback:

```json
{
  "permission": {
    "bash": {
      "gh issue *": "allow",
      "gh pr *": "allow",
      "gh repo *": "allow"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `gh issue create` | Create new GitHub issue |
| `gh issue list` | List repository issues |
| `gh pr create` | Create pull request |
| `gh pr list` | List pull requests |
| `gh repo view` | View repository info |
| `gh api` | Raw GitHub API calls |

### Usage Examples

```bash
# Create issue
gh issue create --title "Add Facebook Groups support" --body "Implement auto-posting to Facebook Groups"

# Create PR
gh pr create --title "feat: add facebook-groups" --body "## Summary\n- Added Facebook Groups auto-posting"
```

---

## 5. SQLite MCP

**Purpose**: Direct database queries for SQLite database used by Social-Pip.

### Installation

```bash
# Install via npm
npm install -g sqlite-mcp-server
```

### Requirements

- SQLite database file (social-pip.db)
- Prisma CLI (para generate/migrate)

### Configuration

Add to `opencode.json` `mcp` section:

```json
{
  "mcp": {
    "sqlite": {
      "command": ["npx", "-y", "sqlite-mcp-server", "./data/social-pip.db"],
      "type": "local"
    }
  }
}
```

### Alternative: Direct sqlite3 via bash

```json
{
  "permission": {
    "bash": {
      "sqlite3 *": "allow"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `sqlite_query` | Execute SQL query |
| `sqlite_list_tables` | List all tables |
| `sqlite_describe` | Describe table schema |

### Example Queries

```sql
-- List accounts
SELECT * FROM accounts WHERE is_active = 1;

-- Get scheduled tasks
SELECT * FROM scheduled_tasks 
WHERE status = 'PENDING' 
AND scheduled_at <= datetime('now');

-- Platform configuration
SELECT * FROM platform_config WHERE platform = 'facebook';
```

---

## 6. Puppeteer MCP

**Purpose**: Browser automation for social platform interactions — login, post, scroll, scrape.

### Installation

```bash
# Install via npm
npm install -g @modelcontextprotocol/server-puppeteer

# Requires Chrome/Chromium installed
```

### Configuration

Add to `opencode.json` `mcp` section:

```json
{
  "mcp": {
    "puppeteer": {
      "command": [
        "C:\\Users\\Pc Living\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-puppeteer\\dist\\index.js"
      ],
      "type": "local",
      "env": {
        "PUPPETEER_EXECUTABLE_PATH": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
      }
    }
  }
}
```

### Alternative: Custom Browser Launch

For Social-Pip's anti-ban requirements:

```json
{
  "mcp": {
    "puppeteer-socialpip": {
      "command": [
        "C:\\Users\\Pc Living\\social-pip\\node_modules\\.bin\\mcp-server-puppeteer",
        "--headless",
        "--user-data-dir",
        "${CHROME_PROFILE_PATH}",
        "--no-sandbox",
        "--disable-blink-features=AutomationControlled"
      ],
      "type": "local"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `puppeteer_navigate` | Navigate to URL |
| `puppeteer_screenshot` | Take screenshot |
| `puppeteer_click` | Click element |
| `puppeteer_type` | Type text (human-like) |
| `puppeteer_evaluate` | Execute JavaScript |
| `puppeteer_scroll` | Scroll page |

### Usage for Social-Pip

```typescript
// Example: Login to Facebook
await navigate('https://www.facebook.com');

// Wait for login form
await waitForSelector('#email');
await type('#email', 'user@example.com');
await type('#password', 'securepassword');
await click('button[name="login"]');

// Take screenshot for verification
await screenshot();
```

---

## 7. Brave Search MCP

**Purpose**: Web search for research — find APIs, documentation, market data.

### Installation

```bash
# Install via npm
npm install -g @modelcontextprotocol/server-brave-search
```

### Configuration

Add to `opencode.json` `mcp` section:

```json
{
  "mcp": {
    "brave-search": {
      "command": [
        "C:\\Users\\Pc Living\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-brave-search\\dist\\index.js"
      ],
      "type": "local",
      "env": {
        "BRAVE_API_KEY": "${BRAVE_API_KEY}"
      }
    }
  }
}
```

### Environment Setup

```bash
# .env
BRAVE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Alternative: WebFetch Tool

OpenCode includes built-in web fetching:

```json
{
  "mcp": {
    "webfetch": {
      "type": "builtin"
    }
  }
}
```

### Available Tools

| Tool | Description |
|------|-------------|
| `brave_search` | Web search (returns titles, snippets, URLs) |
| `brave_fetch` | Fetch and parse web page content |

---

## Complete opencode.json Configuration

### Full MCP Section

```json
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "gentleman": {
      "description": "Senior Architect mentor for Social-Pip",
      "mode": "primary",
      "model": "opencode/qwen3.6-plus-free",
      "prompt": "{file:./AGENTS.md}",
      "tools": {
        "edit": true,
        "write": true
      }
    }
  },
  "mcp": {
    "context7": {
      "enabled": true,
      "type": "remote",
      "url": "https://mcp.context7.com/mcp"
    },
    "engram": {
      "command": [
        "C:\\Users\\Pc Living\\go\\bin\\engram.exe",
        "mcp",
        "--tools=agent"
      ],
      "type": "local"
    },
    "filesystem": {
      "command": [
        "C:\\Users\\Pc Living\\social-pip\\node_modules\\.bin\\mcp-server-filesystem",
        "C:\\Users\\Pc Living\\social-pip"
      ],
      "type": "local"
    },
    "github": {
      "command": [
        "C:\\Users\\Pc Living\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-github\\dist\\index.js"
      ],
      "type": "local"
    },
    "sqlite": {
      "command": ["npx", "-y", "sqlite-mcp-server", "./data/social-pip.db"],
      "type": "local"
    },
    "puppeteer": {
      "command": [
        "C:\\Users\\Pc Living\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-puppeteer\\dist\\index.js"
      ],
      "type": "local"
    },
    "brave-search": {
      "command": [
        "C:\\Users\\Pc Living\\AppData\\Roaming\\npm\\node_modules\\@modelcontextprotocol\\server-brave-search\\dist\\index.js"
      ],
      "type": "local"
    }
  },
  "permission": {
    "bash": {
      "*": "allow",
      "git commit *": "ask",
      "git push": "ask",
      "git push *": "ask",
      "gh *": "allow",
      "psql *": "allow"
    },
    "read": {
      "*": "allow",
      "**/.env": "deny",
      "**/.env.*": "deny"
    }
  }
}
```

---

## Installation Commands Summary

### Step 1: Install Node.js MCP Packages

```bash
# Global installation
cd C:\Users\Pc Living
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-github
npm install -g sqlite-mcp-server
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-brave-search
```

### Step 2: Install Go (for Engram)

```bash
# Download from https://go.dev/dl/
# Install to C:\Users\Pc Living\go\
```

### Step 3: Clone and Build Engram

```bash
cd C:\Users\Pc Living\go\src\github.com\gentleman-ai\engram
git clone https://github.com/gentleman-ai/engram.git
cd engram
go build -o engram.exe ./cmd/engram
```

### Step 4: Verify Installation

```bash
# Test each MCP server
engram.exe mcp --help

# Test filesystem
which mcp-server-filesystem
# or
where mcp-server-filesystem
```

---

## Using MCPs in OpenCode

### Direct Tool Calls

```
opencode$ Read the package.json to understand dependencies
→ Uses filesystem.read tool

opencode$ Create an issue for the Facebook Groups feature
→ Uses github/gh issue create

opencode$ Query the database for active accounts
→ Uses sqlite_query tool

opencode$ Search for Twitter API documentation
→ Uses context7 tool

opencode$ Remember this decision
→ Uses mem_save tool
```

### Sequential Thinking with MCP

Enable sequential thinking for complex problem solving:

```json
{
  "agent": {
    "gentleman": {
      "sequentialThinking": {
        "enabled": true,
        "maxIterations": 5
      }
    }
  }
}
```

---

## Troubleshooting

### MCP Server Not Starting

```bash
# Check if command exists
where mcp-server-filesystem

# Test manually
C:\Users\Pc Living\AppData\Roaming\npm\node_modules\@modelcontextprotocol\server-filesystem\dist\index.js --help
```

### Permission Denied

```bash
# Verify permissions in opencode.json
# Check that directory is in allowed list
```

### Context7 Rate Limit

```
429 Too Many Requests
→ Wait 60 seconds or use webfetch instead
```

---

## References

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [OpenCode MCP Docs](https://opencode.ai/docs/mcp)
- [Context7 Library](https://context7.com/)
- [Engram GitHub](https://github.com/gentleman-ai/engram)
