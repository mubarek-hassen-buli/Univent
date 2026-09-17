# Univent — University Event Management & Digital Certification Platform

<p align="center">
  <strong>An enterprise-grade, real-time university event management, cryptographic QR ticketing, live attendance verification, and automated certification platform.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/NestJS-11.0.1-E0234E?style=for-the-badge&logo=nestjs" alt="NestJS" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Neon_PostgreSQL-Serverless-00E599?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Drizzle_ORM-0.45.2-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle" />
  <img src="https://img.shields.io/badge/Pusher-WebSockets-6842FF?style=for-the-badge&logo=pusher" alt="Pusher" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
</p>

---

## 🌟 Overview

**Univent** replaces fragmented spreadsheets, manual attendance sign-in sheets, and decentralized messaging groups with a unified, high-concurrency university event ecosystem. 

From campus-wide hackathons and academic conferences to departmental workshops and club meetings, Univent manages the complete event lifecycle:
$$\text{Event Creation} \longrightarrow \text{Discovery} \longrightarrow \text{OCC Reservation} \longrightarrow \text{Cryptographic QR Pass} \longrightarrow \text{Live Camera Check-in} \longrightarrow \text{Verified PDF Certificates}$$

---

## 🚀 Core Features by Role

### 🎓 Student Portal
- **Discovery & Search**: Browse published university events with real-time seat tracking, category filtering, and online/in-person filters.
- **Race-Condition-Proof Booking**: Instant seat reservation powered by database-level **Optimistic Concurrency Control (OCC)** preventing overselling.
- **Cryptographic QR Event Pass**: Generates dynamic passes with tamper-proof HMAC-SHA256 QR codes. Supports both compact summary cards and full digital ticket passes with one-click **PNG Image Download**.
- **Ticket Self-Service**: Live pass cancellation with immediate seat replenishment.
- **Verified Credentials**: Automatically receives digital PDF certificates upon verified attendance, with instant download and ledger lookup.

### 🏢 Event Organizer Console
- **Lifecycle Management**: Create, edit, and schedule campus events with capacity limits, banners, locations, or virtual meeting links.
- **One-Click Event Visibility (Hide/Unhide)**: Instantly toggle whether an event is visible to students in the public catalog without altering its status.
- **Live Camera QR Attendance Scanner**: Built-in, high-speed camera scanner using `html5-qrcode`. Decodes and cryptographically verifies attendee QR tokens in milliseconds to prevent ticket duplication and pass sharing.
- **Turnout Analytics**: Track registration numbers, real-time check-in counts, and attendance rates.
- **Automated Certificate Issuance**: Issue cryptographically verifiable PDF certificates individually or in one-click batch mode to all attendees who checked in.

### 🛡️ Platform Command Center (System Admin)
- **Telemetry & Telemetry Dashboard**: Real-time platform health monitoring total users, organizers, students, turnout rate, category popularity, and verified credential issuance.
- **Platform Event Directory**: Centralized, read-only audit log of all events across organizers, departments, and statuses (Draft, Published, Completed, Cancelled, and Visibility states).
- **User Management Directory**: Provision new accounts (`student`, `organizer`, `admin`), filter directory by role, live search, and safely delete accounts with cascading referential integrity.
- **Public Verification Ledger**: Public route (`/verify/[code]`) allowing employers, academic institutions, and students to verify issued certificates.

---

## 🔒 Security & Concurrency Architecture

1. **Optimistic Concurrency Control (OCC)**:
   - High-demand events utilize version-check mutations (`UPDATE events SET registered_count = registered_count + 1, version = version + 1 WHERE id = $id AND version = $v AND registered_count < capacity`) to eliminate race conditions without database deadlocks.
2. **Cryptographic QR Tokens**:
   - QR payloads are signed with an HMAC-SHA256 signature containing event ID, registration ID, user ID, and timestamp:
     $$\text{QR\_Hash} = \text{HMAC-SHA256}(K, \text{registrationId} : \text{eventId} : \text{userId} : \text{timestamp})$$
   - Prevents ticket forgery, screen-capture spoofing, and unauthorized modifications.
3. **Role-Based Access Control (RBAC)**:
   - Protected by NestJS Guards (`AuthGuard`, `RolesGuard`) and custom decorators (`@Roles('student', 'organizer', 'admin')`, `@CurrentUser()`).
4. **Real-Time WebSocket Synchronization (Pusher)**:
   - Real-time channel broadcasts update ticket availability, catalog listings, visibility toggles, and user registrations across client browsers with zero page reloads.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/) & React 19 | Server & client rendering, streaming UI, layouts |
| **Frontend State & Cache**| [TanStack Query v5](https://tanstack.com/query) & [Zustand](https://github.com/pmndrs/zustand) | Global server-state caching, automatic cache invalidation |
| **Styling & Components** | [Tailwind CSS v4](https://tailwindcss.com/) & shadcn/ui | Modern, responsive dark-mode UI with rich aesthetics |
| **Backend Framework** | [NestJS 11](https://nestjs.com/) | Modular enterprise backend architecture |
| **Database** | [Neon Serverless PostgreSQL](https://neon.tech/) | Resilient cloud PostgreSQL with pooling |
| **ORM & Migrations** | [Drizzle ORM 0.45](https://orm.drizzle.team/) | Type-safe SQL dialect & schema migrations |
| **Authentication** | [Better-Auth](https://www.better-auth.com/) | Secure session management & hashed credentials |
| **Real-Time WebSockets**| [Pusher](https://pusher.com/) | Event-driven client updates and synchronized UI |
| **Media Storage** | [Cloudinary](https://cloudinary.com/) | Cloud storage & optimization for event posters |
| **Document Generation** | [PDFKit](https://pdfkit.org/) | Vector PDF certificate rendering |
| **QR & Scanning** | `qrcode`, `qrcode.react`, `html5-qrcode` | Cryptographic generation & client-side camera scanning |

---

## 📁 Project Structure

```text
Univent/
├── backend/                       # NestJS API Application
│   ├── src/
│   │   ├── common/                # Guards, decorators, filters, Pusher module
│   │   ├── database/              # Drizzle ORM provider, schema, connection pool
│   │   │   └── schema/            # Auth, events, registrations, attendance, certificates
│   │   └── modules/               # Domain feature modules
│   │       ├── analytics/         # System & organizer telemetry
│   │       ├── attendance/        # Live QR scanning & attendance recording
│   │       ├── auth/              # Better-Auth integration & sessions
│   │       ├── categories/        # Event categories
│   │       ├── certificates/      # PDF issuance & verification engine
│   │       ├── events/            # Event creation, catalog & visibility
│   │       ├── notifications/     # In-app notifications
│   │       ├── registrations/     # Ticket reservation & OCC cancellations
│   │       ├── uploads/           # Cloudinary image signing
│   │       └── users/             # User directory & administration
│   └── package.json
│
├── frontend/                      # Next.js 16 Web Application
│   ├── app/
│   │   ├── (auth)/                # Login & registration portals
│   │   ├── (dashboard)/
│   │   │   ├── admin/             # Platform command, events audit & user directory
│   │   │   ├── organizer/         # Event management, analytics & scanner
│   │   │   └── student/           # Passes, certificates & overview
│   │   ├── (public)/              # Public event catalog & certificate verification
│   │   └── layout.tsx             # Root layout & providers
│   ├── components/                # Modular UI components (tickets, certificates, scanner)
│   ├── hooks/                     # useAuth, usePusher, custom hooks
│   ├── lib/                       # API clients, Better-Auth client, TanStack queries
│   └── package.json
│
└── doc/                           # Architecture specifications & system design
```

---

## 🚦 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`+
- **pnpm**: `v9.x`+ (`npm install -g pnpm`)
- **PostgreSQL**: Neon DB connection string or local PostgreSQL 16+
- **Pusher Account**: Free tier credentials from [Pusher](https://pusher.com/)
- **Cloudinary Account**: Free tier credentials from [Cloudinary](https://cloudinary.com/)

---

### 1. Clone the Repository

```bash
git clone https://github.com/mubarek-hassen-buli/Univent.git
cd Univent
```

---

### 2. Backend Setup

```bash
cd backend
pnpm install
```

Create a `.env` file in `backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/neondb?sslmode=require

# Authentication (Better Auth)
BETTER_AUTH_SECRET=your_super_secret_key_minimum_32_characters_long
BETTER_AUTH_URL=http://localhost:5000

# Cryptographic QR HMAC Secret
QR_HMAC_SECRET=your_cryptographic_hmac_signing_secret_32_bytes_long

# Real-Time (Pusher)
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=mt1

# Media Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Run database migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

Start the backend development server:

```bash
pnpm start:dev
```
*API will run at `http://localhost:5000`.*

---

### 3. Frontend Setup

In a separate terminal:

```bash
cd frontend
pnpm install
```

Create a `.env.local` file in `frontend/`:

```env
# Backend API Base URL
NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Pusher Real-Time Configuration
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=mt1
```

Start the frontend development server:

```bash
pnpm dev
```
*Web app will run at `http://localhost:3000`.*

---

## 🔑 Default Accounts (Quick Demo)

| Role | Email | Password | Access Portal |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin@univent.edu` | `AdminPassword123!` | `/admin` |
| **Event Organizer** | `mubirimuru@gmail.com` | `Organizer123!` | `/organizer` |
| **Student** | `riyad@gmail.com` | `Student123!` | `/student` |

*(You can also create custom accounts at `/register` or directly via the Administrator User Directory).*

---

## 📡 Real-Time WebSocket Events Map

| Channel | Event | Trigger Condition |
| :--- | :--- | :--- |
| `events` | `event:created` | An organizer creates a new event |
| `events` | `event:updated` | Event dates, description, or capacity changes |
| `events` | `event:visibility-changed` | Organizer toggles Hide/Unhide status |
| `events` | `event:status-changed` | Event status changes (Published, Completed, Cancelled) |
| `events` | `event:seat-update` | A student books or cancels a registration ticket |
| `users` / `admin` | `user:created` | New account provisioned in the directory |
| `users` / `admin` | `user:deleted` | Account deleted from directory |
| `organizer-{id}` | `attendance:scanned` | Attendee QR code scanned at the entrance |
| `user-{id}` | `certificate:issued` | Verified certificate issued to a student |

---

## 🧪 Testing & Verification

Run backend unit and integration tests:

```bash
cd backend
pnpm test
```

Run TypeScript verification across services:

```bash
# Backend
cd backend && pnpm exec tsc --noEmit

# Frontend
cd frontend && pnpm exec tsc --noEmit
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
