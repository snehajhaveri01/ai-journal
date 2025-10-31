AI Journal

AI Journal is a personal journaling web app built with Next.js (App Router) and Firebase for authentication and data storage. It provides a clean writing surface, entry composer and list views, and a simple paywall for premium features.

This repository contains the frontend (Next.js) and Firebase client config. It's designed to be run locally for development and deployed to platforms like Vercel.

## Features

- User sign-in with Google (Firebase Auth)
- Create, edit and list journal entries
- Server-side and client-side API routes for application logic
- Small paywall component for gating premium features

## Quickstart (local)

1. Install dependencies

```powershell
cd "d:\\aiml projects\\ai-journal\\ai-journal"
npm install
```

2. Create environment variables

Create a file named `.env.local` at the project root with the Firebase client variables (these are safe to expose on the client):

```properties
# Firebase client (safe to expose on the client)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
NEXT_PUBLIC_FIREBASE_APP_ID=1:...:web:...

# Server-only keys (put these in your deployment secret settings, not in .env.local)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=service-account@...iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

OPENAI_API_KEY=sk-...   # only needed for features that call OpenAI
```

Notes:
- Use `.env.local` for local secrets. Next.js automatically loads `.env*` files.
- Keys prefixed with `NEXT_PUBLIC_` are available to client-side code; other keys are only available on the server.

3. Start the dev server

```powershell
npm run dev
```

Open http://localhost:3000 in your browser.

## Firebase setup

1. Create a Firebase project in the Firebase console.
2. Enable Authentication > Sign-in method > Google.
3. Create a Web app in Firebase to get the client config values (apiKey, authDomain, projectId, etc.).
4. For server features that use the Firebase Admin SDK (service account), create a service account and populate `FIREBASE_PRIVATE_KEY`, `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PROJECT_ID` as environment variables on the server (do NOT commit them).

If you see an error like "Missing required environment variable: NEXT_PUBLIC_FIREBASE_API_KEY" in the browser console even though the key is in `.env`, try:

- Ensure the `.env.local` (or `.env`) file is at the project root (next to `package.json`).
- Restart the dev server after creating or modifying env files.
- Verify the variable name is exactly `NEXT_PUBLIC_FIREBASE_API_KEY` (no stray spaces or hidden characters).
- Prefer `.env.local` for local development; deployment platforms often require you to set secrets in their UI.

## Troubleshooting

- Browser shows truncated API key in logs (e.g. `AIzaS...`): that's intentional in some debug logs — verify the full key in your `.env.local`.
- If client code can't read `NEXT_PUBLIC_` vars, confirm they start with `NEXT_PUBLIC_` and that the dev server was restarted since the env change.

## Project structure (high level)

- `app/` - Next.js App Router pages and API routes
- `components/` - UI components (AuthGate, EntryComposer, EntryList, Paywall)
- `lib/firebase/` - Firebase client and admin initialization
- `public/` - static assets

## Development notes

- The Firebase client initializer `lib/firebase/client.ts` validates required env vars and initializes Firebase using `initializeApp`.
- Keep server-only credentials out of `.env.local` if you commit the repo; use deployment secret storage instead.

## Contributing

Contributions are welcome. Open an issue or a PR. Please:

- Create feature branches from `main` (e.g. `feature/signin-improvements`).
- Add tests where appropriate and keep changes small and focused.

## License
