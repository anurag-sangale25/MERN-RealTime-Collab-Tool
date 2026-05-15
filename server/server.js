import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import documentsRouter from "./routes/documents.js";
import Document from "./models/Document.js";

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    methods: ["GET", "POST"]
  }
});

const roomUsers = new Map();

app.use(cors({ origin: clientUrl }));
app.use(express.json());
app.use("/documents", documentsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Something went wrong" });
});

function getOrCreateRoom(documentId) {
  if (!roomUsers.has(documentId)) {
    roomUsers.set(documentId, new Map());
  }

  return roomUsers.get(documentId);
}

function emitUsers(documentId) {
  const users = Array.from(getOrCreateRoom(documentId).values());
  io.to(documentId).emit("users-updated", users);
}

async function getOrCreateDocument(documentId) {
  return Document.findOneAndUpdate(
    { documentId },
    {
      $setOnInsert: {
        documentId,
        content: "",
        updatedAt: new Date()
      }
    },
    {
      new: true,
      upsert: true
    }
  );
}

io.on("connection", (socket) => {
  socket.on("join-document", async ({ documentId, username }) => {
    if (!documentId) {
      return;
    }

    socket.join(documentId);
    socket.data.documentId = documentId;
    socket.data.username = username || `User ${socket.id.slice(0, 4)}`;

    const users = getOrCreateRoom(documentId);
    users.set(socket.id, {
      id: socket.id,
      name: socket.data.username
    });

    const document = await getOrCreateDocument(documentId);
    socket.emit("load-document", document.content);
    emitUsers(documentId);
  });

  socket.on("send-changes", ({ documentId, content }) => {
    if (!documentId) {
      return;
    }

    socket.to(documentId).emit("receive-changes", content);
  });

  socket.on("save-document", async ({ documentId, content }) => {
    if (!documentId) {
      return;
    }

    await Document.findOneAndUpdate(
      { documentId },
      {
        documentId,
        content,
        updatedAt: new Date()
      },
      {
        upsert: true
      }
    );
  });

  socket.on("disconnect", () => {
    const { documentId } = socket.data;

    if (!documentId || !roomUsers.has(documentId)) {
      return;
    }

    const users = roomUsers.get(documentId);
    users.delete(socket.id);

    if (users.size === 0) {
      roomUsers.delete(documentId);
      return;
    }

    emitUsers(documentId);
  });
});

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collaborative-editor")
  .then(() => {
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
