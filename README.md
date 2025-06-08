# n8n-nodes-bullscheduler

![BullScheduler Logo](https://raw.githubusercontent.com/BrOrlandi/n8n-nodes-bullscheduler/main/nodes/BullScheduler/logo.svg)

An n8n community node for scheduling jobs using [BullScheduler](https://github.com/BrOrlandi/BullScheduler). Schedule jobs to execute at specific times or after delays, with automatic webhook delivery to any endpoint.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n, go to **Settings > Community Nodes** and enter:

```
n8n-nodes-bullscheduler
```

## Prerequisites

You need a running BullScheduler service to use this node. BullScheduler is a lightweight job scheduling service built with Node.js, Express, and BullMQ.

### Quick BullScheduler Setup with Docker

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  bull-scheduler:
    image: brorlandi/bullscheduler:latest
    ports:
      - '3000:3000'
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - JOBS_WEBHOOK_URL=https://your-app.com/webhook
      - SECRET_TOKEN=your-secure-secret-token
      - BULL_BOARD_USERNAME=admin
      - BULL_BOARD_PASSWORD=your-dashboard-password
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

Start the services:
```bash
docker-compose up -d
```

For more setup options, visit the [BullScheduler repository](https://github.com/BrOrlandi/BullScheduler).

## Credentials

This node requires BullScheduler API credentials:

1. **Server URL**: The URL of your BullScheduler service (e.g., `https://your-bullscheduler-server.com`)
2. **API Key**: Bearer token for authentication (the `SECRET_TOKEN` from your BullScheduler configuration)

## Operations

### Schedule Job

Schedule a job to execute at a specific time or after a delay. When the job executes, BullScheduler will POST the job data to the configured webhook URL.

#### Node Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **Name** | String | No | Job identifier. If empty, a random name will be generated |
| **Execute At** | DateTime | Conditional* | Schedule job to execute at a specific date and time |
| **Data** | JSON | Yes | Job payload that will be sent to the webhook when executed |

#### Advanced Options

| Parameter | Type | Description |
|-----------|------|-------------|
| **Delay in Ms** | Number | Execute job after delay in milliseconds (alternative to Execute At) |
| **Webhook URL** | String | Override the default webhook URL for this specific job |

*Either "Execute At" or "Delay in Ms" must be provided.

#### Example Data Payload

```json
{
  "userId": 123,
  "action": "send-reminder",
  "message": "Don't forget your appointment!",
  "metadata": {
    "priority": "high",
    "category": "notification"
  }
}
```

## Usage Examples

### Schedule a Reminder Job

1. Set **Execute At** to a future date/time
2. Set **Data** to:
   ```json
   {
     "userId": 456,
     "type": "reminder",
     "message": "Meeting in 15 minutes!"
   }
   ```

### Schedule with Delay

1. Leave **Execute At** empty
2. In **Advanced Options**, set **Delay in Ms** to `300000` (5 minutes)
3. Set **Data** with your job payload

### Custom Webhook per Job

1. In **Advanced Options**, set **Webhook URL** to override the default webhook
2. This allows different jobs to notify different endpoints

## Output

The node returns information about the scheduled job:

```json
{
  "jobName": "reminder-job-abc123",
  "scheduled": true,
  "response": {
    "message": "Job scheduled with success"
  },
  "scheduledAt": "2024-01-15T10:30:00.000Z",
  "executeAt": "2024-01-15T15:30:00.000Z",
  "delayMs": null,
  "data": {
    "userId": 123,
    "action": "send-reminder"
  },
  "webhookUrl": "https://custom.webhook.com/endpoint"
}
```

## Webhook Delivery

When scheduled jobs execute, BullScheduler will POST the job data to the configured webhook URL:

```http
POST /webhook HTTP/1.1
Content-Type: application/json

{
  "userId": 123,
  "action": "send-reminder",
  "message": "Don't forget your appointment!"
}
```

## Monitoring

BullScheduler provides a Bull Board dashboard for monitoring jobs:
- Access at: `http://your-bullscheduler-server/admin`
- View job status, completed/failed jobs, and manage queues
- Optional basic authentication (set `BULL_BOARD_USERNAME` and `BULL_BOARD_PASSWORD`)

## Common Use Cases

- **Delayed Notifications**: Send reminders, alerts, or notifications after a delay
- **Scheduled Tasks**: Execute tasks at specific future times
- **Webhook Delays**: Add delays between webhook calls in your workflows
- **Time-based Triggers**: Create time-based automation triggers
- **Batch Processing**: Schedule batch jobs to run during off-peak hours

## Troubleshooting

### Connection Issues
- Verify your BullScheduler service is running and accessible
- Check the Server URL in your credentials
- Ensure the API Key matches your BullScheduler `SECRET_TOKEN`

### Job Not Executing
- Check the BullScheduler dashboard at `/admin`
- Verify Redis is running and connected
- Check BullScheduler logs for errors
- Ensure webhook URL is accessible from BullScheduler

### Authentication Errors
```json
{
  "error": "Unauthorized",
  "scheduled": false
}
```
- Verify API Key is correct
- Check BullScheduler `SECRET_TOKEN` environment variable

## Resources

- [BullScheduler Documentation](https://github.com/BrOrlandi/BullScheduler)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)
- [BullMQ Documentation](https://docs.bullmq.io/)

## License

[MIT](https://github.com/BrOrlandi/n8n-nodes-bullscheduler/blob/main/LICENSE.md)

## Support

For issues with this n8n node, please create an issue on the [GitHub repository](https://github.com/BrOrlandi/n8n-nodes-bullscheduler/issues).

For BullScheduler service issues, please visit the [BullScheduler repository](https://github.com/BrOrlandi/BullScheduler/issues).
