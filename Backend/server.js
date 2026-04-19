import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";
import fetch, { Headers, FormData } from "node-fetch";

// ---------------- POLYFILLS (REQUIRED FOR OPENAI SDK) ----------------
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.FormData = FormData;

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// ---------------- OPENAI CLIENT ----------------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.send("AI DevOps Backend is running 🚀");
});

// ---------------- AI GENERATE ----------------
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

// ---------------- SAVE (placeholder) ----------------
app.post("/save", (req, res) => {
  res.json({
    message: "Save API ready (GitHub integration next step)"
  });
});

// ---------------- DEPLOY (placeholder) ----------------
app.post("/deploy", (req, res) => {
  res.json({
    message: "Deploy API ready (CI/CD next step)"
  });
});

// ---------------- START SERVER ----------------
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});