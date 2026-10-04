# BangAI Admin Panel — Code Architecture & Directory Reference

Welcome to the dedicated **BangAI Admin Panel** frontend codebase! Every file and component for the administrative control plane is consolidated in this folder (`BangAI/src/admin/`).

---

## 📁 Directory Structure

```
BangAI/src/admin/
├── AdminApp.jsx              # Master container, handles auth verification & 16-view routing
├── AdminHeader.jsx           # Global header with system status, theme sync & profile
├── AdminSidebar.jsx          # 16-page categorized navigation with collapse/expand
├── AdminLogin.jsx            # Secure login modal portal for @SuzainkhanSK
├── adminService.js           # Client-side API service talking to /.netlify/functions/admin
├── admin.css                 # Cyber-glassmorphic styling with native Dark & Light mode sync
├── README.md                 # This architecture reference document
└── views/                    # The 16 dedicated admin control view components
    ├── CommandCenterView.jsx      # Page 1: Master Command Center (KPIs, health, emergency kill switch)
    ├── N8nMigratorView.jsx        # Page 2: 1-Click 14-Day n8n Migrator & Instant Rollback
    ├── WorkflowManagerView.jsx    # Page 3: Workflow Node Manager & Dynamic Key Injector
    ├── KeyVaultView.jsx           # Page 4: Multi-Provider Key Vault with real-time balance meters
    ├── ModalClusterView.jsx       # Page 5: Modal GPU Dual-Cluster Failover (cmpunktg vs cmpunktg1)
    ├── DashboardManagerView.jsx   # Page 6: Dashboard Manager (Announcements, showcase reels)
    ├── StockStudioManagerView.jsx # Page 7: Stock Studio Manager (Pexels, MoneyPrinterTurbo, FFmpeg)
    ├── ChatManagerView.jsx        # Page 8: BangAI Chat Persona, LLM selection, test playground
    ├── TemplatesManagerView.jsx   # Page 9: AI Templates Hub & 1-Click New Template Wizard
    ├── ThumbnailManagerView.jsx   # Page 10: Thumbnail Studio & Kie.ai Engine Manager
    ├── DesignStudioView.jsx       # Page 11: Design Studio (Animated subtitles, colors, watermarks)
    ├── AssetVaultView.jsx         # Page 12: Master Asset Vault (4-stage Kanban, cinema player)
    ├── UsersManagerView.jsx       # Page 13: User & Quota Center (Directory, tier overrides, credits)
    ├── InfrastructureView.jsx     # Page 14: Cloud Infrastructure (MongoDB Atlas & Netlify)
    ├── TelemetryView.jsx          # Page 15: Telemetry & 6-Webhook Latency Matrix + Telegram Bot
    └── SecurityLogsView.jsx       # Page 16: Security & Immutable Audit Logs + Master Password
```

---

## 🔐 Master Administrator Credentials
- **Username**: `@SuzainkhanSK`
- **Password**: `@NotHumanX6361`
- **Access Route**: `https://bangai.netlify.app/#admin` (or locally `http://localhost:5173/#admin`)

---

## 🎨 Theme Synchronization
The Admin Panel utilizes BangAI's native theme engine (`document.documentElement.setAttribute('data-theme', theme)`). Toggling between **Dark Mode** and **Light Mode** in either the main app or the admin header seamlessly synchronizes both interfaces with instant glassmorphic adaptation.
