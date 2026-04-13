# Workflows de Analíticas

## Resumen

Workflows para recolección de métricas, reportes y análisis de performance.

---

## 1. Workflow: Metrics Collector

### 1.1 Descripción

Recolecta métricas de posts publicados cada 4 horas, incluyendo engagement, reach, y resultados de publicación.

### 1.2 Diagrama del Flujo

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                      WORKFLOW: METRICS COLLECTOR - SOCIAL-PIP                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

     ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
     │  SCHEDULE  │      │   LOAD    │      │   LOOP    │      │   FETCH   │
     │  TRIGGER   │─────▶│   POSTS   │─────▶│   POSTS   │─────▶│   METRICS  │
     │            │      │           │      │           │      │            │
     │ Cron:      │      │ Recent    │      │ For each  │      │ Call API   │
     │ 0 */4 * * *│      │  posts    │      │   post    │      │ platform   │
     │            │      │  (4h)     │      │           │      │            │
     └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
                                    │                │                    │
                                    │                │                    │
                                    ▼                ▼                    ▼
                         ┌─────────────────┐  ┌─────────────┐      ┌─────────────┐
                         │   POSTS TO     │  │   ERROR    │      │   PARSE    │
                         │   PROCESS     │  │   IF NO    │      │   RESPONSE │
                         │               │  │   POSTS    │      │            │
                         │ Filter only    │  │            │      │ • Likes    │
                         │ pending       │  │            │      │ • Comments │
                         │ metrics       │  │            │      │ • Shares   │
                         └─────────────────┘  └─────────────┘      │ • Reach   │
                                                                   │ • Saves   │
                                                                   └─────────────┘
                                                                         │
                                                                         ▼
                                                              ┌─────────────────┐
                                                              │   STORE        │
                                                              │   METRICS     │
                                                              │                │
                                                              │ SQLite DB     │
                                                              │ Update post  │
                                                              │ record        │
                                                              └─────────────────┘
                                                                         │
                                                                         ▼
                                                              ┌─────────────────┐
                                                              │   AGGREGATE   │
                                                              │   DAILY STATS │
                                                              │                │
                                                              │ • Total posts │
                                                              │ • Avg engagement│
                                                              │ • Top content │
                                                              │ • Trend chart │
                                                              └─────────────────┘
```

### 1.3 Estructura del Workflow

```json
{
  "name": "SP - Metrics Collector",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{ "field": "cronExpression", "cronExpression": "0 */4 * * *" }]
        }
      }
    },
    {
      "id": "load_posts",
      "name": "Load Recent Posts",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/posts/recent.json"
      }
    },
    {
      "id": "loop",
      "name": "Loop Posts",
      "type": "n8n-nodes-base.splitInBatches",
      "position": [650, 300],
      "parameters": {}
    },
    {
      "id": "fetch",
      "name": "Fetch Metrics",
      "type": "n8n-nodes-base.httpRequest",
      "position": [850, 300],
      "parameters": {
        "method": "GET",
        "url": "={{$env.CHROME_EXT_URL + '/metrics?postId=' + $json.postId}}"
      }
    },
    {
      "id": "save",
      "name": "Save Metrics",
      "type": "n8n-nodes-base.writeFile",
      "position": [1050, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/metrics/{{$json.postId}}_{{$now}}.json",
        "output": "json"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": { "main": [[{ "node": "Load Recent Posts", "type": "main", "index": 0 }]] },
    "Load Recent Posts": { "main": [[{ "node": "Loop Posts", "type": "main", "index": 0 }]] },
    "Loop Posts": { "main": [[{ "node": "Fetch Metrics", "type": "main", "index": 0 }]] },
    "Fetch Metrics": { "main": [[{ "node": "Save Metrics", "type": "main", "index": 0 }]] },
    "Save Metrics": { "main": [[{ "node": "Loop Posts", "type": "main", "index": 0 }]] }
  },
  "tags": ["social-pip", "analytics", "metrics"]
}
```

## 2. Performance Report

```json
{
  "name": "SP - Performance Report",
  "nodes": [
    {
      "id": "trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{ "field": "cronExpression", "cronExpression": "0 8 * * 0" }]
        }
      }
    },
    {
      "id": "collect",
      "name": "Collect Week Data",
      "type": "n8n-nodes-base.readFile",
      "position": [450, 300],
      "parameters": {
        "fileName": "={{$env.DATA_PATH}}/metrics/week.json"
      }
    },
    {
      "id": "analyze",
      "name": "Analyze with OpenCode",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "method": "POST",
        "url": "http://localhost:4096/session/n8n-report/message",
        "bodyParameters": {
          "parameters": [
            {
              "name": "parts",
              "value": [{ "type": "text", "content": "={{'Genera reporte semanal de performance con estos datos: ' + JSON.stringify($json)}}" }]
            }
          ]
        }
      }
    },
    {
      "id": "send",
      "name": "Send Report",
      "type": "n8n-nodes-base.telegram",
      "position": [850, 300],
      "parameters": {
        "operation": "sendMessage",
        "chatId": "={{$json.chatId}}",
        "text": "={{$json.parts[0].content}}"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": { "main": [[{ "node": "Collect Week Data", "type": "main", "index": 0 }]] },
    "Collect Week Data": { "main": [[{ "node": "Analyze with OpenCode", "type": "main", "index": 0 }]] },
    "Analyze with OpenCode": { "main": [[{ "node": "Send Report", "type": "main", "index": 0 }]] }
  },
  "tags": ["social-pip", "analytics", "report"]
}
```

---

*Última actualización: Abril 2026*