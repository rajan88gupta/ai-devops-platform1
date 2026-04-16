import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const API_BASE = "https://ai-devops-platform1.onrender.com";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [prompt, setPrompt] = useState("");
  const [cloud] = useState("aws"); // ✅ FIX: removed setter to avoid ESLint CI error
  const [result, setResult] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const authReady = useRef(false);
  const currentUid = useRef(null);
  const historyLock = useRef(false);

  // ---------------- HISTORY ----------------
  const fetchHistory = useCallback(async (uid) => {
    if (historyLock.current) return;
    historyLock.current = true;

    try {
      const res = await axios.get(`${API_BASE}/history`, {
        params: { uid },
        timeout: 10000
      });

      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("History error:", err.message);
    } finally {
      historyLock.current = false;
    }
  }, []);

  // ---------------- AUTH STATE ----------------
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (authReady.current && u) return;
      authReady.current = true;

      if (!u) {
        setUser(null);
        setHistory([]);
        currentUid.current = null;
        return;
      }

      if (currentUid.current === u.uid) return;

      currentUid.current = u.uid;
      setUser(u);

      fetchHistory(u.uid);
    });

    return () => unsubscribe();
  }, [fetchHistory]);

  // ---------------- AUTH ----------------
  const signup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      alert(err.message);
    }
  };

  const logout = async () => {
    await signOut(auth);

    setUser(null);
    setHistory([]);
    setPrompt("");
    setResult("");
    setOutput("");
    setError("");

    currentUid.current = null;
    authReady.current = false;
  };

  // ---------------- GENERATE ----------------
  const generate = async () => {
    if (!user) return alert("Login first");
    if (!prompt.trim()) return alert("Enter prompt");

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(
        `${API_BASE}/generate`,
        {
          prompt,
          cloud,
          uid: user.uid
        },
        { timeout: 20000 }
      );

      if (res.data?.error) {
        setError(res.data.error);
        return;
      }

      setResult(res.data?.terraform_code || "");
      setOutput(res.data?.terraform_output || "");

      fetchHistory(user.uid);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  // ---------------- LOGIN SCREEN ----------------
  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>AI DevOps SaaS Login</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div>
          <button onClick={login}>Login</button>
          <button onClick={signup}>Signup</button>
        </div>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: 260, background: "#111", color: "#fff", padding: 10 }}>
        <h3>History</h3>
        <button onClick={logout}>Logout</button>

        {history.map((h, i) => (
          <div
            key={i}
            style={{ cursor: "pointer", margin: "10px 0" }}
            onClick={() => {
              setPrompt(h.prompt);
              setResult(h.terraform_code);
              setOutput(h.terraform_output);
            }}
          >
            {h.prompt}
          </div>
        ))}
      </div>

      <div style={{ padding: 20, flex: 1 }}>
        <h2>AI DevOps SaaS</h2>

        <textarea
          rows={6}
          style={{ width: "100%" }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />

        <button onClick={generate}>
          {loading ? "Generating..." : "Generate"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <h3>Terraform Code</h3>
        <pre>{result}</pre>

        <h3>Output</h3>
        <pre>{output}</pre>

        {result && (
          <button onClick={copyToClipboard}>Copy Code</button>
        )}
      </div>
    </div>
  );
}

export default App;