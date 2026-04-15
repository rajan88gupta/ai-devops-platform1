from fastapi import FastAPI
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from openai import OpenAI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from urllib.parse import quote_plus

# ---------------- LOAD ENV ----------------
load_dotenv()

app = FastAPI()

# ---------------- CORS ----------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- OPENAI ----------------
api_key = os.getenv("OPENAI_API_KEY")

if not api_key:
    print("WARNING: OPENAI_API_KEY missing")

client = OpenAI(api_key=api_key) if api_key else None


# ---------------- MONGODB ----------------
mongo_url = os.getenv("MONGO_URL")
history_collection = None

if mongo_url:

    try:
        if mongo_url.startswith("MONGO_URL="):
            mongo_url = mongo_url.replace("MONGO_URL=", "")

        if "@" in mongo_url and "mongodb+srv" in mongo_url:
            prefix = mongo_url.split("mongodb+srv://")[1]
            user_pass, host_part = prefix.split("@", 1)
            username, password = user_pass.split(":", 1)

            mongo_url = f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}@{host_part}"

        mongo_client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
        mongo_client.admin.command("ping")

        db = mongo_client["ai_devops"]
        history_collection = db["history"]

        print("MongoDB Connected ✅")

    except Exception as e:
        print("MongoDB error:", e)
        history_collection = None


# ---------------- REQUEST MODEL ----------------
class RequestData(BaseModel):
    prompt: str
    cloud: str
    uid: str


# ---------------- SECURITY CHECK ----------------
def security_check(code: str):
    bad = ["0.0.0.0/0", "destroy", "delete", "admin", "force_destroy"]
    for b in bad:
        if b.lower() in code.lower():
            return False, b
    return True, None


# ---------------- HOME ----------------
@app.get("/")
def home():
    return {"status": "ok", "message": "AI DevOps SaaS Running 🚀"}


# ---------------- GENERATE ----------------
@app.post("/generate")
def generate(data: RequestData):

    try:
        if client is None:
            return {"status": "error", "message": "OpenAI API key missing"}

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Return ONLY Terraform code. No explanation."
                },
                {"role": "user", "content": data.prompt}
            ]
        )

        terraform_code = response.choices[0].message.content.strip()

        safe, danger = security_check(terraform_code)
        if not safe:
            return {"status": "blocked", "danger": danger}

        output = "Execution skipped (Render)"

        if history_collection is not None:
            history_collection.insert_one({
                "uid": data.uid,
                "prompt": data.prompt,
                "cloud": data.cloud,
                "terraform_code": terraform_code,
                "terraform_output": output
            })

        return {
            "status": "success",
            "terraform_code": terraform_code,
            "terraform_output": output
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ---------------- HISTORY ----------------
@app.get("/history")
def history(uid: str):

    if history_collection is None:
        return []

    try:
        data = list(history_collection.find(
            {"uid": uid},
            {"_id": 0}
        ))

        return list(reversed(data))

    except Exception as e:
        return []