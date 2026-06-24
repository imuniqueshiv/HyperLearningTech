# 🚀 Hyper Learning V3

> An AI-powered academic learning platform designed to transform how students learn, revise, and prepare for examinations through intelligent content generation, syllabus-driven learning, previous year question analysis, and personalized AI assistance.

## ![Hyper Learning Hero Section](public/HyperLearningv3Hero.png)

## 🌟 Vision

Hyper Learning aims to become a modern educational ecosystem that bridges the gap between static academic resources and intelligent learning experiences.

Instead of simply providing question papers and notes, Hyper Learning helps students:

- Learn concepts topic-by-topic
- Explore AI-generated explanations
- Understand previous year examination trends
- Ask contextual follow-up questions
- Track academic progress
- Access structured learning paths

The long-term goal is to build a scalable learning platform where syllabus, notes, PYQs, revision material, and AI tutoring are deeply connected.

---

# ✨ Features

## 📚 Academic Content Management

- Subject-wise syllabus organization
- Unit-wise topic breakdown
- Topic-specific AI-generated notes
- Version-controlled content updates
- Related PYQ mapping

---

## 📝 Previous Year Questions (PYQs)

- Semester-wise paper collection
- Branch-wise categorization
- Subject-wise filtering
- Question-to-unit mapping
- Fast retrieval system

---

## 🤖 AI-Powered Learning

### AI Answer Generation

Generate structured answers for:

- 2 Mark Questions
- 5 Mark Questions
- 10 Mark Questions
- Long Answer Questions

---

### AI Learning Notes

Generate detailed notes for:

- Individual Topics
- Units
- Complete Subjects

---

### AI Tutor

Students can:

- Ask contextual follow-up questions
- Clarify doubts
- Request examples
- Simplify difficult concepts

---

## 🔖 Student Productivity

- Bookmarks
- Learning Progress Tracking
- Recently Viewed Topics
- Personalized Dashboard
- Saved Content

---

## 👨‍💼 Administration System

### Editor

Can:

- Upload Papers
- Edit Content
- Generate Notes
- Manage Academic Resources

### Owner

Can:

- Manage Editors
- Approve Applications
- Review Audit Logs
- Configure Platform Settings

---

## 🔍 Search System

Search across:

- Subjects
- Units
- Topics
- Notes
- PYQs

---

# 🏗️ System Architecture

```text
Students
    │
    ▼
Next.js Application
    │
 ┌──┼───────────────┐
 │  │               │
 ▼  ▼               ▼

PostgreSQL      Redis       Gemini
(Permanent)    (Cache)       (AI)

 │              │
 ▼              ▼

Topics      AI Answers
Notes       Chat Sessions
PYQs        Rate Limits
Users       Context Cache
```

---

# 🛠️ Tech Stack

## Frontend

- Next.js 16
- TypeScript
- Tailwind CSS v4
- ShadCN/UI
- Lucide Icons

---

## Authentication

- Clerk
- Role-Based Access Control (RBAC)
- Multi-Factor Authentication (MFA)

---

## Database

- PostgreSQL
- Prisma ORM

---

## Caching

- Redis
- Upstash Redis / Vercel KV

---

## Artificial Intelligence

- Google Gemini

---

## Storage

- Cloudinary
- Vercel Blob (Optional)

---

## Email Services

- Resend

---

## Monitoring

- Sentry

---

## Analytics

- PostHog

---

## Deployment

- Vercel
- Neon PostgreSQL

---

# 📂 Project Structure

```text
hyper-learning/

├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── prisma/
├── public/
├── types/
├── constants/
├── emails/
├── actions/
├── middleware.ts
├── next.config.ts
└── package.json
```

---

## Feature-Based Architecture

```text
features/

├── auth/
├── papers/
├── syllabus/
├── ai/
├── bookmarks/
├── progress/
├── search/
├── admin/
└── analytics/
```

---

# 🤖 AI Workflows

## PYQ Answer Generation

```text
Question
   │
   ▼
Redis Lookup
   │
   ├── Cache Hit
   │      │
   │      ▼
   │   Return Answer
   │
   └── Cache Miss
          │
          ▼
      Gemini
          │
          ▼
      Save Cache
          │
          ▼
      Return Answer
```

---

## Topic Note Generation

```text
Topic Click
    │
    ▼
PostgreSQL Lookup
    │
    ├── Exists
    │      │
    │      ▼
    │   Return Note
    │
    └── Missing
           │
           ▼
        Gemini
           │
           ▼
     Save Database
           │
           ▼
      Return Note
```

---

## AI Tutor

```text
Student Question
       │
       ▼
Redis Context
       │
       ▼
Gemini
       │
       ▼
Response
```

---

# 🔐 Security

## Authentication

- Clerk Authentication
- Secure Sessions
- MFA Support
- Protected Routes

---

## Authorization

Roles:

- Student
- Editor
- Owner

---

## Administrative Security

- Invitation-only editor accounts
- Owner approval workflow
- Audit logging
- Login notifications
- Role-based permissions

---

## Infrastructure Security

- Environment Variables
- Server-Side API Keys
- Protected AI Endpoints
- Rate Limiting
- Request Validation

---

# 🚀 Local Setup

## Clone Repository

```bash
git clone https://github.com/imuniqueshiv/HyperLearningTech.git
```

```bash
cd hyper-learning-tech
```

---

## Install Dependencies

```bash
npm install
```

---

## Setup Environment Variables

Create:

```bash
.env
```

---

## Run Development Server

```bash
npm run dev
```

---

Open:

```text
http://localhost:3000
```

---

# ⚙️ Environment Variables

```env
DATABASE_URL=

UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

GEMINI_API_KEY=

CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

```

---

# 🗺️ Roadmap

## Phase 1

- [ ] Next.js Migration
- [ ] PostgreSQL Integration
- [ ] Prisma ORM
- [ ] Clerk Authentication

---

## Phase 2

- [ ] Topic-Based Learning System
- [ ] AI Note Generation
- [ ] Topic Versioning
- [ ] Search System

---

## Phase 3

- [ ] AI Tutor
- [ ] Progress Tracking
- [ ] Bookmarks
- [ ] Personalized Dashboard

---

## Phase 4

- [ ] Admin Dashboard
- [ ] Paper Upload Pipeline
- [ ] OCR Processing
- [ ] Content Moderation

---

## Phase 5

- [ ] Advanced Analytics
- [ ] Recommendation Engine
- [ ] Multi-University Support
- [ ] Mobile Application

---

# 🤝 Contributing

Contributions are welcome.

You can contribute by:

- Improving UI/UX
- Fixing bugs
- Optimizing performance
- Improving documentation
- Adding new features
- Enhancing accessibility

### Contribution Process

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push your branch
5. Open a Pull Request

---

# 📜 License

This project is licensed under the MIT License.

See the LICENSE file for complete information.

---

# 👨‍💻 Maintainers

### Shiv Raj Singh

**Founder & Lead Developer**
Building Hyper Learning and leading product, AI, and platform development.

🔗 [LinkedIn](https://www.linkedin.com/in/shiv-raj-singh-387973299/) • [GitHub](https://github.com/imuniqueshiv)

### Nitin Pandey

**Frontend Developer**
Contributing to UI/UX design and frontend development.

🔗 [LinkedIn](https://www.linkedin.com/in/nitin-mohan-9251ab328/) • [GitHub](https://github.com/nitinmohan18)

### Ramoo Kachhee

**Community & Outreach Contributor**
Promoting Hyper Learning across student communities and social platforms.

🔗 [LinkedIn](https://www.linkedin.com/in/ramoo-kachhee-9b1616405/) • [GitHub](https://github.com/RamuuXfree)

---

⭐ If you find this project useful, consider starring the repository and contributing to its growth.
