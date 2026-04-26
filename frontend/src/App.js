import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";

import { auth } from "./firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "firebase/auth";

/* ⚠️ CHANGE THIS AFTER DEPLOYING BACKEND */
const API_BASE = "http://localhost:5000";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [prompt, setPrompt] = useState("");
  const [repo, setRepo] = useState("");
  const [githubToken, setGithubToken] = useState("");

  const [result, setResult] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const uidRef = useRef(null);

  // ---------------- AUTH ----------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);

      if (u) {
        uidRef.current = u.uid;
      } else {
        uidRef.current = null;
        setHistory([]);
        setPrompt("");
        setResult("");
        setOutput("");
      }
    });

    return () => unsub();
  }, []);

  // ---------------- LOGIN ----------------
  const login = () =>
    signInWithEmailAndPassword(auth, email, password)
      .catch(e => alert(e.message));

  const signup = () =>
    createUserWithEmailAndPassword(auth, email, password)
      .catch(e => alert(e.message));

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

      setResult(res.data?.terraform_code || "");
    } catch (err) {
      console.log(err);
      setError("Generation failed");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- SAVE TO GITHUB ----------------
  const saveToGitHub = async () => {
    if (!result) return alert("No Terraform code");

    try {
      await axios.post(`${API_BASE}/save`, {
        code: result
      });

      alert("Saved to GitHub ✅");
    } catch (err) {
      console.log(err);
      alert("GitHub save failed ❌");
    }
  };

  const copy = () => navigator.clipboard.writeText(result);

  // ---------------- LOGIN UI ----------------
  if (!user) {
    return (
      <div style={{ padding: 50 }}>
        <h2>AI DevOps Platform</h2>

        <input
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>
        <button onClick={signup}>Signup</button>
      </div>
    );
  }

  // ---------------- MAIN UI ----------------
  return (
    <div style={{ display: "flex", height: "100vh" }}>

      <div style={{ width: 200, background: "#111", color: "#fff", padding: 10 }}>
        <h3>Menu</h3>
        <button onClick={logout}>Logout</button>
      </div>

      <div style={{ flex: 1, padding: 20 }}>

        <h2>AI Terraform Generator</h2>

        <textarea
          rows={5}
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Write: create VPC with 2 subnets"
        />

        <button onClick={generate}>
          {loading ? "Generating..." : "Generate"}
        </button>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <h3>Terraform Code</h3>

        <textarea
          rows={15}
          value={result}
          onChange={e => setResult(e.target.value)}
        />

        <button onClick={copy}>Copy</button>

        <button onClick={saveToGitHub}>
          Save to GitHub
        </button>

      </div>
    </div>
  );
}

export default App;