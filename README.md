# TutorMe 🎓🤖

> **AI-Powered Personal Active Learning Tutor**  
> *Stop passive learning, start active practice.*

![TutorMe Banner](frontend/public/robot-logo.svg)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![OpenAI Codex](https://img.shields.io/badge/Built%20with-OpenAI%20Codex-blue.svg)](https://openai.com/)
[![Track: Education](https://img.shields.io/badge/OpenAI%20Build%20Week-Education-pink.svg)](https://openai.devpost.com/)

---

## 📌 Short Repository Description (About Section)

> **TutorMe** is a fullstack AI-powered personal tutor platform that turns passive content consumption into active, bite-sized practice. Features automated course roadmaps, interactive lesson quizzes, real-time AI essay grading, and an aesthetic pastel graph-paper notebook UI. Built with React, ElysiaJS, Prisma, and OpenAI GPT-5.6, accelerated by **OpenAI Codex**.

---

## 🚀 Key Features

- 🗺️ **AI Curriculum & Roadmap Generator:** Enter any learning topic and GPT-5.6 generates a structured, step-by-step roadmap from beginner to advanced modules.
- ⏱️ **Integrated Pomodoro Study Timer:** Embedded study clock inside lessons to prevent burnout.
- 📝 **Active Lesson Quizzes:** Automated per-lesson quizzes with multiple-choice questions and open-ended essay prompts.
- 🤖 **Real-Time AI Essay Evaluation:** GPT-5.6 acts as an empathetic tutor, evaluating student essay answers and offering actionable feedback.
- 📊 **Progress & Analytics Dashboard:** Visual progress tracking and saved course management in a personal library.
- 🎨 **Pastel Graph-Paper Notebook UI:** A comforting, hand-drawn doodle aesthetic with washi-tape accents and custom SVG mascot components.

---

## 🤖 Built with OpenAI Codex & GPT-5.6

**TutorMe** was built during the **OpenAI Build Week Hackathon**, leveraging **OpenAI Codex** as our primary autonomous AI coding partner.

### Highlights of Codex Integration:
1. **Prisma Database Architecture:** Codex engineered our relational schema (`schema.prisma`), handling `User`, `Course`, `LessonProgress`, `ExamSubmission`, and canonical uniqueness constraints.
2. **ElysiaJS Backend Scaffolding:** Codex built our 4-layer backend architecture (`schema`, `service`, `controller`, `route`) across 10 domain models.
3. **Frontend Integration:** Codex accelerated React state management, Vercel AI SDK streaming endpoints, and custom SVG doodle components.

---

## 🛠️ Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Lucide Icons, Vite
- **Backend:** ElysiaJS, Node.js / Bun, TypeScript
- **Database & ORM:** MySQL, Prisma ORM
- **AI & ML:** OpenAI GPT-5.6, Vercel AI SDK, OpenAI Codex

---

## ⚡ Quick Start & Setup Guide

### Prerequisites
- [Bun](https://bun.sh/) (v1.0+) or [Node.js](https://nodejs.org/) (v20+)
- MySQL Database

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/tutorme.git
cd tutorme
```

### 2. Backend Setup
```bash
cd backend
bun install

# Configure Environment Variables
cp .env.example .env
# Edit .env to add your DATABASE_URL and OPENAI_API_KEY

# Push Prisma Schema & Seed Database
bunx prisma db push

# Start Backend Development Server
bun run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install

# Start Frontend Development Server
npm run dev
```

Open `http://localhost:5173` in your browser to start learning!

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
