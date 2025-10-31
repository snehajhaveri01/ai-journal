import os, openai, datetime, base64, json
from pathlib import Path
from email.mime.text import MIMEText
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
import firebase_admin
from firebase_admin import credentials, firestore

# 🔑 scopes
SCOPES = ["https://www.googleapis.com/auth/gmail.send"]


# 🚀 Gmail login helper
def gmail_service():
    base_dir = Path(__file__).parent
    token_path = base_dir / "token.json"
    client_path = base_dir / "credentials.json"

    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)
    if not creds or not creds.valid:
        flow = InstalledAppFlow.from_client_secrets_file(str(client_path), SCOPES)
        creds = flow.run_local_server(port=0)
        with open(token_path, "w") as t:
            t.write(creds.to_json())
    return build("gmail", "v1", credentials=creds)


# ✉️ Send email
def send_email(service, to, subject, body):
    msg = MIMEText(body)
    msg["to"], msg["subject"] = to, subject
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    service.users().messages().send(userId="me", body={"raw": raw}).execute()


# 🔥 Firebase (load service account from env or fall back to ADC)
firebase_service_json = os.getenv("FIREBASE_SERVICE_JSON")
if firebase_service_json:
    try:
        service_account_info = json.loads(firebase_service_json)
        cred = credentials.Certificate(service_account_info)
    except Exception as e:
        raise RuntimeError("Invalid FIREBASE_SERVICE_JSON provided") from e
else:
    cred = credentials.ApplicationDefault()

firebase_admin.initialize_app(cred)
db = firestore.client()

# 🤖 OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")


def generate_digest(entries):
    joined = "\n".join([f"- {e.get('summary') or e.get('text')}" for e in entries])
    prompt = (
        "You are a journaling coach. Write a friendly 150-word weekly reflection "
        "highlighting mood, key themes, and encouragements based on:\n" + joined
    )
    res = openai.chat.completions.create(model="gpt-4o-mini",
                                         messages=[{"role": "user", "content": prompt}])
    return res.choices[0].message.content.strip()


def main():
    service = gmail_service()
    since = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    users = db.collection("users").where("isPro", "==", True).stream()

    for u in users:
        user = u.to_dict()
        email = user.get("email")
        if not email:
            continue

        entries = [
            e.to_dict()
            for e in db.collection("entries")
            .where("uid", "==", u.id)
            .where("createdAt", ">=", since)
            .stream()
        ]
        if not entries:
            continue

        digest = generate_digest(entries)
        subject = "Your Weekly Mood Digest 💌"
        send_email(service, email, subject, digest)
        print("✅ Sent to", email)


if __name__ == "__main__":
    main()
