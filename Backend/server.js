import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";

dotenv.config();

// ---------------- FIX FOR OPENAI ----------------
globalThis.fetch = fetch;

// ---------------- APP ----------------
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

// ---------------- GITHUB ----------------
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// ---------------- HEALTH ----------------
app.get("/", (req, res) => {
  res.send("AI DevOps Backend Running 🚀");
});

// ---------------- GENERATE TERRAFORM ----------------
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

    const output = response.choices?.[0]?.message?.content;

    if (!output) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    res.json({
      terraform_code: output
    });

  } catch (err) {
    console.error("OPENAI ERROR:", err.message);
    res.status(500).json({
      error: "AI generation failed",
      details: err.message
    });
  }
});

// ---------------- SAVE TO GITHUB ----------------
app.post("/save", async (req, res) => {
  const { code, repo } = req.body;

  if (!code || !repo) {
    return res.status(400).json({ error: "Missing code or repo" });
  }

  try {
    const owner = process.env.GITHUB_USERNAME;
    const path = "terraform/main.tf";
    const branch = "main";

    let sha;

    // Check if file exists
    try {
      const existing = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path,
          ref: branch
        }
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
        repo,
        path,
        message: "AI Terraform update",
        content: Buffer.from(code).toString("base64"),
        branch,
        ...(sha ? { sha } : {})
      }
    );

    res.json({
      message: "Saved to GitHub",
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
  const { code, repo } = req.body;

  if (!code || !repo) {
    return res.status(400).json({ error: "Missing code or repo" });
  }

  try {
    const owner = process.env.GITHUB_USERNAME;
    const path = "terraform/main.tf";
    const branch = "main";

    let sha;

    // Check file
    try {
      const existing = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner,
          repo,
          path,
          ref: branch
        }
      );

      if (!Array.isArray(existing.data)) {
        sha = existing.data.sha;
      }
    } catch (e) {
      sha = undefined;
    }

    // Push code
    await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner,
        repo,
        path,
        message: "Deploy Terraform",
        content: Buffer.from(code).toString("base64"),
        branch,
        ...(sha ? { sha } : {})
      }
    );

    // Trigger GitHub Actions
    await octokit.request(
      "POST /repos/{owner}/{repo}/actions/workflows/terraform.yml/dispatches",
      {
        owner,
        repo,
        ref: branch
      }
    );

    res.json({
      message: "Deployment triggered 🚀"
    });

  } catch (err) {
    console.error("DEPLOY ERROR:", err.response?.data || err.message);
    res.status(500).json({
      error: "Deployment failed",
      details: err.message
    });
  }
});

// ---------------- START SERVER ----------------
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});