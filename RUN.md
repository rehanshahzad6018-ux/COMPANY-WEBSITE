# TECHNO — Run Locally (Full Stack)

A complete digital-studio website with a real backend: persistent lead storage and an AI chatbot powered by **Google Gemini** (free API). Works fully on `localhost`.

---

## Quick start

```bash
# 1. Install dependencies (one time)
npm install

# 2. (Optional but recommended) add a FREE Gemini API key
cp .env.example .env
#    then open .env and paste your key from https://aistudio.google.com/apikey

# 3. Start the server
npm start
```

Open **http://localhost:3000** in your browser. Done.

> Requires **Node.js 18 or newer** (it uses the built-in `fetch`). Check with `node -v`.

---

## What works

| Feature | How it works locally |
|---|---|
| **Website** | All pages served by the Node server (Home, Our CEO, Team, Service, Our Work, Contact). |
| **3D card swap** | GSAP animation, click-to-advance + 3s auto-rotate. |
| **Contact form** | Submits to `POST /api/leads` → saved to `leads.json` on disk. |
| **AI chatbot** | Sends messages to `POST /api/chat` → **Google Gemini** replies. Captures emails as leads. |
| **Admin dashboard** | `http://localhost:3000/admin.html` reads `GET /api/leads` — live list of every submission. |

### The AI chatbot has 3 tiers (automatic)
1. **Backend Gemini** — used when you run the server *with* a `GEMINI_API_KEY`. ✅ recommended
2. **Puter.js** — free, no-key, in-browser AI. Used automatically if no Gemini key is set.
3. *(Design preview only)* the built-in assistant.

So even **without** a key the chatbot still answers — Gemini just makes it faster and higher quality.

---

## API reference

| Method | Route | Purpose |
|---|---|---|
| `GET`  | `/api/leads` | List all leads (JSON) |
| `POST` | `/api/leads` | Create a lead `{ type, data }` |
| `DELETE` | `/api/leads` | Clear all leads |
| `POST` | `/api/chat` | `{ messages: [{role, content}] }` → `{ reply }` |

Leads are stored in **`leads.json`** in the project root. Delete that file to reset.

---

## Get your free Gemini key (30 seconds)
1. Go to **https://aistudio.google.com/apikey**
2. Click **Create API key** (free, no credit card).
3. Copy it into `.env` as `GEMINI_API_KEY=...`
4. Restart the server (`npm start`).

---

## Deploying
Any Node host works (Render, Railway, Fly.io, a VPS). Set the `GEMINI_API_KEY`
environment variable in the host's dashboard and run `npm start`. For serverless
platforms, port the two `/api/*` handlers in `server.js` to functions and keep
the static files as-is — the frontend talks to those routes by relative path.

---

## File map
```
server.js          Express backend (static + /api/leads + /api/chat)
package.json       deps + start script
.env.example       copy to .env and add your key
Techno.html        home page  (our-ceo, team, service, our-work, contact .html)
admin.html         leads dashboard
techno.css         design system + all styles
techno.js          home-page 3D card swap (GSAP)
site.js            shared UI (reveal, mobile nav, typing button, contact form)
store.js           data layer — talks to /api/leads, falls back to localStorage
chatbot.js         AI chat widget (backend → Puter fallback)
fonts/             self-hosted Anton + Plus Jakarta Sans
```
