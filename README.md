# Task Manager API (In-Memory)

## Overview

A simple Node.js + Express REST API for managing tasks in memory. Data initializes from `task.json` and is managed at runtime without persistent database writes. Includes: create, read, update, delete operations with validation, filtering, sorting, and priority support.

### Task schema

```json
{
  "id": 2,
  "title": "Create a new project",
  "description": "Create a new project using Magic",
  "completed": false,
  "priority": "medium",
  "createdAt": "2026-03-20T00:00:00.000Z"
}
```

## Setup

1. Clone repository / open folder
2. Install dependencies:

```bash
npm install
```

3. Run server:

```bash
node app.js
```

4. Run tests:

```bash
npm test
```

## API Endpoints

### GET /tasks

Returns all tasks.

Query params:
- `completed=true|false` (optional)
- `priority=low|medium|high` (optional)

Sorted by creation date ascending.

Example:

```bash
curl "http://localhost:3000/tasks?completed=false&priority=high"
```

### GET /tasks/:id

Get task by ID.

```bash
curl "http://localhost:3000/tasks/1"
```

### GET /tasks/priority/:level

Get tasks by priority level.

```bash
curl "http://localhost:3000/tasks/priority/medium"
```

### POST /tasks

Create a task. Required JSON body:
- `title` (non-empty string)
- `description` (non-empty string)
- `completed` (boolean)
- `priority` (`low`, `medium`, `high`)

```bash
curl -X POST http://localhost:3000/tasks \
 -H "Content-Type: application/json" \
 -d '{"title":"New Task","description":"Do this","completed":false,"priority":"high"}'
```

### PUT /tasks/:id

Update a task by ID. Fields optional but validated when present.

```bash
curl -X PUT http://localhost:3000/tasks/1 \
 -H "Content-Type: application/json" \
 -d '{"title":"Updated","completed":true,"priority":"medium"}'
```

### DELETE /tasks/:id

Delete by ID:

```bash
curl -X DELETE http://localhost:3000/tasks/1
```

## Error handling

- `400 Bad Request` for invalid input (missing fields / wrong type / invalid query values)
- `404 Not Found` for missing task IDs

## Notes

- In-memory task storage persists only while server runs.
- `task.json` is used for bootstrapping initial data only.
- When the server restarts, in-memory updates are reset to `task.json` state.
