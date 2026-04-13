# Workflows de Marketing

## Resumen

Este documento presenta los workflows de marketing para Social-Pip, incluyendo lead capture, outreach, hashtag strategist, y campañas de promoción.

---

## 1. Workflow: Lead Capture

### 1.1 Descripción

Captura leads de grupos y páginas, guardando información para seguimiento.

### 1.2 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         WORKFLOW: LEAD CAPTURE - SOCIAL-PIP                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │  SCHEDULE  │      │   LOAD    │      │  ITERATE   │      │   EXTRACT  │
     │  TRIGGER   │─────▶│  TARGET   │─────▶│   GROUPS   │─────▶│   LEADS    │
     │            │      │   GROUPS   │      │            │      │            │
     │ Cron:      │      │            │      │ For each   │      │ • Name     │
     │ 0 */3 * * *│      │ Read from  │      │   group    │      │ • Profile  │
     └─────────────┘      │   JSON     │      │            │      │ • Group    │
                         └─────────────┘      └─────────────┘      │ • Activity │
                                    │                               └─────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   SCRAPE GROUP    │
                         │   MEMBERS         │
                         │                   │
                         │ • Get member list │
                         │ • Filter active   │
                         │ • Extract contact │
                         └─────────────────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐     ┌─────────────────────┐
                         │   FILTER LEADS    │────▶│   STORE LEADS     │
                         │                   │     │                    │
                         │ • Remove duplicates│     │ • SQLite DB       │
                         │ • Filter by        │     │ • Deduplicate     │
                         │   activity         │     │ • Add source      │
                         │ • Score relevance │     │ • Tag by sector   │
                         └─────────────────────┘     └─────────────────────┘
                                                      │
                                                      ▼
                                           ┌─────────────────────┐
                                           │   NOTIFY (n8n)     │
                                           │                    │
                                           │ • Slack/Discord    │
                                           │ • New leads alert  │
                                           └─────────────────────┘
```

### 1.3 Estructura del Workflow

```json
{
  "name": "SP - Lead Capture",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            { "field": "cronExpression", "cronExpression": "0 */3 * * *" }
          ]
        }
      }
    },
    {
      "id": "load_groups",
      "name": "Load Target Groups",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/groups/monitor.json"
      }
    },
    {
      "id": "loop_groups",
      "name": "Loop Groups",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "parameters": {}
    },
    {
      "id": "scrape",
      "name": "Scrape Posts",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "method": "GET",
        "url": "={{$env.CHROME_EXT_URL + '/scrape-group?groupId=' + $json.groupId}}"
      }
    },
    {
      "id": "filter_leads",
      "name": "Filter Potential Leads",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300],
      "parameters": {
        "jsCode": "const posts = $input.first().json.posts || [];\n\n// Keywords para detectar leads\nconst leadKeywords = [\n  'busco', 'necesito', 'buscando', 'quiero', 'busca',\n  'presupuesto', 'cotizar', 'cuanto cuesta', 'precio',\n  'vendo', 'alquilo', 'oferta', 'promo', 'descuento'\n];\n\n// Keywords de sector (ej: inmobiliario)\nconst sectorKeywords = ['departamento', 'casa', 'ph', 'terreno', 'local', 'oficina', 'inmueble'];\n\nconst leads = posts.filter(post => {\n  const content = (post.content || '').toLowerCase();\n  \n  // Debe tener keywords de lead Y keywords de sector\n  const hasLeadKeyword = leadKeywords.some(k => content.includes(k));\n  const hasSectorKeyword = sectorKeywords.some(k => content.includes(k));\n  \n  return hasLeadKeyword && hasSectorKeyword;\n}).map(post => ({\n  id: post.id,\n  groupId: post.groupId,\n  groupName: post.groupName,\n  author: post.author,\n  authorId: post.authorId,\n  content: post.content,\n  timestamp: post.timestamp,\n  type: 'inquiry',\n  status: 'new',\n  score: 0\n}));\n\n// Score leads\nleads.forEach(lead => {\n  const content = lead.content.toLowerCase();\n  \n  // Higher score for urgent keywords\n  if (content.includes('urgente') || content.includes('ya')) lead.score += 10;\n  \n  // Higher score for specific requirements\n  if (content.includes('$') || content.includes('usd') || content.includes('pesos')) lead.score += 5;\n  \n  // Higher score for location\n  if (content.includes('palermo') || content.includes('centro') || content.includes('zona')) lead.score += 3;\n});\n\n// Sort by score\nleads.sort((a, b) => b.score - a.score);\n\nreturn {\n  json: {\n    ...$input.first().json,\n    leads: leads.slice(0, 20), // Max 20 per batch\n    count: leads.length\n  }\n};"
      }
    },
    {
      "id": "save_leads",
      "name": "Save to Database",
      "type": "n8n-nodes-base.writeFile",
      "position": [1250, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/leads/{{$now}}.json",
        "mode": "append",
        "output": "json"
      }
    },
    {
      "id": "enrich",
      "name": "Enrich Lead Data",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1450, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-lead-enrich/message",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [
                {
                  "type": "text",
                  "content": "={{'Analiza este lead y extrae: nombre, teléfono, email, presupuesto, ubicación. Lead: ' + JSON.stringify($json.leads[0])}}"
                }
              ]
            }
          ]
        }
      }
    },
    {
      "id": "update_lead",
      "name": "Update Lead with Data",
      "type": "n8n-nodes-base.code",
      "position": [1650, 300],
      "parameters": {
        "jsCode": "const lead = $input.first().json.leads[0];\nconst enriched = $input.first().json.parts?.[0]?.content || '';\n\n// Try to extract structured data from AI response\ntry {\n  const extracted = JSON.parse(enriched);\n  lead.enriched = extracted;\n} catch {\n  // If not JSON, save as raw\n  lead.enrichedRaw = enriched;\n}\n\nlead.analyzedAt = new Date().toISOString();\n\nreturn {\n  json: {\n    ...$input.first().json,\n    enrichedLead: lead\n  }\n};"
      }
    },
    {
      "id": "check_score",
      "name": "Check Lead Score",
      "type": "n8n-nodes-base.if",
      "position": [1850, 300],
      "parameters": {
        "conditions": {
          "conditions": [
            { "value1": "={{$json.enrichedLead.score}}", "operation": "greater", "value2": "10" }
          ]
        }
      }
    },
    {
      "id": "notify_high",
      "name": "Notify High Priority",
      "type": "n8n-nodes-base.telegram",
      "position": [2050, 300],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "🎯 LEAD CALIENTE!\n\nAutor: {{$json.enrichedLead.author}}\nContenido: {{$json.enrichedLead.content.substring(0, 100)}}...\nScore: {{$json.enrichedLead.score}}"
      }
    },
    {
      "id": "aggregate",
      "name": "Aggregate",
      "type": "n8n-nodes-base.aggregate",
      "position": [2250, 300],
      "parameters": {
        "aggregate": "append"
      }
    },
    {
      "id": "summary",
      "name": "Send Summary",
      "type": "n8n-nodes-base.telegram",
      "position": [2450, 300],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "📊 Lead Capture: {{$json.totalFound}} leads encontrados en {{$json.groupsScanned}} grupos"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{ "node": "Load Target Groups", "type": "main", "index": 0 }]]
    },
    "Load Target Groups": {
      "main": [[{ "node": "Loop Groups", "type": "main", "index": 0 }]]
    },
    "Loop Groups": {
      "main": [[{ "node": "Scrape Posts", "type": "main", "index": 0 }]]
    },
    "Scrape Posts": {
      "main": [[{ "node": "Filter Potential Leads", "type": "main", "index": 0 }]]
    },
    "Filter Potential Leads": {
      "main": [[{ "node": "Save to Database", "type": "main", "index": 0 }]]
    },
    "Save to Database": {
      "main": [[{ "node": "Enrich Lead Data", "type": "main", "index": 0 }]]
    },
    "Enrich Lead Data": {
      "main": [[{ "node": "Update Lead with Data", "type": "main", "index": 0 }]]
    },
    "Update Lead with Data": {
      "main": [[{ "node": "Check Lead Score", "type": "main", "index": 0 }]]
    },
    "Check Lead Score": {
      "main": [
        [{ "node": "Notify High Priority", "type": "main", "index": 0 }],
        [{ "node": "Aggregate", "type": "main", "index": 1 }]
      ]
    },
    "Notify High Priority": {
      "main": [[{ "node": "Aggregate", "type": "main", "index": 0 }]]
    },
    "Aggregate": {
      "main": [
        [{ "node": "Loop Groups", "type": "main", "index": 0 }],
        [{ "node": "Send Summary", "type": "main", "index": 0 }]
      ]
    }
  },
  "tags": ["social-pip", "leads", "marketing", "capture"]
}
```

---

## 2. Workflow: Outreach Sender

### 2.1 Descripción

Envía mensajes de outreach a nuevos miembros de grupos.

```json
{
  "name": "SP - Outreach Sender",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "outreach"
      }
    },
    {
      "id": "load_template",
      "name": "Load Outreach Template",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/outreach.json"
      }
    },
    {
      "id": "load_targets",
      "name": "Load New Members",
      "type": "n8n-nodes-base.readFile",
      "position": [650, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/groups/new-members.json"
      }
    },
    {
      "id": "filter",
      "name": "Filter Not Contacted",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const members = $input.first().json || [];\nconst alreadyContacted = $input.first().json.contacted || [];\n\n// Filter out already contacted\nconst newMembers = members.filter(m => !alreadyContacted.includes(m.id));\n\n// Apply limit\nconst limit = 50;\nconst toContact = newMembers.slice(0, limit);\n\nreturn {\n  json: {\n    members: toContact,\n    count: toContact.length\n  }\n};"
      }
    },
    {
      "id": "loop",
      "name": "Loop Members",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [1050, 300],
      "parameters": {}
    },
    {
      "id": "wait",
      "name": "Random Delay",
      "type": "n8n-nodes-base.wait",
      "position": [1250, 300],
      "parameters": {
        "amount": "={{Math.floor(Math.random() * 30) + 15}}",
        "unit": "seconds"
      }
    },
    {
      "id": "prepare",
      "name": "Prepare Message",
      "type": "n8n-nodes-base.code",
      "position": [1450, 300],
      "parameters": {
        "jsCode": "const member = $input.first().json;\nconst template = $input.first().json.template;\n\n// Replace variables\nlet message = template\n  .replace('{name}', member.name || 'Hola')\n  .replace('{group}', member.groupName || '');\n\n// Add personalization if available\nif (member.bio) {\n  message += '\\n\\nVi que te interesas en ' + (member.bio.substring(0, 50)) + '...';\n}\n\nreturn {\n  json: {\n    ...member,\n    message,\n    sentAt: new Date().toISOString()\n  }\n};"
      }
    },
    {
      "id": "send",
      "name": "Send Message",
      "type": "n8n-nodes-base.httpRequest",
      "position": [1650, 300],
      "parameters": {
        "method": "POST",
        "url": "={{$env.CHROME_EXT_URL + '/send-message'}}",
        "bodyParameters": {
          "parameters": [
            {
              "name": "body",
              "value": "={{$json}}"
            }
          ]
        }
      }
    },
    {
      "id": "check",
      "name": "Check Result",
      "type": "n8n-nodes-base.if",
      "position": [1850, 300],
      "parameters": {
        "conditions": {
          "conditions": [
            { "value1": "={{$json.success}}", "operation": "equal", "value2": "true" }
          ]
        }
      }
    },
    {
      "id": "log_success",
      "name": "Log Success",
      "type": "n8n-nodes-base.writeFile",
      "position": [2050, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/outreach/sent_{{$now}}.json",
        "mode": "append",
        "output": "json"
      }
    },
    {
      "id": "log_error",
      "name": "Log Error",
      "type": "n8n-nodes-base.writeFile",
      "position": [2050, 450],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/outreach/errors_{{$now}}.json",
        "mode": "append",
        "output": "json"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [2250, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [
        [{ "node": "Load Outreach Template", "type": "main", "index": 0 }],
        [{ "node": "Load New Members", "type": "main", "index": 0 }]
      ]
    },
    "Load Outreach Template": {
      "main": [[{ "node": "Filter Not Contacted", "type": "main", "index": 0 }]]
    },
    "Load New Members": {
      "main": [[{ "node": "Filter Not Contacted", "type": "main", "index": 0 }]]
    },
    "Filter Not Contacted": {
      "main": [[{ "node": "Loop Members", "type": "main", "index": 0 }]]
    },
    "Loop Members": {
      "main": [[{ "node": "Random Delay", "type": "main", "index": 0 }]]
    },
    "Random Delay": {
      "main": [[{ "node": "Prepare Message", "type": "main", "index": 0 }]]
    },
    "Prepare Message": {
      "main": [[{ "node": "Send Message", "type": "main", "index": 0 }]]
    },
    "Send Message": {
      "main": [[{ "node": "Check Result", "type": "main", "index": 0 }]]
    },
    "Check Result": {
      "main": [
        [{ "node": "Log Success", "type": "main", "index": 0 }],
        [{ "node": "Log Error", "type": "main", "index": 1 }]
      ]
    },
    "Log Success": {
      "main": [
        [{ "node": "Loop Members", "type": "main", "index": 0 }],
        [{ "node": "Respond", "type": "main", "index": 0 }]
      ]
    },
    "Log Error": {
      "main": [[{ "node": "Loop Members", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "outreach", "marketing"]
}
```

---

## 3. Workflow: Hashtag Strategist

### 3.1 Descripción

Genera estrategias de hashtags según sector y tendencia.

```json
{
  "name": "SP - Hashtag Strategist",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "hashtag-strategy"
      }
    },
    {
      "id": "load_sector",
      "name": "Load Sector Hashtags",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/manual-de-marca/hashtags/{{$json.sector}}.json"
      }
    },
    {
      "id": "trending",
      "name": "Get Trending",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "method": "GET",
        "url": "={{'https://api.twitter.com/2/tweets/search/recent?query=' + $json.sector}}"
      }
    },
    {
      "id": "analyze",
      "name": "Analyze with OpenCode",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-hashtags/message",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [
                {
                  "type": "text",
                  "content": "={{'Genera 20 hashtags relevantes para: sector=' + $json.sector + ', tema=' + $json.topic + '. Incluye: 5 hashtags de marca, 5 de nicho, 5 populares, 5 de tendencia. Devuelve en formato JSON.'}}\n                }\n              ]
            }
          ]
        }
      }
    },
    {
      "id": "extract",
      "name": "Extract Hashtags",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300],
      "parameters": {
        "jsCode": "const response = $input.first().json.parts?.[0]?.content || '';\n\n// Try to extract JSON\nlet hashtags = { brand: [], niche: [], popular: [], trending: [] };\n\ntry {\n  // Try JSON format\n  const parsed = JSON.parse(response);\n  hashtags = parsed;\n} catch {\n  // Try to extract from text\n  const matches = response.match(/#\\w+/g) || [];\n  \n  // Simple categorization\n  hashtags.brand = matches.slice(0, 5);\n  hashtags.niche = matches.slice(5, 10);\n  hashtags.popular = matches.slice(10, 15);\n  hashtags.trending = matches.slice(15, 20);\n}\n\nreturn {\n  json: {\n    ...$input.first().json,\n    hashtags,\n    total: hashtags.brand.length + hashtags.niche.length + hashtags.popular.length + hashtags.trending.length\n  }\n};"
      }
    },
    {
      "id": "apply_limit",
      "name": "Apply Platform Limit",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300],
      "parameters": {
        "jsCode": "const hashtags = $input.first().json.hashtags;\nconst platform = $input.first().json.platform || 'instagram';\n\nconst limits = {\n  instagram: 30,\n  facebook: 5,\n  twitter: 5,\n  linkedin: 3,\n  tiktok: 20\n};\n\nconst limit = limits[platform] || 30;\n\n// Combine and limit\nconst all = [\n  ...hashtags.brand,\n  ...hashtags.niche,\n  ...hashtags.popular,\n  ...hashtags.trending\n].slice(0, limit);\n\nreturn {\n  json: {\n    ...$input.first().json,\n    finalHashtags: all,\n    platform,\n    limit\n  }\n};"
      }
    },
    {
      "id": "save",
      "name": "Save Strategy",
      "type": "n8n-nodes-base.writeFile",
      "position": [1450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/hashtags/strategy_{{$now}}.json",
        "output": "json"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1650, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json.finalHashtags.join(' ')}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Load Sector Hashtags", "type": "main", "index": 0 }]]
    },
    "Load Sector Hashtags": {
      "main": [[{ "node": "Get Trending", "type": "main", "index": 0 }]]
    },
    "Get Trending": {
      "main": [[{ "node": "Analyze with OpenCode", "type": "main", "index": 0 }]]
    },
    "Analyze with OpenCode": {
      "main": [[{ "node": "Extract Hashtags", "type": "main", "index": 0 }]]
    },
    "Extract Hashtags": {
      "main": [[{ "node": "Apply Platform Limit", "type": "main", "index": 0 }]]
    },
    "Apply Platform Limit": {
      "main": [
        [{ "node": "Save Strategy", "type": "main", "index": 0 }],
        [{ "node": "Respond", "type": "main", "index": 0 }]
      ]
    },
    "Save Strategy": {
      "main": [[{ "node": "Respond", "type": "main", "index": 0 }]]
    }
  },
  "tags": ["social-pip", "hashtags", "marketing", "strategy"]
}
```

---

## 4. Workflow: Campaign Manager

### 4.1 Descripción

Gestiona campañas de marketing completas.

```json
{
  "name": "SP - Campaign Manager",
  "nodes": [
    {
      "id": "trigger",
      "name": "Webhook Trigger",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300],
      "parameters": {
        "httpMethod": "POST",
        "path": "campaign"
      }
    },
    {
      "id": "load_campaign",
      "name": "Load Campaign Config",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/campaigns/{{$json.campaignId}}.json"
      }
    },
    {
      "id": "prepare",
      "name": "Prepare Content",
      "type": "n8n-nodes-base.code",
      "position": [650, 300],
      "parameters": {
        "jsCode": "const campaign = $input.first().json;\n\n// Generate content for each platform\nconst content = {};\n\ncampaign.platforms.forEach(platform => {\n  const template = campaign.templates?.[platform] || campaign.templates?.default;\n  \n  content[platform] = {\n    template,\n    variables: campaign.variables,\n    hashtags: campaign.hashtags,\n    schedule: campaign.schedule?.[platform]\n  };\n});\n\nreturn {\n  json: {\n    ...campaign,\n    preparedContent: content,\n    status: 'ready'\n  }\n};"
      }
    },
    {
      "id": "schedule",
      "name": "Schedule Posts",
      "type": "n8n-nodes-base.code",
      "position": [850, 300],
      "parameters": {
        "jsCode": "const content = $input.first().json.preparedContent;\nconst campaign = $input.first().json;\n\n// Create scheduled posts\nconst posts = [];\n\nObject.keys(content).forEach(platform => {\n  const platformContent = content[platform];\n  const schedule = platformContent.schedule;\n  \n  // Create post for each scheduled time\n  schedule.forEach((time, index) => {\n    posts.push({\n      id: `${campaign.id}_${platform}_${index}`,\n      platform,\n      content: platformContent.template,\n      variables: platformContent.variables,\n      scheduledAt: time,\n      status: 'scheduled'\n    });\n  });\n});\n\nreturn {\n  json: {\n    ...$input.first().json,\n    scheduledPosts: posts,\n    totalPosts: posts.length\n  }\n};"
      }
    },
    {
      "id": "save_posts",
      "name": "Save Scheduled Posts",
      "type": "n8n-nodes-base.writeFile",
      "position": [1050, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/scheduled/{{$json.campaignId}}.json",
        "output": "json"
      }
    },
    {
      "id": "update_campaign",
      "name": "Update Campaign Status",
      "type": "n8n-nodes-base.code",
      "position": [1250, 300],
      "parameters": {
        "jsCode": "return {\n  json: {\n    ...$input.first().json,\n    status: 'active',\n    activatedAt: new Date().toISOString()\n  }\n};"
      }
    },
    {
      "id": "save_campaign",
      "name": "Save Campaign",
      "type": "n8n-nodes-base.writeFile",
      "position": [1450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/campaigns/{{$json.campaignId}}.json",
        "output": "json"
      }
    },
    {
      "id": "notify",
      "name": "Notify Campaign Started",
      "type": "n8n-nodes-base.telegram",
      "position": [1650, 300],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "🚀 Campaign iniciada: {{$json.name}}\nPosts programados: {{$json.totalPosts}}\nPlataformas: {{$json.platforms.join(', ')}}"
      }
    },
    {
      "id": "respond",
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1850, 300],
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{$json}}"
      }
    }
  ],
  "connections": {
    "Webhook Trigger": {
      "main": [[{ "node": "Load Campaign Config", "type": "main", "index": 0 }]]
    },
    "Load Campaign Config": {
      "main": [[{ "node": "Prepare Content", "type": "main", "index": 0 }]]
    },
    "Prepare Content": {
      "main": [[{ "node": "Schedule Posts", "type": "main", "index": 0 }]]
    },
    "Schedule Posts": {
      "main": [
        [{ "node": "Save Scheduled Posts", "type": "main", "index": 0 }],
        [{ "node": "Update Campaign Status", "type": "main", "index": 0 }]
      ]
    },
    "Save Scheduled Posts": {
      "main": []
    },
    "Update Campaign Status": {
      "main": [
        [{ "node": "Save Campaign", "type": "main", "index": 0 }],
        [{ "node": "Notify Campaign Started", "type": "main", "index": 0 }],
        [{ "node": "Respond", "type": "main", "index": 0 }]
      ]
    },
    "Save Campaign": {
      "main": []
    },
    "Notify Campaign Started": {
      "main": []
    }
  },
  "tags": ["social-pip", "campaign", "marketing"]
}
```

---

## 5. Referencia Rápida

| Workflow | Trigger | Descripción |
|----------|---------|-------------|
| Lead Capture | Schedule cada 3h | Captura leads de grupos |
| Outreach Sender | Webhook | Envía mensajes a nuevos miembros |
| Hashtag Strategist | Webhook | Genera estrategia de hashtags |
| Campaign Manager | Webhook | Gestiona campañas completas |

---

*Última actualización: Abril 2026*