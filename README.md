<div align="center">

<img src="https://img.shields.io/badge/version-2.0.0-blueviolet?style=for-the-badge&logo=rocket" alt="Version" />
<img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/Vite-5.3-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
<img src="https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=for-the-badge&logo=netlify&logoColor=white" alt="Netlify" />
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
<img src="https://img.shields.io/badge/n8n-Cloud-EA4B71?style=for-the-badge&logo=n8n&logoColor=white" alt="n8n" />

<br/><br/>

# ⚡ Bang AI (Bang)

### *The Autonomous Viral Short-Form Video Engine for Creators*

> **Turn any one-line idea into a 5-scene cinematic screenplay, neural ElevenLabs voiceover, dynamic subtitles, and 1-click auto-published YouTube Short in under 75 seconds.**

**Live Application:** [https://bangai.netlify.app/](https://bangai.netlify.app/)  
**GitHub Repository:** [https://github.com/Suzainkhan-SK/BangAI.git](https://github.com/Suzainkhan-SK/BangAI.git)

</div>

---

## ✨ What is Bang AI?

**Bang AI** (marketed as **Bang**) is a high-production autonomous video creation platform built for creators, media agencies, and faceless channel empires.

1. **Autonomous 5-Act Narrative Engine:** Takes a simple idea and writes a mathematically timed 75-second screenplay (15s per act) with high-retention 3-second viral hooks.
2. **Multi-Channel YouTube Integration:** Connect unlimited YouTube channels via official Google OAuth 2.0 with automated token refresh and direct 1080p publishing.
3. **Google Sheets Auto-Sync:** Automatically logs every screenplay, audio track, MP4 URL, and published YouTube link to your connected Google Sheet.
4. **Studio Voice & Sound Matrix:** 21+ ElevenLabs voice characters, adaptive speed pacing (1.10x–1.50x), dynamic subtitle rendering, and royalty-free background scores.
5. **Human-in-the-Loop Studio Canvas:** Review screenplay beats, tweak plot twists, customize voiceover and subtitle styles, or click 1-Click Approve for instant cloud rendering.

---

## 🚀 Key Features

<table>
<tr>
<td>

### 🤖 5-Act Screenplay Doctor
- Mathematical 190–200 character scene pacing
- High-retention 3-second pattern interrupts
- Multi-language support (English, Hinglish, Hindi, Spanish)
- Story Quality Critic agent pre-screening

</td>
<td>

### 🎙️ Neural Audio & Subtitles
- 21+ ElevenLabs character voices
- Adaptive speed control (1.10x–1.50x)
- Dynamic karaoke-style subtitle rendering
- Royalty-free cinematic music stems

</td>
</tr>
<tr>
<td>

### 🔴 Multi-Channel YouTube Sync
- Official Google OAuth 2.0 Token Vault
- Connect unlimited YouTube brand channels
- Auto-refreshing tokens (zero inactivity drops)
- 1-Click unlisted/public premiere publishing

</td>
<td>

### 📊 Google Sheets Auto-Matrix
- 1-Click Google Drive spreadsheet connect
- Live row append with video metadata
- Automated content calendar tracking
- MongoDB Atlas persistent state

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CREATOR BROWSER                          │
│                   React 18 + Vite Frontend                      │
│      Canvas | Storyboard | Multi-Channel Hub | Settings         │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTPS (Netlify)
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│                   NETLIFY SERVERLESS LAYER                       │
│  ┌──────────────────┐  ┌───────────────────┐  ┌──────────────┐  │
│  │   google-oauth   │  │  upload-youtube   │  │ generate-    │  │
│  │  (Token Vault)   │  │  (Dynamic Token)  │  │ story / chat │  │
│  └────────┬─────────┘  └────────┬──────────┘  └──────┬───────┘  │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            │                     │                    │
        OAuth 2.0           POST /webhook         POST /webhook
            │                     │                    │
┌───────────▼─────────────────────▼────────────────────▼──────────┐
│                    n8n CLOUD WORKFLOW ENGINE                    │
│                     (ID: 8gjIDzachTHImGke)                      │
│                                                                 │
│  Webhook Trigger ──► RapidAPI Key Rotation ──► Wan 2.1 Video    │
│  ElevenLabs TTS  ──► Whisper Subtitles    ──► YouTube Upload    │
│  Google Sheets   ──► Website Callback     ──► Live Dashboard    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Environment Configuration

| Variable | Description |
| :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string for user auth and OAuth token vault |
| `JWT_SECRET` | Secret key used for signing HMAC-SHA256 session tokens |
| `GOOGLE_CLIENT_ID` | Google Cloud OAuth 2.0 Client ID for YouTube & Sheets |
| `GOOGLE_CLIENT_SECRET` | Google Cloud OAuth 2.0 Client Secret |
| `N8N_WEBHOOK_URL` | Primary n8n Cloud video generation trigger endpoint |
| `N8N_YOUTUBE_WEBHOOK_URL`| n8n Cloud manual/auto YouTube upload trigger endpoint |
| `SHORTSAI_WEBHOOK_SECRET`| Shared HMAC security secret between Netlify and n8n |

---

## 💻 Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Suzainkhan-SK/BangAI.git
cd BangAI

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build for production
npm run build
```

---

<div align="center">
  <p>© 2026 Bang AI. Built for autonomous video creators.</p>
</div>
