# n8n Workflows - Social-Pip

> Ready-to-import workflow templates for Social-Pip automation
> Última actualización: Abril 2026

---

## 📋 Available Workflows

| Workflow | Platform | File | Description |
|----------|----------|------|-------------|
| Facebook Auto Post | Facebook | `facebook-auto-post.json` | Scheduled posting with anti-ban validation |
| Instagram Auto Post | Instagram | `instagram-auto-post.json` | Feed posts with hashtag/content checks |
| Twitter Auto Post | Twitter/X | `twitter-auto-post.json` | Tweets with strict 280-char validation |
| LinkedIn Auto Post | LinkedIn | `linkedin-auto-post.json` | Professional posts (weekdays only) |
| TikTok Auto Post | TikTok | `tiktok-auto-post.json` | Video uploads with warmup checks |
| Telegram Auto Message | Telegram | `telegram-auto-message.json` | Bot messages via Telegram API |
| WhatsApp Auto Message | WhatsApp | `whatsapp-auto-message.json` | Messages with HIGH ban risk handling |
| Email Auto Send | Email | `email-auto-send.json` | Emails via Resend/Brevo/SendGrid |
| Multi-Platform Broadcast | All | `multi-platform-broadcast.json` | Single content to multiple platforms |

---

## 🚀 How to Import

### Via n8n UI

1. Open n8n dashboard
2. Click **"+"** → **"Import from File"**
3. Select the `.json` file
4. Configure credentials (see below)
5. Activate the workflow

### Via API

```bash
curl -X POST http://localhost:5678/api/v1/workflows \
  -H "Content-Type: application/json" \
  -d @facebook-auto-post.json
```

---

## 🔑 Required Credentials

### Environment Variables

Set these in n8n Settings → Variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `SOCIAL_PIP_API_KEY` | ✅ | API key for Social-Pip backend |
| `TELEGRAM_CHAT_ID` | ✅ | Chat ID for notifications |
| `TELEGRAM_ADMIN_CHAT_ID` | ✅ | Admin chat for errors |

### Telegram Bot

1. Create bot via [@BotFather](https://t.me/botfather)
2. Get bot token
3. Add to n8n Credentials → Telegram API

### Email Providers (Free Tier)

| Provider | Free Limit | Setup |
|----------|------------|-------|
| Resend | 100/day | [resend.com](https://resend.com) |
| Brevo | 300/day | [brevo.com](https://brevo.com) |
| SendGrid | 100/day | [sendgrid.com](https://sendgrid.com) |

---

## 📊 Anti-Ban Features

Every workflow includes:

1. **Pre-Publish Validation**
   - Daily/hourly limits check
   - Minimum delay enforcement
   - Account status verification

2. **Error Handling**
   - Continue on fail for non-critical errors
   - Error codes (E001-E005)
   - Automatic logging to backend

3. **Notifications**
   - Telegram alerts for failures
   - Success confirmations
   - Platform-specific warnings

---

## 📐 Platform Limits Reference

| Platform | Max/Day | Min Delay | Max Chars | Risk Level |
|----------|---------|-----------|-----------|------------|
| Facebook | 10 | 30 min | 63,206 | Low |
| Instagram | 5 | 45 min | 2,200 | Medium |
| Twitter | 20 | 15 min | 280 | Low |
| LinkedIn | 3 | 60 min | 1,300 | Low |
| TikTok | 3 | 120 min | 2,200 | High |
| Telegram | 500 | 1 sec | 4,096 | Very Low |
| WhatsApp | 100-200 | 20 sec | - | High |
| Email | 100-300 | 1 sec | - | Very Low |

---

## 🔄 Workflow Structure

All workflows follow this pattern:

```
Trigger → Validate → Check Valid? → Publish → Parse → Log → Notify
                              ↓
                          Notify Blocked
```

### Nodes Breakdown

1. **Schedule Trigger** - Cron-based timing
2. **Validate** - Anti-ban and content checks
3. **If** - Branch valid/invalid
4. **HTTP Request** - Publish to platform
5. **Code** - Parse response
6. **HTTP Request** - Log to backend
7. **Telegram** - Notify result

---

## ⚠️ Important Notes

### WhatsApp
- **HIGH ban risk** - Use with caution
- Warmup period: 14 days minimum
- Start with 50 messages/day maximum

### TikTok
- Requires video content
- Account warmup recommended
- Shadowban monitoring suggested

### LinkedIn
- Weekdays only (no weekend posts)
- Professional tone enforced
- Max 5 hashtags recommended

---

## 🛠️ Customization

### Modify Limits

Edit the `Validate` node in each workflow:

```javascript
// Example: Change Facebook daily limit
const FACEBOOK_MAX_DAILY = 10;  // Change to your preference

// Example: Adjust minimum delay
const FACEBOOK_MIN_DELAY_MS = 30 * 60 * 1000;  // 30 minutes
```

### Add New Platforms

1. Copy an existing workflow JSON
2. Modify validation rules
3. Update API endpoint
4. Add to this README

---

## 📚 Related Documentation

- [Anti-Ban Patterns](../anti-ban-patterns.md)
- [Error Handling](../error-handling.md)
- [Monitoring & Alerts](../monitoring-alerts.md)
- [Platform Automation](../platforms/platforms-automation.md)

---

## 🤝 Contributing

To add a new workflow:

1. Create JSON file following the existing pattern
2. Include anti-ban validation
3. Add error handling with codes
4. Document in this README
5. Test with mock data

---

*Generated for Social-Pip - Abril 2026*
