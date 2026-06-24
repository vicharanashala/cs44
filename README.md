<div align="center">

<br />

# 🎯 AnswerHub

### *The Intelligent Community Q&A Platform*

<br />

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-12-FF0055?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

<br />

**A production-grade, community-driven Q&A and FAQ platform** engineered for institutional portals, university hubs, and knowledge-sharing communities. Featuring a moderated answer pipeline, reputation & badge gamification, AI-powered summaries, multi-language translation, voice-enabled search, text-to-speech accessibility, real-time leaderboards, and a cinematic dark/light developer aesthetic.

<br />

[🚀 Getting Started](#-getting-started) · [✨ Features](#-feature-highlights) · [🏆 Gamification](#-reputation--badge-system) · [🏗️ Architecture](#%EF%B8%8F-architecture) · [📄 License](#-license)

<br />

</div>

---

## ✨ Feature Highlights

<table>
<tr>
<td width="50%">

### 🔐 Role-Based Access Control
Fine-grained RBAC with three permission tiers:
- **Guest** — Browse verified answers, search, view FAQs
- **User** — Ask questions, submit answers, upvote, track notifications
- **Admin** — Full moderation dashboard with bulk operations, metrics, flagging review, and content management

</td>
<td width="50%">

### 🛡️ Moderated Answer Pipeline
Enterprise-grade content quality assurance:
- Submitted answers are **private by default** until admin verification
- Four-state workflow: `pending` → `verified` / `rejected` / `spam`
- Authors receive **real-time notifications** with admin feedback notes
- ✅ **Accepted Answer** — Question owners can mark the best answer

</td>
</tr>
<tr>
<td width="50%">

### 🏆 Reputation & Badge System
Full gamification engine to drive engagement:
- **Reputation Points** — Earn points for asking, answering, upvotes, accepted answers, and daily logins
- **🥉🥈🥇 Tiered Badges** — Bronze, Silver, Gold, and Special badges
- **📈 Progress Tracker** — Visual progress bar toward next badge
- **🔥 Leaderboard** — Live rankings of top contributors

</td>
<td width="50%">

### 🎙️ Voice Search (Voice Chat)
Hands-free voice input powered by the **Web Speech API**:
- **Search bar** — Tap the microphone to speak your query
- **Ask Question** — Dictate both title and description fields
- **FAQ search** — Voice-enabled FAQ filtering
- Real-time interim transcription with automatic finalization
- Graceful fallback for unsupported browsers

</td>
</tr>
<tr>
<td width="50%">

### 🔊 Text-to-Speech (TTS)
Built-in accessibility for content consumption:
- **Listen to any question** — One-tap playback on question cards
- **FAQ answers read aloud** — Audio playback for every FAQ entry
- Visual speaking indicator with stop/play toggle
- Uses native `SpeechSynthesis` API — zero external dependencies

</td>
<td width="50%">

### 🌐 Multi-Language Translation
Break language barriers with real-time translation:
- Translate questions and answers into **multiple languages**
- Seamless inline translation UI
- Supports global user communities
- Powered by translation API integration

</td>
</tr>
<tr>
<td width="50%">

### 🔍 Type-Ahead Autocomplete
Instant search suggestions as you type:
- Real-time query predictions from existing questions
- Reduces search time and improves discoverability
- Keyboard-navigable suggestion dropdown
- Powered by fuzzy matching with **Fuse.js**

</td>
<td width="50%">

### 🚩 Content Flagging
Community-driven content moderation:
- **Flag inappropriate questions or answers** for admin review
- Flag reasons include: spam, offensive, off-topic, duplicate
- Flagged content enters the **admin moderation queue**
- Keeps the community safe and professional

</td>
</tr>
<tr>
<td width="50%">

### 🧠 Smart Duplicate Detection
AI-powered question deduplication:
- **Fuse.js fuzzy matching** scans existing questions in real-time as you type
- Displays similarity scores and matching questions before submission
- Users can "View Existing Answers" or choose to "Ask Anyway"

</td>
<td width="50%">

### 🚫 Heuristic Spam Detector
Automatic content quality filtering:
- Scans for repeated characters, excessive URLs, promotional keywords, and ALL-CAPS
- Flagged answers are **auto-redirected** to admin moderation queue as `spam`
- Zero false positive tolerance with multi-signal heuristic scoring

</td>
</tr>
<tr>
<td width="50%">

### 🔮 Client-Side AI Summarizer
100% free, privacy-first NLP summaries:
- Extractive NLP algorithm runs **entirely in-browser** in under 5ms
- Sentence frequency scoring with stop-word filtering
- Extracts top 2 key insights from long answers (350+ characters)
- Rendered in a collapsible `✨ AI Sparkle Summary` glassmorphic drawer

</td>
<td width="50%">

### 🎨 Obsidian & Paper Theme System
Cinematic dual-theme experience:
- **Obsidian Dark** — Deep dark mode with cosmic particle backdrops
- **Paper Light** — Pristine light mode with subtle gradients
- localStorage-persisted theme preference
- Spring-physics page transitions via Framer Motion
- Self-drawing SVG toast notifications

</td>
</tr>
</table>

---

## 🏆 Reputation & Badge System

### Point System

| Action | Points |
|:-------|-------:|
| Ask a Question | **+5** |
| Post an Answer | **+10** |
| Answer Gets Upvoted | **+10** |
| Question Gets Upvoted | **+5** |
| Accepted Answer | **+30** |
| Daily Login | **+2** |
| Downvote Received | **-2** |

### Badge Tiers

<table>
<tr>
<td width="33%" align="center">

#### 🥉 Bronze Badges
**Beginner Contributor** — 10 pts<br/>
**First Question** — Ask your first question<br/>
**First Answer** — Post your first answer

</td>
<td width="33%" align="center">

#### 🥈 Silver Badges
**Knowledge Sharer** — 100 pts<br/>
**10 Accepted Answers**<br/>
**Helpful Member**

</td>
<td width="33%" align="center">

#### 🥇 Gold Badges
**Expert Contributor** — 500 pts<br/>
**50 Upvotes Received**<br/>
**Problem Solver**

</td>
</tr>
</table>

### 🌟 Special Badges

| Badge | Criteria |
|:------|:---------|
| 👑 **Community Leader** | Top reputation holder in the community |
| 🔥 **Top Contributor of the Month** | Most active contributor in the current month |
| 🚀 **Fast Responder** | Consistently answers within minutes |
| 💡 **Innovation Guru** | Answers with highest quality ratings |

### 🎯 Progress Tracker

Visual progress bars show users how close they are to their next badge:

```
Knowledge Sharer Badge
████████░░ 80/100 Points

Expert Contributor Badge
██░░░░░░░░ 120/500 Points
```

### 🔥 Leaderboard

Live rankings of top contributors displayed platform-wide:

```
🏅 1. Vishal Soni     1,250 pts   👑🥇🔥
🏅 2. Arnav             980 pts   🥇🥈
🏅 3. Aryan             870 pts   🥈🥈
🏅 4. Priya             650 pts   🥈
🏅 5. Rahul             420 pts   🥉
```

---

## ✅ Accepted Answer System

- Question owners can **mark one answer as the accepted answer**
- ✅ Green checkmark appears on the accepted answer
- Accepted answer is **pinned to the top** of the answer list
- The answerer receives **+30 reputation points**
- Improves content discoverability for future visitors

---

## 📈 User Profile Dashboard

Every registered user gets a comprehensive profile showcasing:

| Metric | Description |
|:-------|:------------|
| 🏆 **Total Reputation** | Cumulative reputation points earned |
| 🎖️ **Badges Earned** | All bronze, silver, gold, and special badges |
| ❓ **Questions Asked** | Total questions submitted |
| 💬 **Answers Posted** | Total answers contributed |
| ✅ **Accepted Answers** | Number of answers marked as accepted |
| 📊 **Ranking Position** | Current leaderboard position |

| 🎯 **Progress to Next Badge** | Visual progress bar |

---

## 🏗️ Architecture

### System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT (SPA)                             │
│   React 19 · Vite 8 · Tailwind CSS v4 · Framer Motion 12        │
├────────┬────────┬────────┬────────┬────────┬────────┬────────────┤
│  Auth  │Question│ Answer │ Search │ Voice  │Translation│
│Context │  Hook  │  Hook  │  Hook  │STT/TTS │  Engine   │
├────────┴────────┴────────┴────────┴────────┴───────────┤
│  Reputation Engine · Badge System · Leaderboard                  │
├──────────────────────────────────────────────────────────────────┤
│               Supabase JS Client (v2.106+)                       │
│              ┌──────────┬──────────┬──────────┐                  │
│              │   Auth   │ Database │ Storage  │                  │
│              │  (JWT)   │ (REST)   │ (S3-API) │                  │
└──────────────┴──────────┴──────────┴──────────┴──────────────────┘
                            │
┌───────────────────────────┴──────────────────────────────────────┐
│                      SUPABASE BACKEND                            │
│   PostgreSQL · Row-Level Security · Edge Functions · Realtime    │
├──────────────────────────────────────────────────────────────────┤
│   8+ Tables · 5+ RPC Functions · 16+ RLS Policies · 9+ Indexes  │
│   Cascade Deletes · Composite Constraints · Auto Triggers        │
└──────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
cs44-main/
├── .env.example
├── .gitignore
├── eslint.config.js
├── index.html
├── package-lock.json
├── package.json
├── PROJECT_STRUCTURE.md
├── README.md
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── supabase/
│   ├── .gitignore
│   ├── config.toml
│   ├── migration.sql
│   ├── schema.sql
│   └── schema_flagging.sql
└── src/
    ├── App.jsx
    ├── index.css
    ├── initOrt.js
    ├── main.jsx
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── config/
    │   └── supabase.js
    ├── contexts/
    │   ├── AuthContext.jsx
    │   ├── NotificationContext.jsx
    │   └── ThemeContext.jsx
    ├── hooks/
    │   ├── useAdmin.js
    │   ├── useAnswers.js
    │   ├── useAuth.js
    │   ├── useCategories.js
    │   ├── useFileUpload.js
    │   ├── useFlags.js
    │   ├── useNotifications.js
    │   ├── useQuestions.js
    │   ├── useSearch.js
    │   ├── useSpeechToText.js
    │   ├── useTextToSpeech.js
    │   ├── useTranslation.js
    │   ├── useTypeahead.js
    │   └── useUpvote.js
    ├── lib/
    │   ├── duplicateDetector.js
    │   ├── embeddingUtils.js
    │   ├── fuzzySearch.js
    │   ├── searchVoiceAnswer.js
    │   ├── spamDetector.js
    │   ├── spamDetector.test.js
    │   └── translationService.js
    ├── pages/
    │   ├── AdminDashboard.jsx
    │   ├── AskQuestionPage.jsx
    │   ├── FaqPage.jsx
    │   ├── ForgotPasswordPage.jsx
    │   ├── HomePage.jsx
    │   ├── LeaderboardPage.jsx
    │   ├── LoginPage.jsx
    │   ├── ModerationQueue.jsx
    │   ├── NotFoundPage.jsx
    │   ├── ProfilePage.jsx
    │   ├── QuestionDetailPage.jsx
    │   ├── SearchPage.jsx
    │   └── SignupPage.jsx
    └── components/
        ├── admin/
        │   ├── BulkActions.jsx
        │   ├── MetricsCards.jsx
        │   ├── ModerationActions.jsx
        │   └── ModerationTable.jsx
        ├── answers/
        │   ├── AnswerCard.jsx
        │   ├── AnswerForm.jsx
        │   └── AnswerList.jsx
        ├── auth/
        │   ├── ForgotPassword.jsx
        │   ├── LoginForm.jsx
        │   ├── ProtectedRoute.jsx
        │   └── SignupForm.jsx
        ├── layout/
        │   ├── Footer.jsx
        │   ├── Layout.jsx
        │   ├── Navbar.jsx
        │   └── Sidebar.jsx
        ├── notifications/
        │   ├── NotificationBell.jsx
        │   └── NotificationPanel.jsx
        ├── questions/
        │   ├── CategoryPills.jsx
        │   ├── DuplicateWarning.jsx
        │   ├── QuestionCard.jsx
        │   ├── QuestionFeed.jsx
        │   └── QuestionForm.jsx
        ├── search/
        │   ├── SearchBar.jsx
        │   ├── SearchResults.jsx
        │   └── TrendingSearches.jsx
        ├── translation/
        │   ├── LanguageSelector.jsx
        │   ├── TranslationBadge.jsx
        │   └── TranslationButton.jsx
        └── ui/
            ├── Avatar.jsx
            ├── BackToTop.jsx
            ├── Badge.jsx
            ├── BadgeUnlockModal.jsx
            ├── badgeIcons.js
            ├── Button.jsx
            ├── Card.jsx
            ├── EmptyState.jsx
            ├── FilePreview.jsx
            ├── Input.jsx
            ├── Modal.jsx
            ├── ReportModal.jsx
            ├── Skeleton.jsx
            ├── SpamFeedback.jsx
            ├── ThemeToggle.jsx
            ├── Toast.jsx
            └── Tooltip.jsx
```

---

## 💻 Technology Stack

| Layer | Technology | Version | Purpose |
|:------|:-----------|:--------|:--------|
| **Frontend Framework** | React | 19 | Component architecture with hooks |
| **Build Tool** | Vite | 8 | Lightning-fast HMR and optimized production builds |
| **Styling** | Tailwind CSS | v4 | CSS-first utility engine with design tokens |
| **Animations** | Framer Motion | 12 | Spring-physics transitions & micro-interactions |
| **Icons** | Lucide React | 1.17 | Consistent, tree-shakeable icon library |
| **Forms** | React Hook Form | 7 | Performant form state management |
| **Routing** | React Router | 7 | Client-side navigation with route guards |
| **Backend & DB** | Supabase | PostgreSQL | Auth, Database, Storage, Realtime |
| **Search Engine** | Fuse.js | 7 | Client-side fuzzy matching & similarity scoring |
| **Voice Input** | Web Speech API | Native | Browser speech-to-text recognition |
| **Audio Output** | SpeechSynthesis API | Native | Browser text-to-speech playback |
| **AI/NLP Engine**| Transformers.js (@xenova/transformers)	|v2|Client-side AI summary generation|

---

## 🗄️ Database Schema

The PostgreSQL database is organized into **8+ core tables** with strict relational constraints, Row-Level Security (RLS) policies, and cascade delete rules:

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│    auth.users     │────▶│      users       │     │    categories    │
│  (Supabase Auth)  │     │  id, name, email │     │  id, name, icon  │
└──────────────────┘     │  role, avatar    │     └────────┬─────────┘
                          │  reputation, rank │              │
                          └───────┬──────────┘              │
                                  │                         │
                    ┌─────────────┼─────────────────────────┘
                    │             │
              ┌─────▼─────────────▼──────┐
              │        questions          │
              │  id, title, description   │
              │  category, tags, views    │
              │  upvotes, attachment_url  │
              │  flags                    │
              └──────┬───────────┬───────┘
                     │           │
        ┌────────────▼──┐  ┌────▼───────────────┐
        │    answers     │  │ question_upvotes   │
        │  id, content   │  │ question_id,       │
        │  verification  │  │ user_id (PK)       │
        │  is_accepted   │  └────────────────────┘
        │  admin_note    │
        └──────┬─────────┘
               │
        ┌──────▼─────────────┐     ┌──────────────────┐
        │  answer_upvotes    │     │   notifications   │
        │  answer_id,        │     │  id, user_id,     │
        │  user_id (PK)      │     │  message, is_read │
        └────────────────────┘     └──────────────────┘

        ┌──────────────────────┐
        │  search_analytics    │
        │  id, search_term,    │
        │  user_id, created_at │
        └──────────────────────┘
```

### Key Database Features

| Feature | Implementation |
|:--------|:---------------|
| **Auto User Profiles** | Database trigger on `auth.users` INSERT automatically creates a `public.users` row |
| **Cascade Deletes** | Deleting a question removes all associated answers, upvotes, and notifications |
| **Duplicate Vote Prevention** | Composite primary keys on upvote tables enforce one-vote-per-user |
| **Trending Analytics** | RPC function `get_trending_searches()` returns top 10 search terms from the past 7 days |
| **Toggle Upvotes** | RPC functions atomically insert/delete upvote records and update counters |
| **16+ RLS Policies** | Fine-grained row-level security ensuring users only access authorized data |
| **Reputation Tracking** | Points calculated from user actions and stored for leaderboard rankings |


---

## 🎙️ Voice & Accessibility Features

### Speech-to-Text (Voice Search / Voice Chat)

The `useSpeechToText` hook wraps the native **Web Speech Recognition API** to provide hands-free voice input across the platform:

| Feature | Details |
|:--------|:--------|
| **Continuous Recognition** | Keeps listening until manually stopped |
| **Interim Results** | Shows real-time transcription as you speak |
| **Multi-Language** | Defaults to `en-US`, configurable via `lang` parameter |
| **Error Recovery** | Graceful handling of microphone permission errors |
| **Used In** | Search bar, Ask Question (title + description), FAQ search |

### Text-to-Speech (Read Aloud)

The `useTextToSpeech` hook uses the native **SpeechSynthesis API** for audio content playback:

| Feature | Details |
|:--------|:--------|
| **One-Tap Playback** | Single button to play/stop on any content |
| **Unique Tracking** | Each content item has a unique speech ID to track active playback |
| **Auto Cleanup** | Speech synthesis is cancelled on component unmount |
| **Used In** | Question cards, FAQ answer panels |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Minimum Version |
|:------------|:----------------|
| **Node.js** | v18+ |
| **npm** | v9+ |
| **Supabase Account** | [Free Tier](https://supabase.com) |

### Installation

**1. Clone & Install**

```bash
git clone https://github.com/vicharanashala/cs44
cd cs44-main
npm install

NOTE
During npm install, the NLP dependency @xenova/transformers is installed. The first time a user generates an AI answer summary, the browser will automatically fetch and cache the required model (Xenova/all-MiniLM-L6-v2) locally.
```

**2. Database Setup**

1. Create a new project on the [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor** → **New Query** → **Blank Query**
3. Copy the entire contents of [`supabase/schema.sql`](supabase/schema.sql) and paste into the editor, then click **Run** to set up the core Q&A platform schema, triggers, RLS policies, indexes, and seed data.
4. Open another new query tab, copy the entire contents of [`supabase/migration.sql`](supabase/migration.sql) and click **Run** to set up the Reputation, Badge, and Leaderboard triggers, RPC functions, and achievement definitions.
5. In your Supabase Dashboard, go to **Database** → **Replication** → **Source** (select tables), and enable **Realtime** for `reputation_logs` and `user_badges` so points notifications and badge unlock popups trigger instantly in real-time.

**3. Storage Configuration**

1. In the Supabase Dashboard, go to **Storage**
2. Click **New Bucket** → name it `attachments`
3. Toggle **Public Bucket** to **ON** → Click **Create**

**4. Environment Configuration**

```bash
cp .env.example .env
```

Update `.env` with your Supabase project credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**5. Launch Development Server**

```bash
npm run dev
```

Open [**http://localhost:5173**](http://localhost:5173) in your browser.

**6. Production Build**

```bash
npm run build
npm run preview     # Preview the production build locally
```

---

## 🔑 Admin Dashboard Setup

To activate the admin moderation dashboard:

1. **Create an account** on the running application via Sign Up
2. Open the **Supabase Dashboard** → **Table Editor** → `users` table
3. Locate your user row and change the `role` column from `user` to `admin`
4. **Refresh your browser** — the **Admin** link will appear in the navigation bar

### Admin Capabilities

| Capability | Description |
|:-----------|:------------|
| 📊 **Platform Metrics** | Total questions, answers, pending reviews, user counts, and reputation stats |
| ✅ **Bulk Moderation** | Approve, reject, or flag multiple answers at once |
| 🗑️ **Question Deletion** | Delete any question with premium animated confirmation dialogs |
| 🚩 **Flag Review Queue** | Review and resolve community-flagged content |
| 📝 **Admin Notes** | Attach feedback notes to reviewed answers |
| 🔔 **Auto-Notifications** | Authors are notified of verification decisions in real-time |
| 🏆 **Reputation & Badges** | Perform manual point adjustments (+/-), manually award or revoke badges for any member via an interactive management modal, and view live Leaderboard Analytics and recent reputation log feeds. |

---

## 🎯 Complete Feature Summary

| # | Feature | Description |
|:-:|:--------|:------------|
| 1 | 🔐 Role-Based Access Control | Guest, User, and Admin permission tiers |
| 2 | 🛡️ Moderated Answer Pipeline | Admin-verified answers with 4-state workflow |
| 3 | 🏆 Reputation System | Points for actions (ask, answer, upvote, accepted) |
| 4 | 🎖️ Badge System | Bronze, Silver, Gold, and Special achievement badges |
| 5 | 🔥 Leaderboard | Live rankings of top contributors |
| 6 | ✅ Accepted Answers | Question owners mark the best answer (+30 pts) |
| 7 | 📈 Progress Tracker | Visual progress bars toward next badge |
| 8 | 🎙️ Voice Search (Voice Chat) | Hands-free voice input across the platform |
| 9 | 🔊 Text-to-Speech | Listen to questions and FAQ answers |
| 10 | 🌐 Translation | Multi-language translation for questions & answers |
| 11 | 🔍 Type-Ahead | Autocomplete search suggestions as you type |
| 12 | 🚩 Content Flagging | Flag inappropriate questions or answers |
| 13 | 🧠 Duplicate Detection | Fuse.js fuzzy matching with similarity scores |
| 14 | 🚫 Spam Detector | Heuristic auto-flagging of spam content |
| 15 | 🔮 AI Summarizer | Client-side NLP extractive summaries |
| 16 | 📎 File Attachments | Upload images and documents to questions/answers |
| 17 | 🔔 Real-Time Notifications | In-app notification bell with live updates |
| 18 | 🎨 Obsidian & Paper Themes | Cinematic dark/light theme system |
| 19 | ✨ Spring-Physics Animations | Framer Motion transitions & micro-interactions |
| 20 | 🌌 Cosmic Particle Backdrops | Floating particle emitter with ambient nebulas |

---

## 👥 Team & Contributions

|
 Name of Member 
|
 Contributions 
|
|
:---
|
:---
|
|
**
Pinjar Ayesha Anjuma
**
 [Team Lead] 
|
 Team coordination, Multilingual Translation 
|
|
**
Atul Mishra
**
|
 Type-Ahead Autocomplete 
|
|
**
Vishal Soni
**
|
 Database Architect, Reputation and badge system 
|
|
**
Harsh Kumar
**
|
 Smart Duplicate Detection 
|
|
**
Sunnam Durga Malleshwari
**
|
 Heuristic Spam Detector 
|
|
**
Devendra Sagar
**
|
 Content Flagging 
|
|
**
Harsh Aggarwal
**
|
 Conceptual data modeling, Question count Updation 
|
|
**
Dikshya Soni
**
|
 Voice Search (Voice Chat) 
|
|
**
Ansuman Dash
**
|
 Design collaborator 
|
|
**
Golu Kumar
**
|
 Strategic Stakeholder 
|
|
**
Bandarapu Ushaswini
**
|
 Quality Assurance 
|
---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "feat: add amazing feature"`
4. **Push** to the branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

<br />

**Built with ❤️ for knowledge-sharing communities**

<br />

[![GitHub Stars](https://img.shields.io/github/stars/sonivishal66666/Answerhub?style=social)](https://github.com/sonivishal66666/Answerhub)
[![GitHub Forks](https://img.shields.io/github/forks/sonivishal66666/Answerhub?style=social)](https://github.com/sonivishal66666/Answerhub)

</div>
