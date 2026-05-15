import React, { useMemo, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import DocumentEditor from "./components/DocumentEditor.jsx";

const serverUrl = import.meta.env.VITE_SERVER_URL || "http://localhost:5000";

function Home() {
  const navigate = useNavigate();
  const [documentId, setDocumentId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");

  const trimmedDocumentId = useMemo(() => documentId.trim(), [documentId]);

  async function createDocument() {
    setIsCreating(true);
    setError("");

    try {
      const response = await fetch(`${serverUrl}/documents`, {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Unable to create document");
      }

      const document = await response.json();
      navigate(`/document/${document.documentId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  }

  function openDocument(event) {
    event.preventDefault();

    if (trimmedDocumentId) {
      navigate(`/document/${trimmedDocumentId}`);
    }
  }

  return (
    <main className="home-shell">
      <section className="home-panel">
        <div className="brand-mark">RT</div>

        <p className="eyebrow">Live shared writing</p>
        <h1>Collaborative Document Editor</h1>
        <p className="lede">
          Create a document, share the link, and edit together in real time.
        </p>

        <div className="home-actions">
          <button className="primary-button" onClick={createDocument} disabled={isCreating}>
            {isCreating ? "Creating..." : "Create new document"}
          </button>

          <form onSubmit={openDocument} className="join-form">
            <input
              value={documentId}
              onChange={(event) => setDocumentId(event.target.value)}
              placeholder="Enter document ID"
              aria-label="Document ID"
            />
            <button type="submit" disabled={!trimmedDocumentId}>
              Open
            </button>
          </form>
        </div>

        {error && <p className="error-text">{error}</p>}
      </section>
    </main>
  );
}

function NotFound() {
  return (
    <main className="home-shell">
      <section className="home-panel">
        <div className="brand-mark">404</div>
        <h1>Document not found</h1>
        <p className="lede">The document link may be incorrect or unavailable.</p>
        <Link to="/" className="home-link">
          Go home
        </Link>
      </section>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/document/:id" element={<DocumentEditor />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
