import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

const API_BASE = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [prompt, setPrompt] = useState("");
  const [repo, setRepo] = useState("");

  const [result, setResult] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const currentUid = useRef(null);

  // ---------------- HISTORY ----------------
  const fetchHistory = useCallback(async (uid) => {
    try {
      const res = await axios.get(`${API_BASE}/history`, {
        params: { uid }
      });
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.log("History error:", err.message);
    }
  }, []);

  // ---------------- AUTH ----------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
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
      }
    });

    return () => unsub();
  }, [fetchHistory]);

  const login = () =>
    signInWithEmailAndPassword(auth, email, password).catch(e =>
      alert(e.message)
    );

  const signup = () =>
    createUserWithEmailAndPassword(auth, email, password).catch(e =>
      alert(e.message)
    );

  const logout = () => signOut(auth);

  // ---------------- GENERATE ----------------
  const generate = async () => {
    if (!user) return alert("Login first");
    if (!prompt.trim()) return alert("Enter prompt");

    try {
      setLoading(true);
      setError("");

      const res = await axios.post(`${API_BASE}/generate`, {
        prompt
      });

      setResult(res.data?.terraformCode || "");
      setOutput(res.data?.terraform_output || "");

      fetchHistory(user.uid);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAVE TO GITHUB (FIXED) ----------------
  const saveToGitHub = async () => {
    if (!result) return alert("No Terraform code");

    try {
      await axios.post(`${API_BASE}/push`, {
        terraformCode: result
      });

      alert("Saved to GitHub 🟢");
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert("GitHub push failed ❌");
    }
  };

  // ---------------- DEPLOY (TEMP = SAME PUSH FLOW) ----------------
  const deploy = async () => {
    if (!result) return alert("No Terraform code");

    try {
      await axios.post(`${API_BASE}/push`, {
        terraformCode: result
      });

      alert("Deploy triggered (via GitHub push) 🚀");
    } catch (err) {
      console.log(err.response?.data || err.message);
      alert("Deploy failed ❌");
    }
  };

  const copy = () => navigator.clipboard.writeText(result);

  // ---------------- LOGIN UI ----------------
  if (!user) {
    return (
      <div style={loginWrap}>
        <div style={loginCard}>
          <h2>AI DevOps Platform</h2>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />

          <button onClick={login} style={btnBlue}>Login</button>
          <button onClick={signup} style={btnDark}>Signup</button>
        </div>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div style={app}>

      {/* SIDEBAR */}
      <div style={sidebar}>
        <h3>History</h3>
        <button onClick={logout} style={btnRed}>Logout</button>

        {history.map((h, i) => (
          <div
            key={i}
            style={historyItem}
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

      {/* MAIN */}
      <div style={main}>

        <div style={header}>
          <h2>⚡ AI Terraform Generator</h2>
        </div>

        <div style={card}>
          <h3>Prompt</h3>

          <textarea
            rows={5}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            style={textarea}
          />

          <button onClick={generate} style={btnBlue}>
            {loading ? "Generating..." : "Generate"}
          </button>

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

        <div style={fullCard}>
          <h3>Terraform Code</h3>

          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            style={bigEditor}
          />

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={copy} style={btnDark}>Copy</button>

            <button onClick={saveToGitHub} style={btnYellow}>
              Save to GitHub
            </button>

            <button onClick={deploy} style={btnGreen}>
              Deploy
            </button>
          </div>
        </div>

        <div style={card}>
          <h3>Output</h3>
          <pre>{output}</pre>
        </div>

      </div>
    </div>
  );
}

export default App;

/* ---------------- STYLES ---------------- */

const app = { display: "flex", height: "100vh" };

const sidebar = {
  width: 260,
  background: "#0f172a",
  color: "#fff",
  padding: 10
};

const main = {
  flex: 1,
  background: "#f1f5f9",
  padding: 15
};

const header = {
  background: "#2563eb",
  color: "#fff",
  padding: 15,
  borderRadius: 10,
  marginBottom: 10
};

const card = {
  background: "#fff",
  padding: 15,
  borderRadius: 10,
  marginBottom: 10
};

const fullCard = {
  background: "#fff",
  padding: 15,
  borderRadius: 10,
  marginBottom: 10
};

const bigEditor = {
  width: "100%",
  height: "400px",
  fontFamily: "monospace",
  fontSize: "14px",
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ccc",
  marginBottom: 10
};

const textarea = {
  width: "100%",
  padding: 10,
  marginBottom: 10
};

const historyItem = {
  padding: 8,
  background: "#1e293b",
  marginBottom: 5,
  cursor: "pointer"
};

const input = {
  width: "100%",
  padding: 10,
  marginBottom: 10
};

const btnBlue = { background: "#2563eb", color: "#fff", padding: 10, border: "none", width: "100%" };
const btnDark = { background: "#334155", color: "#fff", padding: 10, border: "none" };
const btnGreen = { background: "#16a34a", color: "#fff", padding: 10, border: "none" };
const btnYellow = { background: "#facc15", color: "#000", padding: 10, border: "none" };
const btnRed = { background: "#dc2626", color: "#fff", padding: 10, border: "none", width: "100%" };

const loginWrap = {
  height: "100vh",
  display: "flex",
  justifyContent: "center",
  alignItems: "center"
};

const loginCard = {
  width: 300,
  padding: 20,
  background: "#111827",
  color: "#fff"
};