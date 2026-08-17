<div align="center">

<img src="https://img.shields.io/badge/version-1.0.0-blueviolet?style=for-the-badge&logo=rocket" alt="Version" />
<img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
<img src="https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
<img src="https://img.shields.io/badge/n8n-Cloud-EA4B71?style=for-the-badge&logo=n8n&logoColor=white" alt="n8n" />

<br/><br/>

# 🎬 Viral Shorts AI Studio

### *The World's First AI-Powered Viral Short-Form Video Engine*

> **Turn any idea into a fully scripted, AI-voiced, cinematic short-form video — in under 60 seconds.**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Suzainkhan-SK/viral-shorts-ai-studio)

</div>

---

## ✨ What is Viral Shorts AI Studio?

**Viral Shorts AI Studio** is a full-stack, AI-powered platform that automates the entire creative pipeline for producing viral short-form videos (Reels, Shorts, TikToks). It leverages **n8n Cloud** for AI orchestration and a **React + Vite** frontend deployed on **Netlify** for a premium user experience.

Write a one-line idea. The AI writes the script, plans 5 cinematic scenes, chooses a viral hook, generates voiceover, adds visual direction — and presents it all for your approval. One click later, it's ready to produce.

---

## 🚀 Features

<table>
<tr>
<td>

### 🤖 AI Content Engine
- 5-Act cinematic story structure
- 3-second viral hook generation
- Suggested titles optimized for virality
- Multi-language support (Hinglish, English, Hindi, Spanish)

</td>
<td>

### 🎙️ Voice & Style
- Multiple AI voice characters (Adam, Rachel, Josh, Elli, Arnold...)
- Visual style presets: Cinematic, Anime, Sketch, Neon, Documentary
- Auto-matching voiceover to mood

</td>
</tr>
<tr>
<td>

### 📋 Story Approval Flow
- Human-in-the-loop review before production
- Full 5-act story preview
- One-tap Approve / Cancel
- Real-time status updates via SSE

</td>
<td>

### ⚡ Production-Ready
- Netlify serverless backend
- n8n Cloud webhook automation
- Zero-downtime deployments via CI/CD
- CORS-safe API layer

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                   React 18 + Vite Frontend                      │
│           Dashboard | Canvas | Approval | Settings              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTPS (Netlify)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   NETLIFY SERVERLESS LAYER                       │
│  ┌─────────────────┐  ┌───────────────────┐  ┌───────────────┐  │
│  │ generate-story  │  │  story-approval   │  │ approve-story │  │
│  └────────┬────────┘  └────────┬──────────┘  └──────┬────────┘  │
└───────────┼────────────────────┼────────────────────┼───────────┘
            │                    │                     │
       POST /webhook         Callback URL         Resume URL
            │                    │                     │
┌───────────▼────────────────────▼─────────────────────▼───────────┐
│                    n8n CLOUD WORKFLOW ENGINE                       │
│                                                                    │
│   Website Webhook ──► Filter/Parse ──► AI Story Generator         │
│                                                │                   │
│   Story Output ◄──────────────────────── LLM Chain                │
│        │                                                           │
│   HTTP Request ──► Netlify Callback ──► Story Approval UI         │
│        │                                       │                   │
│   n8n Wait ◄──────────────────── User Approves/Cancels           │
│        │                                                           │
│   Video Production Pipeline ──► (YouTube Upload etc.)            │
└────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | UI & Client-side logic |
| **Styling** | Vanilla CSS + Custom Design System | Premium dark UI |
| **Icons** | Lucide React | Clean icon set |
| **Backend** | Netlify Serverless Functions | API bridge & callbacks |
| **Automation** | n8n Cloud (Webhook workflow) | AI orchestration |
| **AI Models** | OpenAI GPT (via n8n) | Story, hooks & titles |
| **Voice** | ElevenLabs (via n8n) | AI voiceovers |
| **Hosting** | Netlify | CDN + CI/CD |
| **CI/CD** | GitHub → Netlify Auto-Deploy | Push-to-deploy |

---

## 📁 Project Structure

```
viral-shorts-ai-studio/
│
├── 📄 index.html                   # App entry point
├── 📄 netlify.toml                 # Netlify config (SPA redirects, functions)
├── 📄 vite.config.js               # Vite build config
├── 📄 package.json                 # Dependencies
│
├── 📁 netlify/
│   └── 📁 functions/
│       ├── generate-story.js       # Dispatches prompt to n8n webhook
│       ├── story-approval.js       # Receives story from n8n callback
│       └── approve-story.js        # Resumes n8n workflow on approval
│
├── 📁 src/
│   ├── 📄 main.jsx                 # React entry
│   ├── 📄 App.jsx                  # Routing & layout
│   ├── 📄 index.css                # Global design system & variables
│   │
│   ├── 📁 components/
│   │   ├── 📁 Dashboard/           # Main creative dashboard
│   │   │   ├── DashboardApp.jsx    # Connected to Netlify + approval SSE
│   │   │   └── StoryApprovalCard.jsx # Story review & 1-tap approval UI
│   │   ├── 📁 Landing/             # Marketing landing page
│   │   ├── 📁 Auth/                # Login / Register components
│   │   ├── 📁 CenterStage/         # Video canvas / scene editor
│   │   ├── 📁 LeftPanel/           # Sidebar controls
│   │   ├── 📁 RightPanel/          # Properties panel
│   │   ├── 📁 BottomDrawer/        # Audio timeline
│   │   ├── Navbar.jsx              # Global navigation
│   │   └── Header.jsx              # Page header
│   │
│   ├── 📁 pages/
│   │   ├── LandingPage.jsx         # Public homepage
│   │   ├── LoginPage.jsx           # Authentication
│   │   ├── RegisterPage.jsx        # User registration
│   │   ├── ProfilePage.jsx         # User profile & analytics
│   │   ├── SettingsPage.jsx        # App settings
│   │   ├── PricingPage.jsx         # Subscription plans
│   │   └── ApiDocsPage.jsx         # API documentation
│   │
│   ├── 📁 audio/                   # Audio engine & waveform
│   └── 📁 data/                    # Static data & constants
│
└── 📁 workflows/
    └── Viral All-In-One AI [...].json   # n8n workflow export
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- npm or yarn
- n8n Cloud account
- Netlify account

### 1. Clone & Install
```bash
git clone https://github.com/Suzainkhan-SK/viral-shorts-ai-studio.git
cd viral-shorts-ai-studio
npm install
```

### 2. Local Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

### 3. Production Build
```bash
npm run build
```
Output is in `dist/`

---

## 🌐 Deploy to Netlify

### One-Click Deploy
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Suzainkhan-SK/viral-shorts-ai-studio)

### Manual Deploy
1. **Import** your forked repo at [app.netlify.com](https://app.netlify.com)
2. Netlify auto-detects `netlify.toml` — **no config needed**
3. Click **"Deploy Site"**
4. Done ✅

### CI/CD (Auto-Deploy)
Every `git push` to `main` automatically triggers a new Netlify build and deploy. Zero downtime.

---

## 🔌 n8n Webhook Configuration

Import the workflow JSON from `workflows/` into your n8n Cloud instance.

The webhook endpoint is:
```
POST https://<your-n8n-cloud>.app.n8n.cloud/webhook/viral-shorts-ai
```

**Expected Request Body:**
```json
{
  "prompt": "A motivational story about a street vendor who became a millionaire",
  "voiceId": "adam",
  "visualStyle": "Cinematic Realistic",
  "language": "Hinglish",
  "callbackUrl": "https://your-site.netlify.app/.netlify/functions/story-approval"
}
```

**n8n Returns (via callbackUrl):**
```json
{
  "suggestedTitle": "From Rs.50 to Rs.50 Crore!",
  "viralHook": "He had Rs.50 in his pocket. Today he owns 3 factories.",
  "storyBrief": "...",
  "approveUrl": "https://n8n.cloud/webhook/viral-shorts-ai/approve",
  "cancelUrl":  "https://n8n.cloud/webhook/viral-shorts-ai/cancel"
}
```

---

## 🗺️ Roadmap

- [x] AI story generation with 5-act structure
- [x] Human-in-the-loop story approval flow
- [x] Multi-language & multi-voice support
- [x] Netlify serverless backend
- [x] n8n Cloud webhook integration
- [x] CI/CD via GitHub to Netlify
- [ ] ElevenLabs voiceover auto-generation
- [ ] D-ID / HeyGen avatar video synthesis
- [ ] Automatic YouTube Shorts upload
- [ ] Analytics dashboard (views, CTR, watch time)
- [ ] Team collaboration & shared workspaces
- [ ] Custom brand voice training

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feat/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feat/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ and too much ☕**

*If this project helped you, please consider giving it a ⭐ on GitHub!*

[![GitHub Stars](https://img.shields.io/github/stars/Suzainkhan-SK/viral-shorts-ai-studio?style=social)](https://github.com/Suzainkhan-SK/viral-shorts-ai-studio/stargazers)

</div>
