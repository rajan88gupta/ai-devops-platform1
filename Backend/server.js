import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";

dotenv.config();

/* ---------------- FIX: FETCH FOR OPENAI ---------------- */
globalThis.fetch = fetch;

/* ---------------- APP ---------------- */
const app = express();
app.use(cors());
app.use(express.json());

/* ---------------- OPENAI ---------------- */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- GITHUB ---------------- */
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.send("AI DevOps Backend Running 🚀");
});

/* ---------------- GENERATE TERRAFORM ---------------- */
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
          content: "Return ONLY Terraform code. No explanation, no markdown."
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
    console.error("OPENAI ERROR:", err);
    res.status(500).json({
      error: "AI generation failed",
      details: err.message
    });
  }
});

/* ---------------- SAVE TO GITHUB (FIXED SHA ISSUE) ---------------- */
app.post("/save", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;
    const path = "terraform/main.tf";

    let sha = null;

    // STEP 1: Check if file exists
    try {
      const file = await octokit.repos.getContent({
        owner,
        repo,
        path
      });

      sha = file.data.sha;
    } catch (err) {
      sha = null; // file does not exist
    }

    // STEP 2: Create or update file safely
    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "AI Terraform update",
      content: Buffer.from(code).toString("base64"),
      ...(sha ? { sha } : {}) // only include if exists
    });

    res.json({
      message: "Saved to GitHub",
      url: response.data.content.html_url
    });

  } catch (err) {
    console.error("GITHUB ERROR:", err);
    res.status(500).json({
      error: "GitHub save failed",
      details: err.message
    });
  }
});

/* ---------------- START SERVER ---------------- */
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});