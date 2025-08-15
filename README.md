StudyFetch AI Tutor

An AI tutor that helps students understand PDF documents via a split-screen interface. Users can chat (text/voice) about the document while the AI highlights and annotates relevant areas of the PDF in real time.

Built with Next.js (App Router), Prisma + PostgreSQL (Neon), NextAuth (email/password), Tailwind, Vercel Blob for storage, and an LLM provider (Groq or OpenAI).

✨ Features

🔐 Email/password auth (NextAuth + Credentials)

🗂️ Dashboard of previously uploaded PDFs

⬆️ Upload PDFs to Vercel Blob

🔎 Text extraction + per-page indexing with Prisma

💬 Chat about the PDF (stores chat history)

🎯 AI can jump to page, highlight text, and draw circles

🎙️ Voice input (browser STT) + 🔊 optional TTS playback

♻️ Sessions persist; re-open a doc and continue where you left off

🧱 Tech Stack

Frontend: Next.js 14/15 (App Router), React, Tailwind

Auth: NextAuth (Credentials)

Database: Prisma ORM + Neon PostgreSQL

Storage: Vercel Blob (public URLs)

LLM: Groq (recommended for demo) or OpenAI

PDF: react-pdf (pdf.js) with custom overlay annotations

📁 Project Structure
studyfetch-ai-tutor/
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ app/
│  │  ├─ (auth)/
│  │  │  ├─ login/page.tsx
│  │  │  └─ signup/page.tsx
│  │  ├─ (dashboard)/
│  │  │  ├─ page.tsx                 # dashboard lists PDFs
│  │  │  └─ doc/[id]/page.tsx        # split view (PDF + chat)
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ blob/upload-url/route.ts
│  │  │  ├─ pdf/extract/route.ts
│  │  │  ├─ chat/route.ts
│  │  │  └─ chat/history/route.ts
│  │  └─ page.tsx                     # upload screen
│  ├─ components/
│  │  ├─ Header.tsx
│  │  ├─ SignOutButton.tsx
│  │  ├─ ThemeToggle.tsx
│  │  ├─ UploadBox.tsx
│  │  ├─ PdfViewer.tsx
│  │  └─ ChatPanel.tsx
│  ├─ lib/
│  │  ├─ auth.ts
│  │  ├─ db.ts
│  │  ├─ prompts.ts
│  │  └─ ai.ts
│  ├─ styles/
│  │  └─ globals.css
│  └─ types/
│     └─ next-auth.d.ts
├─ middleware.ts (optional)
├─ .env.example
└─ README.md

🔧 Prerequisites

Node 18+

npm (or pnpm/yarn)

Neon PostgreSQL connection string

Vercel Blob Read/Write token

Groq or OpenAI API key

⚙️ Environment Variables

Create a .env in the project root (you already did). Keep .env.example committed.

.env.example

# Database (Neon)
DATABASE_URL=""

# NextAuth (Auth)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace_with_long_random_string"

# LLM provider: choose groq (recommended for demo) or openai
LLM_PROVIDER="groq"
OPENAI_API_KEY=""
GROQ_API_KEY=""

# Vercel Blob token (RW)
BLOB_READ_WRITE_TOKEN=""

NODE_ENV="development"


Generate a secret quickly:

node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

🛠️ Local Setup
# 1) Install deps
npm i

# 2) Prisma client
npx prisma generate

# 3) Create DB tables (will prompt to create a migration)
npx prisma migrate dev --name init

# 4) Run dev server (ensure it matches NEXTAUTH_URL port)
npm run dev

# Visit
# http://localhost:3000


Windows PowerShell cleanup/restart (if needed):

Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run dev

🧭 How to Use

Sign up with email/password

Upload a PDF (drag-drop or button)

It redirects to /doc/[id] (split-screen):

Ask questions about the PDF

The AI can highlight or circle areas, and jump to pages

Return to dashboard to see all uploaded PDFs

Voice:

🎤 mic (browser STT) to dictate

🔊 toggle to read replies with TTS

🚀 Deploy to Vercel

Push repo to GitHub and Import Project in Vercel

In Vercel → Project Settings → Environment Variables, set:

DATABASE_URL

NEXTAUTH_URL → your Vercel URL (e.g. https://your-app.vercel.app)

NEXTAUTH_SECRET

LLM_PROVIDER (groq or openai)

GROQ_API_KEY or OPENAI_API_KEY

BLOB_READ_WRITE_TOKEN

Deploy

Run migrations against production DB:

npx prisma migrate deploy

🧪 API Endpoints (brief)

POST /api/signup – create user (email, password)

GET/POST /api/auth/[...nextauth] – NextAuth credentials (login/logout/csrf)

POST /api/blob/upload-url – uploads a PDF (multipart file) to Vercel Blob → returns url

POST /api/pdf/extract – { blobUrl, title } → parses text, stores per-page, creates Document and a ChatSession → returns { documentId, chatSessionId }

POST /api/chat – { documentId, chatSessionId, messages } → streams/generates reply; last JSON line includes { gotoPage, highlights, circles }

GET /api/chat/history?chatSessionId=... – previous messages

GET /api/docs – list current user’s documents

GET /api/docs/[id] – single document (auth-checked)

🧩 Implementation Notes

PDF Worker: we set pdfjs.GlobalWorkerOptions.workerSrc to a CDN version to avoid native canvas deps in Node.

Annotations: the viewer listens for window.postMessage({ type: "ai-actions", payload }) where payload can include:

{ "gotoPage": 3, "highlights": [{ "page": 3, "quote": "cell membrane" }], "circles": [{ "page": 4, "quote": "virus" }] }


Session: We ensure session.user.id in the NextAuth session callback and type-augment it in src/types/next-auth.d.ts.

🧰 Scripts
# Dev server
npm run dev

# Build & run production locally
npm run build
npm start

# Prisma
npx prisma generate
npx prisma migrate dev --name <name>
npx prisma migrate deploy
npx prisma studio

🧯 Troubleshooting

Sign out returns 405 or client fetch error

Ensure src/app/api/auth/[...nextauth]/route.ts exports both GET and POST:

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


Don’t run this route on Edge.

Prisma: “table does not exist” / P2021 / P2022

Run migrations:

npx prisma generate
npx prisma migrate dev


In prod: npx prisma migrate deploy

PDF worker/canvas errors

We load the pdf.js worker from CDN in the client (PdfViewer.tsx):

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


This avoids native canvas in Node.

NextAuth session typing errors

Ensure src/types/next-auth.d.ts exists and restart TS server (VS Code: “TypeScript: Restart TS Server”).

OpenAI quota errors

Use Groq for the demo: set LLM_PROVIDER=groq and GROQ_API_KEY.

Blob upload returns 401/500

Verify BLOB_READ_WRITE_TOKEN is set in env (local and Vercel).