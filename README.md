# 🏥 iSHRMS: Integrated Smart Hospital Resource Management System
### Adaptive Clinical Telemetry + Real-Time Queue & Inventory Optimization

A decentralized hospital administration system that optimizes patient flows, automates OPD queue priorites, tracks real-time ward bed occupancy states, and manages pharmacy stock registers.

`React 19` `Vite` `Framer Motion` `Recharts` `Node.js` `Prisma` `PostgreSQL` `Socket.io`

---

## 📌 Problem Statement
Traditional hospital management systems in metropolitan clinical centers operate on isolated workflows:
- **Disjointed Data Flows**: Front desk registration, inpatient wards, clinical consultation rooms, and pharmacies operate in silos.
- **Unmanaged Patient Waiting Times**: Flat queue lines cause long waiting delays and delay critical emergency cases.
- **Census Grid Mismatch**: Bed availability boards do not dynamically reflect sanitization cycles or patient transfers in real time.
- **Pharmacy Discrepancies**: Lack of automated low-stock warnings and expiry alerts leads to stockouts or use of outdated inventory.
- **Absence of Collaborative Sync**: Local city hospitals cannot share load metrics during emergency mass-casualty events.

---

## 💡 Our Solution
We present **iSHRMS**, an integrated hospital ecosystem where every ward, pharmacy counter, and OPD department operates as a synchronized agent.
* **✅ Real-Time Clinical Telemetry**: Automatically broadcasts changes in bed occupancy, queues, and stocks hospital-wide.
* **✅ Staggered Priority Queue**: Adjusts waiting lines dynamically for emergency cases, pregnant mothers, and senior citizens.
* **✅ Smart Bed Board Board**: Directs nurses and cleaning staff through live status changes (Available, Occupied, Cleaning, Maintenance).
* **✅ Automated Pharmacy Controls**: Deducts quantities, registers UHID audits, and highlights low stock or expired batches instantly.
* **✅ Metropolitan Node Network**: Enables super admins to inspect regional load rankings to balance patient intake during major crises.

---

## 🏛️ System Architecture

```
                       Cloud Analytics Layer
                                 │
                                 ▼
                     Performance Reports Panel
                                 │
                                 ▼
                         Websocket Server
                    (Real-Time Telemetry Engine)
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
   Admins Portal          Doctors Portal            Nurses Portal
  (Staff & Alerts)       (OPD Queue & Rx)          (Bed Board Census)
       │                         │                         │
       └─────────────────────────┼─────────────────────────┘
                                 ▼
                         Prisma Query Engine
                                 │
                                 ▼
                     PostgreSQL Database Layer
```

---

## 🔄 System Workflow

```mermaid
flowchart TD
    %% Node Definitions
    A["🆕 Patient Intake"]
    B["🎟️ Token Generation"]
    C{"⚡ Severity Check"}
    D["🚨 Emergency Slot"]
    E["⏳ Queue Line"]
    F["🩺 OPD Consultation"]
    G{"🏥 Admit Ordered?"}
    H["🛏️ Bed Board Board"]
    I["💊 Pharmacy Registry"]
    J["🧹 Sanitization Loop"]
    K["📦 Stock Auto-Deduction"]
    L["🟢 Bed Marked Available"]

    %% Link Connections
    A --> B
    B --> C
    C -->|Emergency| D
    C -->|Normal| E
    D --> F
    E --> F
    F --> G
    G -->|Yes| H
    G -->|No| I
    H --> J
    J --> L
    I --> K

    %% Custom Colors & Styling
    style A fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    style B fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e3a8a
    style C fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style D fill:#fee2e2,stroke:#ef4444,stroke-width:2px,color:#7f1d1d
    style E fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151
    style F fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b
    style G fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#78350f
    style H fill:#e0e7ff,stroke:#6366f1,stroke-width:2px,color:#1e1b4b
    style I fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#3b0764
    style J fill:#fdf2f8,stroke:#ec4899,stroke-width:2px,color:#831843
    style K fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#3b0764
    style L fill:#ecfdf5,stroke:#10b981,stroke-width:2px,color:#064e3b
```

---

## ⚙️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Client Portal UI** | React.js 19 + Vite | High-performance, fast UI rendering |
| **Styling System** | TailwindCSS | Premium glassmorphism light theme layers |
| **Motion Physics** | Framer Motion | Smooth sidebar transitions and spring modals |
| **Analytics Engine** | Recharts | Live medical metrics visualization |
| **Server Runtime** | Node.js + Express | RESTful backend microservices |
| **Sync Middleware** | Socket.io | Real-time clinical updates broadcasting |
| **Database ORM** | Prisma ORM | Transaction-safe model query handling |
| **Database Engine** | PostgreSQL | Secure data storage |
| **Queue Audio** | Web Speech API | Text-to-Speech (TTS) waiting caller announcements |

---

## 🏥 Core Modules & Implementations

### Phase 1 — Authentication & Security Guarding (RBAC)
- **Granular Roles**: Separate dashboards for Admins, Doctors, Nurses, Receptionists, and Pharmacists.
- **Session Guarding**: Secure JWT authentication with intelligent automatic redirection according to user account privileges.
- **Audit Logging**: Every login, consultation, and stock change is permanently logged with user details, transaction types, and IP addresses.

### Phase 2 — Real-Time Bed Board Registry
- **Telemetry Grid**: Maps hospital beds across categories: Available, Occupied, Cleaning, and Maintenance.
- **Sensor Actions**: Immediate inline admissions, physician assignments, and ward-to-ward transfers.
- **Release Loop**: When a patient is discharged, the bed automatically shifts to "Cleaning" and locks. Once sanitized, it is marked "Available" to rejoin the active census pool.

### Phase 3 — Prioritized OPD Queue & Text-To-Speech (TTS)
- **Intake Tokenizer**: Automatically schedules incoming tokens based on severity levels (Emergency, Senior/Pregnancy, Normal).
- **TTS waiting caller**: When the doctor clicks the "Next Patient" trigger, the dashboard leverages the browser's native Web Speech engine to announce the ticket number over the waiting room speaker.
- **Clinical Consultations**: Unified console for Doctors to record vitals (BP, Heart Rate, Temp) and issue digital prescriptions.

### Phase 4 — Pharmacy Inventory Tracker
- **Audit Stocks**: Monitors medicine batch numbers, manufacturing/expiry dates, and safety thresholds.
- **Dedicated Dispense Form**: Validates stock levels, logs recipient UHID references, updates stock quantities, and appends records to the live **Pharmacy Activity Log**.

---

## 📂 Project Structure

```
iSHRMS/
│
├── ishms-backend/            # Express Backend API Server
│   ├── prisma/
│   │   ├── migrations/       # SQL Database Migrations
│   │   ├── schema.prisma     # Prisma Data Models
│   │   └── seed.js           # Seeds roles, beds, and patients
│   ├── src/
│   │   ├── config/           # Database and Socket setups
│   │   ├── controllers/      # Route handler methods
│   │   ├── middlewares/      # Security guards and error catchers
│   │   ├── routes/           # API routes mapping
│   │   └── index.js          # Main server boot file
│   └── package.json
│
├── ishms-frontend/           # React Client Portal
│   ├── src/
│   │   ├── components/       # Layout, Sidebars, and Alert elements
│   │   ├── context/          # Authentication & WebSocket contexts
│   │   ├── pages/            # Core dashboard panels and grids
│   │   ├── utils/            # Axios API config
│   │   └── main.jsx          # Entry mount point
│   ├── package.json
│   └── vite.config.js
│
├── README.md                 # Project Manifest
└── docker-compose.yml        # Multi-container orchestrator
```

---

## 🚀 Getting Started

### 1. Database Setup & Seed
1. Ensure PostgreSQL is running.
2. Configure your database connection string in `ishms-backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5435/ishrms?schema=public"
   JWT_SECRET="ishrms-clinical-token-key-secret-2026"
   ```
3. Run the database setup:
   ```bash
   cd ishms-backend
   npm install
   npx prisma migrate dev --name init
   node prisma/seed.js
   npm run dev
   ```

### 2. Launch Client UI
```bash
cd ishms-frontend
npm install
npm run dev
```
Open **[http://localhost:5174](http://localhost:5174)** in your web browser.

---

## 🔮 Future Roadmap

### Short-Term
- **Integrated Prescription barcodes**: Instantly scan printed consultation slips at the pharmacy to auto-load dispensation parameters.
- **Smart SMS Alerts**: Send text notifications to patients with queue timings and bed availability updates.

### Mid-Term
- **Wearable Sensors Sync**: Connect smart vitals bands to feed live ward telemetry directly to the nurses' board.
- **Predictive OPD Staffing**: Analyze historical check-in footfalls to optimize nurse and physician schedules.

### Long-Term
- **Smart City Medical Cloud**: Seamlessly transfer electronic health records between state-wide hospitals during emergency evacuations.
- **AI Diagnosis Copilot**: Suggest treatment protocols and medication checks based on diagnostic inputs.
