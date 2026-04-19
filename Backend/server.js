import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { Octokit } from "@octokit/rest";

dotenv.config();

/* ---------------- POLYFILL FIRST (IMPORTANT) ---------------- */
import fetch, { Headers, FormData } from "node-fetch";

globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.FormData = FormData;

/* ---------------- NOW SAFE TO IMPORT OPENAI ---------------- */
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- GITHUB ---------------- */
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- HEALTH ---------------- */
app.get("/", (req, res) => {
  res.send("AI DevOps Backend is running 🚀");
});

/* ---------------- GENERATE ---------------- */
app.post("/generate", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You are a DevOps Terraform expert.

Rules:
- Return ONLY Terraform code
- No explanation
- No markdown
- No extra text
`
        },
        {
          role: "user",
          content: `Generate Terraform for: ${prompt}`
        }
      ]
    });

    res.json({
      terraform_code: response.choices[0].message.content
    });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

/* ---------------- SAVE TO GITHUB ---------------- */
app.post("/save", async (req, res) => {
  const { code } = req.body;

  try {
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;

    const path = `terraform/main.tf`;

    const result = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Add Terraform code from AI DevOps app",
      content: Buffer.from(code).toString("base64"),
    });

    res.json({
      message: "Saved to GitHub",
      url: result.data.content.html_url
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "GitHub save failed" });
  }
});

/* ---------------- START ---------------- */
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});