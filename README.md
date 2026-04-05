# MERN To-Do App

A production-style full-stack to-do application built with the MERN stack.
It includes JWT authentication, protected routes, and user-scoped task management.

## Table of Contents

1. Overview
2. Core Features
3. Architecture
4. Tech Stack
5. Repository Structure
6. API Reference
7. Data Model
8. Local Development Setup
9. Environment Variables
10. Available Scripts
11. Security Notes
12. Deployment Notes
13. Troubleshooting

## Overview

This project is designed as a clean, modern starter for authenticated CRUD applications.
Users can register, sign in, and manage personal tasks.
Each task operation is scoped to the authenticated user on the server side.

The repository is split into two applications:

- client: React SPA (Vite + Tailwind CSS)
- server: Express API with MongoDB (Mongoose)

## Core Features

- User registration and login with hashed passwords (bcrypt)
- JWT-based stateless authentication
- Protected client routes
- Task CRUD operations:
- create task
- list user tasks
- toggle task completion
- delete task
- Dark mode toggle persisted to localStorage
- Clean Tailwind-based UI components

## Architecture

```text
Browser (React + Router + Axios)
        |
        |  Authorization: Bearer <JWT>
        v
Express API (auth routes + task routes)
        |
        v
MongoDB (Users, Tasks)
```

Request flow summary:

1. User logs in or registers via /api/auth.
2. Server returns a signed JWT.
3. Client stores token in localStorage.
4. Axios interceptor adds Bearer token automatically.
5. Protected API endpoints verify JWT and attach req.userId.
6. Task queries are filtered by req.userId, enforcing data isolation.

## Tech Stack

Client:

- React 18
- React Router 6
- Axios
- Vite
- Tailwind CSS

Server:

- Node.js + Express 4
- MongoDB + Mongoose
- JSON Web Token (jsonwebtoken)
- bcryptjs
- dotenv
- morgan
- cors

## Repository Structure

```text
.
|- client/
|  |- src/
|  |  |- api.js
|  |  |- App.jsx
|  |  |- components/
|  |  |- pages/
|  |- package.json
|
|- server/
|  |- src/
|  |  |- config.js
|  |  |- index.js
|  |  |- middleware/auth.js
|  |  |- models/
|  |  |- routes/
|  |- .env.example
|  |- package.json
|
|- .gitignore
|- README.md
```

## API Reference

Base URL:

- http://localhost:4000/api

Auth routes:

- POST /auth/register
- Body: { "email": "user@example.com", "password": "secret123" }
- Response: { "token": "...", "user": { "id": "...", "email": "..." } }

- POST /auth/login
- Body: { "email": "user@example.com", "password": "secret123" }
- Response: { "token": "...", "user": { "id": "...", "email": "..." } }

- GET /auth/me
- Header: Authorization: Bearer <token>
- Response: { "user": { "_id": "...", "email": "..." } }

Task routes (all protected):

- GET /tasks
- Response: [ { "_id": "...", "title": "...", "completed": false, ... } ]

- POST /tasks
- Body: { "title": "Buy groceries" }

- PATCH /tasks/:id
- Body (optional fields): { "title": "Updated", "completed": true }

- DELETE /tasks/:id
- Response: { "ok": true }

## Data Model

User:

- email: string (unique, lowercased)
- password: string (hashed)
- timestamps

Task:

- user: ObjectId (ref User)
- title: string
- completed: boolean
- timestamps

## Local Development Setup

Prerequisites:

- Node.js 18+
- npm 9+
- MongoDB Atlas cluster or local MongoDB instance

1. Install client dependencies:

```bash
cd client
npm install
```

2. Install server dependencies:

```bash
cd ../server
npm install
```

3. Create environment file:

```bash
copy .env.example .env
```

4. Update .env values (Mongo URI and JWT secret).

5. Start backend:

```bash
cd server
npm run dev
```

6. Start frontend (new terminal):

```bash
cd client
npm run dev
```

7. Open app:

- http://localhost:5173

## Environment Variables

Server variables in server/.env:

- PORT: API port (default 4000)
- MONGODB_URI: MongoDB connection string
- JWT_SECRET: strong random signing key for tokens

## Available Scripts

Client (client/package.json):

- npm run dev: start Vite dev server
- npm run build: production build
- npm run preview: preview production build

Server (server/package.json):

- npm run dev: start API with nodemon
- npm start: start API with node

## Security Notes

- Never commit .env files or secrets.
- Rotate credentials immediately if leaked.
- Use a long, random JWT secret in non-dev environments.
- Prefer short token lifetimes and refresh-token strategy for production-scale auth.
- Restrict CORS origin in server/src/index.js for deployment environments.

## Deployment Notes

- Client and server can be deployed independently.
- Set the API base URL in client/src/api.js to your deployed server URL.
- Ensure MongoDB network access and credentials are production-ready.
- Add reverse proxy and HTTPS in production.

## Troubleshooting

- Mongo connection error:
- verify MONGODB_URI and database network access

- 401 Unauthorized on protected routes:
- verify token exists in localStorage and Authorization header is sent

- CORS errors in browser:
- ensure deployed frontend origin is allowed in the server CORS configuration

- Port in use:
- change PORT in server/.env or stop conflicting process

---

Maintained as a practical full-stack reference implementation for MERN authentication and CRUD patterns.