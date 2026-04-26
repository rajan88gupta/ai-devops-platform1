import { fetch, Headers, FormData } from "undici";

globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.FormData = FormData;

// ---------------- IMPORTS ----------------
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

dotenv.config();

const app = express();

app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://ai-devops-platform1.vercel.app"
  ],
  methods: ["GET", "POST", "OPTIONS"]
}));

app.use(express.json());

// ---------------- OPENAI ----------------
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------- HEALTH ----------------
app.get("/", (req, res) => {
  res.send("AI DevOps Backend Running 🚀");
});

// ---------------- GENERATE ----------------
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Return ONLY Terraform code. No explanation. No markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    });

    res.json({
      terraform_code: response.choices?.[0]?.message?.content || ""
    });

  } catch (err) {
    console.error("OPENAI ERROR:", err.message);
    res.status(500).json({
      error: "AI generation failed",
      details: err.message
    });
  }
});

// ---------------- GITHUB SAVE ----------------
app.post("/save", async (req, res) => {
  const { code, repo, githubToken } = req.body;

  if (!code || !repo || !githubToken) {
    return res.status(400).json({ error: "Missing code, repo or token" });
  }

  try {
    const octokit = new Octokit({
      auth: githubToken
    });

    const cleanRepo = repo.trim();
    const [owner, repoName] = cleanRepo.split("/");

    if (!owner || !repoName) {
      return res.status(400).json({ error: "Repo must be owner/repo format" });
    }

    const path = "terraform/main.tf";
    const branch = "main";

    let sha;

    // check existing file
    try {
      const existing = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        { owner, repo: repoName, path, ref: branch }
      );

      if (!Array.isArray(existing.data)) {
        sha = existing.data.sha;
      }
    } catch (e) {
      sha = undefined;
    }

    const result = await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo: repoName,
        path,
        message: "AI Terraform update",
        content: Buffer.from(code).toString("base64"),
        branch,
        ...(sha ? { sha } : {})
      }
    );

    res.json({
      success: true,
      url: result.data.content?.html_url
    });

  } catch (err) {
    console.error("GITHUB ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: "GitHub save failed",
      details: err.message
    });
  }
});

// ---------------- DEPLOY ----------------
app.post("/deploy", async (req, res) => {
  const { code, repo, githubToken } = req.body;

  if (!code || !repo || !githubToken) {
    return res.status(400).json({ error: "Missing data" });
  }

  try {
    const octokit = new Octokit({ auth: githubToken });

    const [owner, repoName] = repo.trim().split("/");
    const path = "terraform/main.tf";
    const branch = "main";

    let sha;

    try {
      const existing = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        { owner, repo: repoName, path, ref: branch }
      );

      if (!Array.isArray(existing.data)) {
        sha = existing.data.sha;
      }
    } catch (e) {
      sha = undefined;
    }

    await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo: repoName,
        path,
        message: "Deploy Terraform",
        content: Buffer.from(code).toString("base64"),
        branch,
        ...(sha ? { sha } : {})
      }
    );

    await octokit.request(
      "POST /repos/{owner}/{repo}/actions/workflows/terraform.yml/dispatches",
      {
        owner,
        repo: repoName,
        ref: branch
      }
    );

    res.json({
      success: true,
      message: "Deployment triggered 🚀"
    });

  } catch (err) {
    console.error("DEPLOY ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: "Deploy failed",
      details: err.message
    });
  }
});

// ---------------- START ----------------
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});