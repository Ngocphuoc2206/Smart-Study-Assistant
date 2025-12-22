# 🎓 Smart Study Assistant
> **Smart Study Assistant** is an AI-powered study management system that allows students to create schedules, exams, assignments, and reminders using **Vietnamese natural language**, combining **NLP, LLMs, and rule-based logic**.

🔹 Conversational study assistant  
🔹 Designed for students  
🔹 Built with modern full-stack technologies  

---
## ⚙️ Installation & Run
### 1. Install dependencies
```bash
npm install
```
### 2. Create .env
```bash
PORT=
MONGODB_URI=
MONGODB_DBNAME=
JWT_SECRET=
JWT_ACCESS_EXPIRATION_TTL=
JWT_REFRESH_EXPIRATION_TTL=
MEGALLM_API_KEY=
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password
MAIL_FROM="Smart Study Assistant <your_email@gmail.com>"
```
### 3. Run development
```bash
npm run dev
```
- Frontend: http://localhost:3000

- Backend API: http://localhost:4001/api
---
## 🛠️ Tech Stack
```text
🔹Frontend

🔹Next.js 14 (App Router)

🔹React

🔹Axios (JWT + refresh token)

🔹Backend

🔹Node.js + Express

🔹TypeScript

🔹MongoDB + Mongoose

🔹Socket.io

🔹node-cron

🔹AI / NLP

🔹chrono-node (date & time parsing)

🔹Rule-based Vietnamese NLP

🔹LLM (OpenAI-compatible API – MegaLLM)
```
---
## 🚀 Features

- 🧠 Natural language input (Vietnamese)
- 📅 Create:
  - Classes / Lectures
  - Exams
  - Assignments / Deadlines
- ⏰ Smart reminders (minutes / hours / days / weeks)
- 💬 Multi-turn conversation (follow-up when missing information)
- 🔔 Notification channels:
  - In-app
  - Email
- ⚡ Realtime notifications (Socket.io)
- 🕒 Scheduled reminder delivery (Cron jobs)

---

## 🧩 Problem & Solution

### ❌ Problem
Students often struggle to:
- Manage multiple schedules and deadlines
- Quickly add events while studying
- Remember exams or assignments on time

### ✅ Solution
Smart Study Assistant enables users to:
- Add schedules by simply typing a sentence
- Automatically extract date, time, subject, and reminder
- Receive reminders before important events
- Interact naturally via chat instead of complex forms

---

## 🏗️ System Architecture
```bash
Frontend (Next.js)
↓
Chat UI → REST API
↓
Backend (Express + TypeScript)
↓
NLP Pipeline
├─ Intent Detection (LLM + Rule-based)
├─ Entity Extraction (chrono-node + VN NLP)
├─ Follow-up Logic
└─ Action Handler
↓
MongoDB + Cron + Socket
```
---
---

## 🧠 NLP Pipeline

```text
User Input
   ↓
Intent Detection
   ↓
Entity Extraction
   ↓
Missing Information?
   ├─ Yes → Ask follow-up question
   └─ No
        ↓
Create Event / Reminder
        ↓
User Confirmation
```
---
## 🧪 Sample Test Inputs
```bash
Thêm lịch thi Toán vào thứ 2 tuần sau lúc 9h sáng, nhắc trước 1 ngày
```

```bash
Đặt lịch kiểm tra Vật lý thứ 5 tuần sau lúc 14h, nhắc trước 2 giờ qua email
```

```bash
Nhắc trước 30 phút cho bài tập Toán
```
---

## 📌 Key Technical Highlights
- Designed a multi-step conversational NLP system

- Implemented Vietnamese date & reminder parsing

- Combined LLM-based intent detection + rule-based fallback

- Built robust reminder scheduling using offsets & cron jobs

- Handled timezone consistency (UTC vs local)

- Implemented JWT authentication with refresh token rotation
---
## 📂 Project Structure
```bash
Smart-Study-Assistant/
├── app/              # Frontend (Next.js)
├── worker/           # Backend (Express)
├── shared/           # Shared types & utilities
├── .env.example
└── README.md
```
---
