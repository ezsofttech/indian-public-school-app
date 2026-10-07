# Indian Public School (`indian-public-school-app`)

Web Application for **Indian Public School (IPS)**, built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Radix UI (Shadcn UI), React Hook Form, Zod, and interactive WhatsApp Helpdesk.

---

## Comprehensive Documentation & Presentation

For a complete breakdown of project requirements, SDLC phases, Agile sprint framework, dynamic routing architecture, Radix UI design system, hybrid data pipeline, and developer guidelines:

 **[Comprehensive SDLC & Developer Architecture Guide](documents/DEVELOPER_GUIDE.md)**  
 **[Interactive HTML Architecture Deck](documents/architecture-presentation.html)**  
 **[Downloadable Presentation PDF](documents/architecture-presentation.pdf)**

---

## SDLC & Agile Implementation Summary

* **Phase 1: Requirements & User Stories Discovery** (Admissions, Academic programs, Campus news, Gallery albums, Faculty applications)
* **Phase 2: Architecture & Design System** (Next 16 App Router, Tailwind v4, Radix UI primitives, `lib/site-data.ts` hybrid data fallback pipeline)
* **Phase 3: 5 Agile Sprints Execution** (Framework setup `->` Public School Portal `->` Admissions & Media `->` Helpdesk & Admin CMS `->` SEO & Performance QA)
* **Phase 4: Validation & Testing** (Form validation pipes via React Hook Form + Zod, strict TypeScript check)
* **Phase 5: Production Deployment & Performance Optimization**

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
