import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import { Octokit } from "@octokit/rest";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

/* ---------------- OPENAI ---------------- */
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------------- GITHUB ---------------- */
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.send("AI DevOps Backend is running 🚀");
});

/* ---------------- AI GENERATE ---------------- */
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

    const terraform_code = response.choices[0].message.content;

    res.json({ terraform_code });

  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI generation failed" });
  }
});

/* ---------------- SAVE TO GITHUB (REAL) ---------------- */
app.post("/save", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: "No code provided" });
  }

  try {
    const owner = process.env.GITHUB_USERNAME;
    const repo = process.env.GITHUB_REPO;

    const path = `terraform/main.tf`;

    const response = await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path,
      message: "Add Terraform code from AI DevOps app",
      content: Buffer.from(code).toString("base64"),
    });

    res.json({
      message: "Saved to GitHub successfully",
      url: response.data.content.html_url,
    });

  } catch (err) {
    console.error("GitHub Error:", err);
    res.status(500).json({ error: "GitHub save failed" });
  }
});

/* ---------------- DEPLOY (placeholder) ---------------- */
app.post("/deploy", (req, res) => {
  res.json({
    message: "Deploy API ready (CI/CD next step)"
  });
});

/* ---------------- START SERVER ---------------- */
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});