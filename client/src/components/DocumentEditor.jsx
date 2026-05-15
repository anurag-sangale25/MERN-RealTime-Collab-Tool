import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { io } from "socket.io-client";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";
const autoSaveDelay = 3000;

export default function DocumentEditor() {
  const { id: documentId } = useParams();
  const socketRef = useRef(null);
  const hasLoadedRef = useRef(false);
  const [content, setContent] = useState("");
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState("Connecting");
  const [isLoading, setIsLoading] = useState(true);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copy link");

  const username = useMemo(() => {
    const savedName = window.localStorage.getItem("editor-username");

    if (savedName) {
      return savedName;
    }

    const generatedName = `User ${Math.floor(1000 + Math.random() * 9000)}`;
    window.localStorage.setItem("editor-username", generatedName);
    return generatedName;
  }, []);

  useEffect(() => {
    const socket = io(serverUrl);
    socketRef.current = socket;

    socket.on("connect", () => {
      setStatus("Connected");
      socket.emit("join-document", { documentId, username });
    });

    socket.on("disconnect", () => {
      setStatus("Disconnected");
    });

    socket.on("load-document", (serverContent) => {
      setContent(serverContent || "");
      hasLoadedRef.current = true;
      setIsLoading(false);
    });

    socket.on("receive-changes", (incomingContent) => {
      setContent(incomingContent);
    });

    socket.on("users-updated", (connectedUsers) => {
      setUsers(connectedUsers);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [documentId, username]);

  useEffect(() => {
    if (!hasLoadedRef.current) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      socketRef.current?.emit("save-document", { documentId, content });
      setLastSavedAt(new Date());
    }, autoSaveDelay);

    return () => window.clearTimeout(timeoutId);
  }, [content, documentId]);

  function handleChange(event) {
    const nextContent = event.target.value;
    setContent(nextContent);
    socketRef.current?.emit("send-changes", {
      documentId,
      content: nextContent
    });
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy link"), 1400);
  }

  return (
    <main className="editor-shell">
      <header className="topbar">
        <div className="document-meta">
          <Link to="/" className="back-link">
            Home
          </Link>
          <h1>Document</h1>
          <p>{documentId}</p>
        </div>

        <div className="topbar-actions">
          <span className={`connection ${status.toLowerCase()}`}>{status}</span>
          <button onClick={copyShareLink}>{copyLabel}</button>
        </div>
      </header>

      <section className="workspace">
        <aside className="presence-panel" aria-label="Connected users">
          <div className="panel-heading">
            <h2>Connected users</h2>
            <span>{users.length}</span>
          </div>

          <ul>
            {users.map((user) => (
              <li key={user.id}>
                <span className="presence-dot" />
                {user.name}
              </li>
            ))}
          </ul>

          <div className="save-status">
            {lastSavedAt ? `Saved ${lastSavedAt.toLocaleTimeString()}` : "Waiting for changes"}
          </div>
        </aside>

        <section className="editor-panel">
          {isLoading ? (
            <div className="loading-state">Loading document...</div>
          ) : (
            <textarea
              value={content}
              onChange={handleChange}
              placeholder="Start typing..."
              spellCheck="true"
              aria-label="Collaborative document editor"
            />
          )}
        </section>
      </section>
    </main>
  );
}
