import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// ---------------- HEALTH CHECK ----------------
app.get("/", (req, res) => {
  res.send("AI DevOps Backend is running 🚀");
});

// ---------------- GENERATE (dummy for now) ----------------
app.post("/generate", (req, res) => {
  const { prompt } = req.body;

  res.json({
    terraform_code: `# Terraform for: ${prompt}\nresource \"aws_instance\" \"example\" {}`
  });
});

// ---------------- SAVE (placeholder) ----------------
app.post("/save", (req, res) => {
  res.json({ message: "Save API ready (GitHub will be added next)" });
});

// ---------------- DEPLOY (placeholder) ----------------
app.post("/deploy", (req, res) => {
  res.json({ message: "Deploy API ready (CI/CD will be added next)" });
});

// ---------------- START SERVER ----------------
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});