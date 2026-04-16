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
  const [cloud] = useState("aws");
  const [result, setResult] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setUser(u || null);

      if (u) {
        currentUid.current = u.uid;
        fetchHistory(u.uid);
      } else {
        currentUid.current = null;
        setHistory([]);
        setPrompt("");
        setResult("");
        setOutput("");
        setError("");
      }
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
  };

  // ---------------- GENERATE ----------------
  const generate = async () => {
    if (!user) return alert("Login first");
    if (!prompt.trim()) return alert("Enter prompt");

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${API_BASE}/generate`, {
        prompt,
        cloud,
        uid: user.uid
      });

      if (res.data?.error) {
        setError(res.data.error);
        return;
      }

      setResult(res.data?.terraform_code || "");
      setOutput(res.data?.terraform_output || "");

      fetchHistory(user.uid);
    } catch (err) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  // ---------------- LOGIN UI ----------------
  if (!user) {
    return (
      <div style={loginWrapper}>
        <div style={loginCard}>
          <h2>🚀 AI DevOps Platform</h2>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <button onClick={login} style={btnPrimary}>Login</button>
          <button onClick={signup} style={btnSecondary}>Create Account</button>
        </div>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div style={appContainer}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <h3>📁 History</h3>

        <button onClick={logout} style={btnDanger}>Logout</button>

        <div style={{ marginTop: 20 }}>
          {history.map((h, i) => (
            <div
              key={i}
              onClick={() => {
                setPrompt(h.prompt);
                setResult(h.terraform_code);
                setOutput(h.terraform_output);
              }}
              style={historyItem}
            >
              {h.prompt}
            </div>
          ))}
        </div>
      </div>

      {/* MAIN */}
      <div style={main}>

        {/* HEADER */}
        <div style={header}>
          <h2>⚡ AI DevOps Generator</h2>
          <p>Generate Terraform / AWS / Kubernetes instantly</p>
        </div>

        {/* PROMPT */}
        <div style={card}>
          <h3>💬 Prompt</h3>

          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={textarea}
          />

          <button onClick={generate} style={btnPrimary}>
            {loading ? "Generating..." : "Generate"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

        {/* OUTPUT */}
        <div style={card}>
          <h3>📦 Terraform Code</h3>
          <pre style={codeBox}>{result}</pre>

          {result && (
            <button onClick={copyToClipboard} style={btnSecondary}>
              Copy Code
            </button>
          )}
        </div>

        <div style={card}>
          <h3>🖥️ Output</h3>
          <pre style={codeBox}>{output}</pre>
        </div>

      </div>
    </div>
  );
}

export default App;

/* ---------------- STYLES ---------------- */

const loginWrapper = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg,#0f172a,#1e293b)"
};

const loginCard = {
  width: 380,
  padding: 30,
  borderRadius: 12,
  background: "#111827",
  color: "#fff",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
};

const appContainer = {
  display: "flex",
  height: "100vh",
  fontFamily: "Arial"
};

const sidebar = {
  width: 280,
  background: "#0f172a",
  color: "#fff",
  padding: 15
};

const main = {
  flex: 1,
  background: "#f1f5f9",
  padding: 20
};

const header = {
  padding: 20,
  background: "linear-gradient(90deg,#2563eb,#7c3aed)",
  color: "#fff",
  borderRadius: 12,
  marginBottom: 20
};

const card = {
  background: "#fff",
  padding: 15,
  borderRadius: 12,
  marginBottom: 15,
  boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
};

const textarea = {
  width: "100%",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 10
};

const codeBox = {
  background: "#0f172a",
  color: "#00ffcc",
  padding: 10,
  borderRadius: 8,
  overflowX: "auto"
};

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 6,
  border: "1px solid #ccc"
};

const btnPrimary = {
  width: "100%",
  padding: 10,
  background: "#2563eb",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginTop: 10
};

const btnSecondary = {
  width: "100%",
  padding: 10,
  background: "#334155",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  marginTop: 10
};

const btnDanger = {
  width: "100%",
  padding: 8,
  background: "#dc2626",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer"
};

const historyItem = {
  padding: 10,
  marginBottom: 10,
  background: "#1e293b",
  borderRadius: 8,
  cursor: "pointer"
};