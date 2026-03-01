# 🏗️ ARQUITETURA PRODUCTION - VISUAL OVERVIEW

```
┌─────────────────────────────────────────────────────────────┐
│                    CROMOMETRO IN PRODUCTION                 │
└─────────────────────────────────────────────────────────────┘

                          USERS
                            ↓
        ┌───────────────────┴───────────────────┐
        │                                       │
        ↓                                       ↓
   BROWSER                                  MOBILE
   (Vercel)                                (Vercel CDN)
        │                                       │
        └───────────────────┬───────────────────┘
                            │
        ┌───────────────────↓───────────────────┐
        │                                       │
        │         cromometro.tk (Vercel)       │
        │      (Next.js Frontend CDN)          │
        │      - Dashboard                     │
        │      - Projects/Tasks                │
        │      - Time Entries                  │
        │      - Reports                       │
        │                                       │
        └───────────────────┬───────────────────┘
                            │
              ┌─────────────↓─────────────┐
              │  CORS Allowed Domain      │
              │  https://cromometro.tk    │
              └─────────────┬─────────────┘
                            │
        ┌───────────────────↓───────────────────┐
        │                                       │
        │    api.cromometro.tk (Railway)       │
        │     (NestJS Backend - Secure)        │
        │                                       │
        │  Routes:                             │
        │  ├─ /auth (JWT + Cookies)            │
        │  ├─ /projects (CRUD)                 │
        │  ├─ /tasks (CRUD)                    │
        │  ├─ /time-entries (CRUD)             │
        │  ├─ /reports (Analytics)             │
        │  ├─ /admin (Dashboard)               │
        │  ├─ /documents (Upload)              │
        │  └─ /monitoring (Health/Metrics)     │
        │                                       │
        │  Security:                           │
        │  ├─ Helmet (CSP, HSTS)               │
        │  ├─ Rate Limiting                    │
        │  ├─ CORS Restriction                 │
        │  ├─ httpOnly Cookies                 │
        │  └─ JWT Signing                      │
        │                                       │
        └───────────────────┬───────────────────┘
                            │
        ┌───────────────────↓───────────────────┐
        │                                       │
        │      PostgreSQL 15 (Railway)         │
        │                                       │
        │  ├─ Users table                      │
        │  ├─ Projects table                   │
        │  ├─ Tasks table                      │
        │  ├─ Time Entries table               │
        │  ├─ Documents table                  │
        │  ├─ Audit Logs table                 │
        │  └─ Refresh Tokens table             │
        │                                       │
        │  Backups:                            │
        │  ├─ Daily (14 days)                  │
        │  ├─ Weekly (8 weeks)                 │
        │  └─ Monthly (6 months)               │
        │                                       │
        └───────────────────┬───────────────────┘
                            │
        ┌───────────────────↓───────────────────┐
        │                                       │
        │         Mailtrap (Email)             │
        │     (SMTP live.smtp.mailtrap.io)    │
        │                                       │
        │  Email Types:                        │
        │  ├─ Registration (with code)         │
        │  ├─ Password Reset                   │
        │  ├─ 2FA Code                         │
        │  ├─ Email Change Verification       │
        │  └─ Admin Notifications              │
        │                                       │
        │  Free Tier: 100 emails/month         │
        │                                       │
        └───────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                       DOMAIN (Freenom)                       │
│                                                              │
│  cromometro.tk                                              │
│  ├─ Points to Vercel CDN (Frontend)                         │
│  └─ api.cromometro.tk → Railway Backend                     │
│                                                              │
│  DNS Nameservers: Vercel (ns1/ns2.vercel.com)               │
│  SSL: Auto-managed by Vercel + Railway                      │
│  Free for 12 months                                         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      DEPLOYMENTS                             │
│                                                              │
│  GitHub (Main Branch)                                       │
│  ├─ Vercel: Auto-deploy on push                            │
│  └─ Railway: Auto-deploy on push                           │
│                                                              │
│  Build Process:                                             │
│  Railway:  npm run build + npx prisma migrate deploy        │
│  Vercel:   npm run build (Next.js)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     MONITORING & LOGS                        │
│                                                              │
│  Railway Dashboard:                                         │
│  ├─ Deployments (auto-redeploy on error)                   │
│  ├─ Logs (JSON structured + file rotation)                 │
│  ├─ Metrics (CPU, Memory, Network)                         │
│  ├─ Health Checks (/monitoring/health)                     │
│  └─ Database Backups (automated)                           │
│                                                              │
│  Vercel Dashboard:                                          │
│  ├─ Build Logs                                              │
│  ├─ Analytics (Core Web Vitals)                            │
│  ├─ Deployments                                            │
│  └─ Custom Domain Status                                   │
│                                                              │
│  Mailtrap Dashboard:                                        │
│  ├─ Inbox (all emails sent)                                │
│  ├─ Email Logs (delivery status)                           │
│  └─ SMTP Settings (integration)                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
│                                                              │
│  Layer 1: HTTPS/TLS (Railway + Vercel SSL)                 │
│           ↓                                                  │
│  Layer 2: Helmet Security Headers (CSP, HSTS, etc)         │
│           ↓                                                  │
│  Layer 3: Rate Limiting (15 req/min per IP)                │
│           ↓                                                  │
│  Layer 4: CORS Restriction (cromometro.tk only)            │
│           ↓                                                  │
│  Layer 5: Authentication (JWT + Refresh Tokens)            │
│           ↓                                                  │
│  Layer 6: httpOnly Cookies (XSS protection)                │
│           ↓                                                  │
│  Layer 7: Database (Prisma ORM - SQL injection prevention) │
│           ↓                                                  │
│  Layer 8: Password Hashing (bcrypt)                        │
│                                                              │
│  Audit Trail:                                               │
│  - All auth events logged                                   │
│  - Admin actions tracked                                    │
│  - File rotation (app, error, auth, security logs)         │
│                                                              │
└─────────────────────────────────────────────────────────────┘

```

---

## 📊 DATA FLOW EXAMPLES

### 1. USER REGISTRATION
```
Frontend (Register Page)
  ↓
  POST /auth/register (email, password)
  ↓
Backend (NestJS)
  ├─ Hash password (bcrypt)
  ├─ Save to PostgreSQL
  ├─ Generate verification code
  └─ Send email (Mailtrap)
  ↓
User Email (from Mailtrap)
  ├─ Click verification link
  ├─ POST /auth/verify-email
  └─ Account activated
  ↓
Frontend (Redirect to login)
```

### 2. USER LOGIN
```
Frontend (Login Page)
  ↓
  POST /auth/login (email, password)
  ↓
Backend (NestJS)
  ├─ Verify password (bcrypt.compare)
  ├─ Generate JWT access token (24h)
  ├─ Generate refresh token (30 days)
  ├─ Set httpOnly cookies
  └─ Log auth event
  ↓
Frontend (Receives cookies, stores)
  ├─ Reads session_user_id cookie
  ├─ Reads session_role cookie
  └─ Redirects to dashboard
  ↓
All subsequent requests
  ├─ Sends cookies automatically (credentials: 'include')
  ├─ Backend validates JWT from cookie
  └─ Request proceeds
```

### 3. CREATE TIME ENTRY
```
Frontend (Dashboard)
  ↓
  POST /time-entries (date, hours, description)
  + Cookie: access_token (JWT)
  ↓
Backend (Middleware)
  ├─ Extract JWT from cookie
  ├─ Verify signature (JWT_SECRET)
  ├─ Extract user_id
  └─ Attach to request.user
  ↓
Backend (Route Handler)
  ├─ Create time entry in PostgreSQL
  ├─ Associate with user_id
  ├─ Log to audit_logs
  └─ Return 201 Created
  ↓
Frontend (Real-time update)
  └─ Refresh time entries list
```

### 4. SEND EMAIL (Registration)
```
Backend (Auth Service)
  ├─ Generate verification code
  ├─ Create email template (Handlebars)
  └─ Queue email
  ↓
Email Service (Nodemailer)
  ├─ Connect to Mailtrap SMTP
  │  SMTP Host: live.smtp.mailtrap.io:587
  │  Auth: api:MAILTRAP_TOKEN
  │
  ├─ Send email from: noreply@cromometro.tk
  ├─ Send to: user@example.com
  └─ Body: Compiled Handlebars template
  ↓
Mailtrap (live.smtp.mailtrap.io)
  ├─ Receive email
  ├─ Log in inbox (visible in dashboard)
  └─ Would send to real SMTP in prod
  ↓
Frontend Tester (Mailtrap.io dashboard)
  └─ View email content, verify templates
```

---

## 💾 DATABASE SCHEMA (Simplified)

```
PostgreSQL 15
├─ Users
│  ├─ id (UUID, PK)
│  ├─ email (unique)
│  ├─ password (hashed)
│  ├─ name
│  ├─ role (admin, user, intern)
│  ├─ emailVerified (boolean)
│  ├─ 2faEnabled (boolean)
│  ├─ createdAt
│  └─ updatedAt
│
├─ Projects
│  ├─ id (UUID, PK)
│  ├─ name
│  ├─ userId (FK → Users)
│  ├─ type (personal, collaborative)
│  ├─ createdAt
│  └─ updatedAt
│
├─ Tasks
│  ├─ id (UUID, PK)
│  ├─ title
│  ├─ projectId (FK → Projects)
│  ├─ status (todo, in_progress, done)
│  ├─ assignee (FK → Users, nullable)
│  ├─ createdAt
│  └─ updatedAt
│
├─ TimeEntries
│  ├─ id (UUID, PK)
│  ├─ userId (FK → Users)
│  ├─ taskId (FK → Tasks)
│  ├─ date
│  ├─ hours (decimal)
│  ├─ description
│  ├─ createdAt
│  └─ updatedAt
│
├─ RefreshTokens
│  ├─ id (UUID, PK)
│  ├─ userId (FK → Users)
│  ├─ token (hashed)
│  ├─ expiresAt
│  ├─ revokedAt (nullable)
│  └─ createdAt
│
├─ Documents
│  ├─ id (UUID, PK)
│  ├─ userId (FK → Users)
│  ├─ taskId (FK → Tasks, nullable)
│  ├─ fileName
│  ├─ fileSize
│  ├─ mimeType
│  ├─ uploadedAt
│  └─ createdAt
│
└─ AuditLogs
   ├─ id (UUID, PK)
   ├─ userId (FK → Users)
   ├─ action (string)
   ├─ resource (table name)
   ├─ details (JSON)
   └─ createdAt
```

---

## 🔄 DEPLOYMENT CYCLE

```
Developer (Samucahub)
  ↓
  git push origin main
  ↓
GitHub Webhook
  ├─ Notifies Vercel
  └─ Notifies Railway
  ↓
┌─────────────────────────────────────────┐
│ Parallel Deployments                    │
├─────────────────────────────────────────┤
│                                         │
│ Railway Backend                         │
│ ├─ Build: npm run build                 │
│ ├─ Migrate: npx prisma migrate deploy   │
│ ├─ Deploy container                     │
│ ├─ Health check                         │
│ └─ Status: Live (2-5 min)               │
│                                         │
│ Vercel Frontend                         │
│ ├─ Build: npm run build                 │
│ ├─ Build: next build                    │
│ ├─ Deploy static/serverless             │
│ └─ Status: Live (2-5 min)               │
│                                         │
└─────────────────────────────────────────┘
  ↓
Users see new version
  ├─ Frontend: Automatic (CDN invalidation)
  └─ Backend: Automatic (container restart)
```

---

## 💰 COST BREAKDOWN

```
┌──────────────┬──────────┬───────────┬────────────────┐
│ Service      │ Plan     │ Cost/mo   │ Status         │
├──────────────┼──────────┼───────────┼────────────────┤
│ Railway      │ Free Tier│ $0        │ $5 credit/mo   │
│              │ (Backend │           │ (cobre tudo)   │
│              │ + DB)    │           │                │
├──────────────┼──────────┼───────────┼────────────────┤
│ Vercel       │ Free     │ $0        │ Ilimitado      │
│              │ (Frontend│           │ (SSR OK)       │
│              │)         │           │                │
├──────────────┼──────────┼───────────┼────────────────┤
│ Freenom      │ .tk      │ $0        │ Grátis 12m     │
│              │ domain   │           │                │
├──────────────┼──────────┼───────────┼────────────────┤
│ Mailtrap     │ Free     │ $0        │ 100 e-mails/mo │
│              │ (Email)  │           │                │
├──────────────┼──────────┼───────────┼────────────────┤
│ TOTAL        │          │ $0        │ ✅ GRÁTIS     │
└──────────────┴──────────┴───────────┴────────────────┘

Após 12 meses (se continua):
├─ Freenom: Renova domínio (€0.99-2.99 se quiser premium)
├─ Railway: ~$10-15/mo (depende uso)
└─ TOTAL: ~$10-20/mo ainda bem barato
```

---

## ✅ READY FOR PRODUCTION

All systems operational:
- ✅ Frontend optimized (Next.js CDN)
- ✅ Backend secure (JWT + Helmet + Rate Limiting)
- ✅ Database replicated + backups automated
- ✅ Email service integrated
- ✅ Monitoring + Health checks
- ✅ GDPR compliance (data export, account deletion)
- ✅ Logging + Audit trail
- ✅ SSL/TLS encrypted everywhere
- ✅ Scalable free tier
- ✅ Zero upfront cost

---

**Ready to deploy? Open DEPLOY_QUICK_START.md and follow the checklist! 🚀**
