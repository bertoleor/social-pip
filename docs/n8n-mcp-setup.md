# n8n MCP Integration Setup
> Parte de: [[README]] · Relacionados: [[mcp-servers]] · [[opencode-config]]

## Prerequisites
- n8n v2.17.5+ (MCP support required)
- Social-Pip desktop app installed and built
- Social-Pip has been run at least once (to create the SQLite database)

## Step 1: Build the Desktop App

```bash
cd E:\social-pip
pnpm build:desktop
```

The built executable will be at:
```
apps\desktop\src-tauri\target\release\social-pip.exe
```

## Step 2: Initialize the Database

Run the Social-Pip app ONCE to create the SQLite database schema. This creates the database at:
```
%LOCALAPPDATA%\social-pip\social-pip.db
```

After that, the MCP server can read/write this database directly without the app window being open.

## Step 3: Configure n8n MCP Client

### Option A: n8n Settings (Recommended)

In n8n, go to **Settings → MCP Servers** and add:

```json
{
  "mcpServers": {
    "social-pip": {
      "command": "apps\\desktop\\src-tauri\\target\\release\\social-pip.exe",
      "args": ["--mcp"],
      "transport": "stdio"
    }
  }
}
```

**IMPORTANT**: Replace the command path with the FULL absolute path to your built executable, e.g.:
```
E:\\social-pip\\apps\\desktop\\src-tauri\\target\\release\\social-pip.exe
```

### Option B: n8n MCP Node

In any n8n workflow, add an **MCP** node and configure:
- **Command**: `E:\social-pip\apps\desktop\src-tauri\target\release\social-pip.exe`
- **Args**: `["--mcp"]`
- **Transport**: stdio

## Step 4: Verify Connection

In n8n, add an MCP node and select "social-pip" as the server. You should see 6 tools available:

| Tool | Description | Parameters |
|------|-------------|------------|
| `start_posting_session` | Start a posting session to multiple groups/pages | platform*, accountId*, targets*, content*, mediaUrls? |
| `list_accounts` | List all social media accounts | platform? |
| `list_posts` | List posts with optional filters | limit?, status?, platform? |
| `create_post` | Create a new post draft | platform*, content*, accountId*, mediaUrls? |
| `get_anti_ban_stats` | Get anti-ban protection statistics | (none) |
| `get_schedules` | Get scheduled posts | limit?, platform? |

*Required parameters marked with asterisk*

## How It Works

The MCP server runs as a **stateless process**:

```
n8n ──→ social-pip.exe --mcp ──→ reads/writes SQLite ──→ responds ──→ exits
```

- **No app window needed** — the MCP server reads the database directly
- **No cloud needed** — everything runs locally
- **No port conflicts** — uses stdio (stdin/stdout), not HTTP
- **Each call is independent** — n8n starts the process, gets the response, process exits

## Example Workflows

### Auto-post every 2 hours
```
Schedule Trigger (every 2 hours)
  → MCP Tool: get_anti_ban_stats (is it safe to post?)
  → IF safe:
      → MCP Tool: create_post (platform: facebook_groups, content: "Your post", accountId: "...")
  → IF not safe:
      → Wait 30min → retry
```

### Daily content calendar
```
Schedule Trigger (daily at 9am)
  → MCP Tool: list_accounts (get Facebook accounts)
  → For each account:
      → MCP Tool: create_post (schedule posts for the day)
```

### Monitor posting health
```
Schedule Trigger (every 6 hours)
  → MCP Tool: get_anti_ban_stats
  → IF circuit breaker open:
      → Send email alert
  → IF actions > 80% of daily limit:
      → Send warning notification
```

## Important Notes

1. **PC must be on** — n8n and the MCP server are local processes. If the PC is off, nothing runs.
2. **Database must exist** — Run the Social-Pip GUI at least once before using MCP. This creates the database schema.
3. **Chrome needed for actual posting** — The MCP tools create posts/sessions in the database. To actually publish on Facebook, the Chrome extension must be active with a logged-in Facebook session.
4. **Anti-ban protection applies** — Always check `get_anti_ban_stats` before creating posts. The system is designed to prevent Facebook from flagging your account.

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Database not yet initialized" | Run the Social-Pip GUI app once to create the database |
| n8n can't find the tool | Check the executable path is absolute and correct |
| Empty results from list_accounts | Add accounts through the Social-Pip GUI first |
| "Platform X is not active" | Only Facebook platforms are active in v1 |
