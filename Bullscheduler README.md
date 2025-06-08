![BullScheduler Logo](logo.png)

# BullScheduler

A lightweight job scheduling service built with Node.js, Express, and BullMQ. Schedule jobs to execute at specific times or after delays, with automatic webhook delivery when jobs complete.

## Features

- **Flexible Scheduling**: Schedule jobs with specific execution time (`executeAt`) or delay (`delayMs`)
- **Webhook Delivery**: Automatically POST job data to configured webhook URLs when jobs execute
- **Per-Job Webhooks**: Override global webhook URL on a per-job basis
- **Authentication**: Secure API access with Bearer token authentication
- **Job Monitoring**: Bull Board dashboard at `/admin` with optional basic authentication
- **Redis-Powered**: Built on Redis and BullMQ for reliable job queuing and processing
- **Docker Ready**: Easy deployment with Docker Compose

## API Usage

### Authentication

All requests to `/job` require a Bearer token:

```bash
Authorization: Bearer your-secret-token
```

### Schedule a Job

**POST** `/job`

```json
{
  "name": "my-job",
  "executeAt": "2024-12-25T12:00:00Z", // OR use "delayMs": 5000
  "data": {
    "userId": 123,
    "action": "send-reminder"
  },
  "webhookUrl": "https://your-app.com/webhook" // Optional: overrides global webhook
}
```

**Parameters:**

- `name` (string): Job identifier
- `executeAt` (ISO string): Execute at specific time **OR**
- `delayMs` (number): Execute after delay in milliseconds
- `data` (object): **Required** - Job payload to send to webhook
- `webhookUrl` (string): Optional webhook URL (overrides global `JOBS_WEBHOOK_URL`)

**Response:**

```json
{
  "message": "Job scheduled with success"
}
```

### Monitor Jobs

Access the Bull Board dashboard at `http://localhost:3000/admin` to monitor job status, view completed/failed jobs, and manage queues.

## Deployment with Docker Compose

Create a `docker-compose.yml` file in your project:

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

Access the service:

- **API**: `http://localhost:3000`
- **Dashboard**: `http://localhost:3000/admin`

## Environment Variables

| Variable              | Description                              | Default     | Required |
| --------------------- | ---------------------------------------- | ----------- | -------- |
| `REDIS_HOST`          | Redis server hostname                    | `localhost` | No       |
| `REDIS_PORT`          | Redis server port                        | `6379`      | No       |
| `JOBS_WEBHOOK_URL`    | Default webhook URL for job execution    | -           | Yes\*    |
| `SECRET_TOKEN`        | Bearer token for API authentication      | `secret`    | Yes      |
| `PORT`                | API server port                          | `3000`      | No       |
| `BULL_BOARD_USERNAME` | Dashboard username                       | `admin`     | No       |
| `BULL_BOARD_PASSWORD` | Dashboard password (enables auth if set) | -           | No       |

\*Required unless you provide `webhookUrl` in each job request.

## Example Usage

```bash
# Schedule a job to execute in 30 seconds
curl -X POST http://localhost:3000/job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token" \
  -d '{
    "name": "reminder-job",
    "delayMs": 30000,
    "data": {
      "userId": 123,
      "message": "Don't forget your appointment!"
    }
  }'

# Schedule a job for a specific time
curl -X POST http://localhost:3000/job \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-token" \
  -d '{
    "name": "birthday-reminder",
    "executeAt": "2024-12-25T09:00:00Z",
    "data": {
      "userId": 456,
      "type": "birthday",
      "message": "Happy Birthday!"
    },
    "webhookUrl": "https://notifications.example.com/webhook"
  }'
```

When jobs execute, the `data` object will be POSTed to the configured webhook URL.
