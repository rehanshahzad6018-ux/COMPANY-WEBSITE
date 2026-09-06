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
| **Contact form** | Submits to `POST /api/contact` → saved to `messages.json` **and emailed to cgwofficialai@gmail.com** with the visitor as Reply-To. |
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
| `POST` | `/api/contact` | Contact form → stores the enquiry and emails it. Body: `{ name, email, budget, message, company, elapsed }` |

Leads are stored in **`leads.json`** in the project root. Delete that file to reset.

---

## Get your free Gemini key (30 seconds)
1. Go to **https://aistudio.google.com/apikey**
2. Click **Create API key** (free, no credit card).
3. Copy it into `.env` as `GEMINI_API_KEY=...`
4. Restart the server (`npm start`).

---

## Contact form → email (cgwofficialai@gmail.com)

Every submission on **contact.html** is stored in `messages.json` *and* emailed to
`CONTACT_TO` (default `cgwofficialai@gmail.com`). The email carries the visitor's
name, email, budget, full message and the submission date/time, and sets
**Reply-To** to the visitor — so hitting *Reply* in Gmail answers the client directly.

Credentials are read from environment variables on the server only; nothing is
exposed in the browser.

### Setup — Gmail App Password (2 minutes)
1. Google Account → **Security** → turn on **2-Step Verification**.
2. Security → **App passwords** → create one for *Mail* → copy the 16 characters.
3. Put it in `.env` (local) and in your host's environment variables (production):

```bash
CONTACT_TO=cgwofficialai@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=cgwofficialai@gmail.com
SMTP_PASS=the16charapppassword
```

4. Restart the server. A successful send logs
   `[contact] emailed to cgwofficialai@gmail.com via smtp — Name <email>`.

### If your host blocks SMTP ports
Use the HTTP API instead — set `RESEND_API_KEY` (from resend.com) and
`RESEND_FROM` with a domain verified in Resend. The mailer picks Resend
automatically when that key is present; no code change needed.

### Spam protection
* Hidden honeypot field (`#company`) — filled in only by bots, silently dropped.
* Time trap — submissions faster than 2 seconds after page load are rejected.
* Rate limit — 5 submissions per minute per IP.
* Server-side validation of name, email format and message length.

### Anything goes wrong
The visitor sees *"Something went wrong. Please try again or email us directly."*
and the enquiry is still saved to `messages.json` (visible in `admin.html`), so
nothing is lost even if delivery fails.

---

## Admin panel & chatbot

**Admin login** — `/admin.html`. The password is **not** in the page any more; the
browser posts it to `POST /api/admin/login`, and the server returns the API token
only on a correct password. Set both in the environment:

```bash
ADMIN_USER=admin
ADMIN_PASSWORD=your_login_password
ADMIN_SECRET=<long random string>   # node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

If `ADMIN_SECRET` is missing the whole admin API returns 503 — that is deliberate,
so a deploy without credentials cannot expose visitor data. Changing `ADMIN_SECRET`
logs everyone out on their next page load.

**Chatbot** — needs `GEMINI_API_KEY` (aistudio.google.com) plus, optionally,
`GEMINI_MODEL`. Google retires model names often, so `callGemini()` walks a
fallback list if the configured model is gone (404) or busy (503). Prefer a
`-lite` model: the thinking models can spend the entire token budget on internal
thoughts and return an empty answer.

The chatbot's knowledge lives in `SYSTEM_PROMPT` at the top of `ai-brain.js` —
company, CEO, team, all 11 services, 10 portfolio projects, pricing, process,
careers and contact. Edit that block whenever the site content changes.

**What is never served to the browser**: `server.js`, `mailer.js`, `ai-brain.js`,
`package.json`, every dotfile (`.env`, `.git/`), `uploads/`, and all runtime JSON
(`messages.json`, `leads.json`, `applications.json`). See `BLOCKED_FILES` and
`BLOCKED_DIRS` in `server.js`.

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
