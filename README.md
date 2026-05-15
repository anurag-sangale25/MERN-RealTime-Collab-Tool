# Real-Time Collaborative Document Editor

A full-stack MERN collaborative editor where multiple users can open the same document URL and edit together live using Socket.IO rooms.

## Features

- Room-based collaboration with unique document IDs
- Real-time text syncing through Socket.IO
- MongoDB persistence with Mongoose
- Debounced auto-save every 3 seconds
- Connected user count and user presence list
- Document creation API and shareable document links
- Responsive React UI with loading and connection states

## Project Structure

```text
.
├── client
│   ├── src
│   │   ├── components
│   │   │   └── DocumentEditor.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   └── package.json
└── server
    ├── models
    │   └── Document.js
    ├── routes
    │   └── documents.js
    ├── .env.example
    ├── package.json
    └── server.js
```

## Setup

1. Install dependencies from the project root:

```bash
npm install
```

2. Create `server/.env` from the example:

```bash
cp server/.env.example server/.env
```

3. Update `server/.env` with your MongoDB connection string:

```env
MONGO_URI=mongodb://127.0.0.1:27017/collaborative-editor
PORT=5000
CLIENT_URL=http://localhost:5173
```

4. Start the client and server together:

```bash
npm start
```

5. Open the app:

[http://localhost:5173](http://localhost:5173)

## API Routes

- `GET /documents/:id` fetches or creates a document by ID
- `POST /documents` creates a new document and returns its generated ID

## Socket Events

- `join-document` joins a document room and loads existing content
- `send-changes` sends editor changes to collaborators
- `receive-changes` receives collaborator updates
- `save-document` persists document content to MongoDB
- `users-updated` broadcasts room presence
