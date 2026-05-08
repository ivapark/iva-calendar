# Calendar Web App

This is a full-stack version of the original single-file calendar HTML app.

## What changed

- Frontend is now a React + Vite app.
- Backend is now an Express API.
- Calendar data is saved in SQLite instead of browser localStorage.
- Events, todos, journals, goals, and mindsets persist through the backend.

## Folder structure

```txt
calendar-webapp/
  backend/
    src/
      db.js
      server.js
    .env.example
    package.json
  frontend/
    src/
      api.js
      main.jsx
      styles.css
    .env.example
    index.html
    package.json
  package.json
  README.md
```

## Run locally

From the project root:

```bash
npm install
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run dev
```

Then open:

```txt
http://localhost:5173
```

The backend runs on:

```txt
http://localhost:4000
```

## Main API routes

```txt
GET    /api/state
POST   /api/events
PUT    /api/events/:id
DELETE /api/events/:id
POST   /api/todos
PATCH  /api/todos/:id
DELETE /api/todos/:id
PUT    /api/entries/:type/:key
```

`type` can be:

```txt
journals
mindsets
goals
```

## Notes

This is intentionally set up as a clean starter app, not a production authentication app yet. The next step would be adding login with Supabase/Auth.js, then scoping events and todos by user ID.
