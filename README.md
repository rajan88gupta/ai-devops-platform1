# ⚡ AI DevOps Platform (Terraform Generator + GitHub Automation)

An AI-powered DevOps platform that converts natural language into Terraform infrastructure code and automatically saves or deploys it to GitHub repositories.

---

## 🚀 Features
- AI generates Terraform code from simple prompts
- Save generated infrastructure code directly to GitHub
- Trigger deployment using GitHub Actions
- Multi-user support (each user uses their own GitHub repo + token)
- Editable Terraform code before saving
- Firebase authentication system
- Full-stack application (React + Node.js)

---

## 🏗️ Tech Stack
Frontend: React.js, Firebase Auth, Axios  
Backend: Node.js, Express.js, OpenAI API (GPT-4o-mini), Octokit  
DevOps: Terraform, GitHub Actions, AWS (optional)

---

## 📸 How It Works
User enters prompt → AI generates Terraform code → User edits code → Save to GitHub → Optional deploy via GitHub Actions

---

## ⚙️ Setup Instructions

### Backend Setup
cd Backend  
npm install  

Create .env file:
OPENAI_API_KEY=your_openai_key  
PORT=5000  

Run backend:
node server.js  

---

### Frontend Setup
cd frontend  
npm install  
npm start  

---

## 🔐 GitHub Setup (IMPORTANT)
Each user must provide:
- GitHub Repository (format: owner/repo)
- GitHub Personal Access Token (PAT)

Required permissions:
- repo  
- workflow  

---

## 💡 Example Usage

Input:
Create AWS EC2 instance with security group  

Output:
Terraform code generated → saved to GitHub → optional deployment triggered

---

## 🚀 Future Improvements
- GitHub OAuth login (remove token input)
- Auto AWS deployment (terraform apply)
- Kubernetes support
- Live Terraform preview UI
- ChatGPT-style history system
- Production deployment (Vercel + Render)

---

## 👨‍💻 Author
Built by Rajan 🚀  
AI + DevOps + Cloud Automation Project
