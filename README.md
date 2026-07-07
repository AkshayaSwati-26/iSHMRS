# 🏥 Integrated Smart Hospital Resource Management System (iSHRMS)

## Real-Time Clinical Operations + Socket.io Synchronized Inpatient Telemetry

[![React](https://img.shields.io/badge/React-Vite-blue?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=flat-square&logo=nodedotjs)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=flat-square&logo=postgresql)](https://www.postgresql.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-Real--Time-black?style=flat-square&logo=socketdotio)](https://socket.io)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-indigo?style=flat-square&logo=prisma)](https://www.prisma.io)

> A state-of-the-art, high-class clinical operations platform designed to streamline hospital administration, automate OPD consultation queues, sync metropolitan hospital resources, manage real-time ward bed states, and optimize pharmacy logs.

---

## 🛠️ Technology Stack

| Layer | Technology | Function |
| :--- | :--- | :--- |
| **UI & Styles** | React (Vite) + TailwindCSS | High-speed client rendering & glassmorphism styling |
| **Visuals & Motion** | Framer Motion + Recharts (SVG) | Micro-interactions, spring animations & live charts |
| **API & Realtime** | Node.js (Express) + Socket.io | Scalable backend routers & bidirectional event sync |
| **Database & ORM** | PostgreSQL + Prisma ORM | Relational ACID storage & modern migrations |
| **Voice Caller** | Web Speech API | Client-side Text-to-Speech waiting room announcer |

---

## 🏥 Core Modules & Main Features

* **🔐 Role Security (RBAC)**: Custom logins, session guarding (JWT), and redirection to role-specific dashboards for **Admins, Doctors, Nurses, Receptionists, and Pharmacists**.
* **🏙️ City-Wide Network (City Dashboard)**: Connects and compares multiple hospitals in real time to balance patient loads, monitor bed occupancy, and alert cities of critical resource shortages.
* **📋 Real-Time Bed Board**: A visual map of ward beds displaying sensor states: **Available** (green), **Occupied** (red), **Cleaning** (purple), or **Maintenance** (yellow). Supports instant bed allocation and ward transfers.
* **🩺 Smart OPD Queue**: Prioritizes patient tokens based on clinical severity: **Emergency** (immediate), **High Priority** (Senior Citizen/Pregnancy), or **Normal**.
* **💊 Pharmacy Tracker**: Tracks drug stock levels, gives low-stock/expiry warnings, and features a dedicated **Dispense Form** to log transactions and patient history.
* **🔔 Live Notifications**: An animated dropdown panel in the top bar showing instant clinical alerts, low stock warnings, and quick-resolve buttons.
* **📊 Interactive Dashboard**: Live analytics widgets representing patient footfall trends, OPD severity distributions, department loadings, and weekly available bed census trends.
* **📝 Audit Logs**: Records every critical system activity with the active user, transaction type, IP address, and timestamp for complete traceability.
* **📅 Doctor Appointment Scheduler**: Real-time appointment booking calendar with automatic double-booking prevention.
* **🔊 Live Waiting Room Caller (TTS)**: Automatically announces patient tokens using Text-to-Speech (TTS) when doctors call the next patient.
* **🛡️ Super Admin Global Access**: Enables Super Admins to securely manage multiple hospitals through intelligent backend context handling.

---

## 🔄 System Architecture & Workflow
```mermaid
graph LR
    %% Custom filled styles matching iSHRMS dashboard colors
    classDef startEnd fill:#2563eb,stroke:#1d4ed8,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef step fill:#0d9488,stroke:#0f766e,stroke-width:1.5px,color:#ffffff;
    classDef decision fill:#e11d48,stroke:#be123c,stroke-width:2px,color:#ffffff,font-weight:bold;
    classDef inpatient fill:#ea580c,stroke:#c2410c,stroke-width:1.5px,color:#ffffff;
    classDef outpatient fill:#4f46e5,stroke:#3730a3,stroke-width:1.5px,color:#ffffff;

    Start([Start]):::startEnd --> Reg[Patient Registration<br/>- Register/Retrieve UHID<br/>- Generate OPD Token<br/>- Select Dept & Priority]:::step
    Reg --> Consult[Doctor Consultation<br/>- View Prioritized Queue<br/>- Record Vitals & Diagnosis]:::step
    Consult --> Dec{Decision}:::decision

    Dec -->|Outpatient| Pharm[Pharmacy<br/>- Retrieve Prescription<br/>- Dispense Medicines<br/>- Update Inventory]:::outpatient
    Pharm --> EndOut([End]):::startEnd

    Dec -->|Inpatient| BedAlloc[Bed Allocation<br/>- View Available Beds<br/>- Assign Bed using UHID]:::inpatient
    BedAlloc --> Care[Inpatient Care<br/>- Administer Treatment<br/>- Transfer Ward Bed if needed]:::inpatient
    Care --> Discharge[Discharge Process<br/>- Discharge Patient<br/>- Bed Sanitization Loop]:::inpatient
    Discharge --> EndIn([End]):::startEnd
```

### Workflow Steps

#### Step 1: Patient Intake & Token Generation (Receptionist)
1. **Registration**: Register a new patient or retrieve an existing profile using the UHID.
2. **Generate OPD Token**: Select the Department and Priority (Emergency, Senior Citizen/Pregnancy, or Normal).
3. **Queue Update**: The token is added to the database, and the doctor's queue updates in real-time.

#### Step 2: Doctor Consultation (Doctor)
1. **View Queue**: The doctor sees the prioritized patient queue.
2. **Consultation**: Record Vitals, Symptoms, and Diagnosis.
3. **Decision**:
   - **Outpatient**: Generate a prescription and send the patient to the pharmacy.
   - **Inpatient**: Create an admission order for ward allocation.

#### Step 3: Bed Allocation (Receptionist)
1. **Open Bed Board**: View available hospital beds.
2. **Bed Status**: Available, Occupied, Cleaning, or Maintenance.
3. **Assign Bed**: Allocate an available bed using the patient's UHID. The bed status updates instantly.

#### Step 4: Inpatient Care (Doctors & Nurses)
1. **Monitor Patient**: Update treatment and care records.
2. **Transfer (If Needed)**: Move the patient to another available bed.
3. **Discharge**: Complete the discharge process.
4. **Bed Release**: The bed moves to Cleaning and is later marked Available.

#### Step 5: Pharmacy & Inventory (Pharmacist)
1. **Retrieve Prescription**: Search using the patient's UHID.
2. **Dispense Medicine**: Verify stock and dispense medication.
3. **Inventory Update**: Stock is reduced, the transaction is logged, and a Low Stock Alert is generated if required.

---

## 📂 Repository Directory Structure

```text
iSHRMS/
├── assets/                    # Static assets
├── docker-compose.yml         # Multi-container Docker orchestration config
├── README.md                  # Project documentation
├── ishms-backend/             # Express.js REST & Real-time Socket.io server
│   ├── prisma/                # Prisma ORM schema, migrations, and seed scripts
│   └── src/                   # Backend application source code
│       ├── controllers/       # Route request handlers
│       ├── middlewares/       # Request interceptors (JWT auth, RBAC validation)
│       └── routes/            # REST API endpoint route definitions
└── ishms-frontend/            # React (Vite) client web application
    ├── public/                # Static public assets
    └── src/                   # Client application source code
        ├── components/        # Reusable UI widgets & dashboard charts
        ├── context/           # React context providers (Auth context, Socket state)
        └── pages/             # Dynamic dashboard views for various roles
```

---

## 🔑 Role-Based Access Control (RBAC) Matrix

| Role | Dashboard View | Key Capabilities |
| :--- | :--- | :--- |
| **Super Admin** | Multi-Hospital Global View | Manage multiple hospital clusters, compare occupancy/shortages, view audit logs |
| **Admin** | Hospital Management | Configure departments, beds, view analytics, manage personnel, handle inventory |
| **Doctor** | Consultation Dashboard | View OPD queues, update patient vitals & diagnostics, write prescriptions, order admissions |
| **Nurse** | Ward Bed Board | Monitor bed/sensor status, assign patients to beds, request transfers, discharge inpatients |
| **Receptionist**| Patient Intake & Bed Booking | Register patients, generate priority-based OPD tokens, allocate beds |
| **Pharmacist** | Inventory & Dispensation | Dispense medicine by UHID, manage stock transactions, check low stock & expiry |

---

## 🔌 API & Real-Time Sync (REST & WebSockets)

The client and server communicate via a secure REST API (JWT/RBAC protected) alongside a bidirectional Socket.io event loop:

```mermaid
graph LR
    classDef client fill:#2563eb,stroke:#1d4ed8,stroke-width:1.5px,color:#ffffff;
    classDef server fill:#0d9488,stroke:#0f766e,stroke-width:1.5px,color:#ffffff;
    classDef db fill:#4f46e5,stroke:#3730a3,stroke-width:1.5px,color:#ffffff;

    React[💻 React Frontend]:::client
    Express[⚙️ Express Backend]:::server
    DB[(🗄️ PostgreSQL)]:::db

    React -->|REST API: JWT Auth, Intake, Rx, Inventory| Express
    React <-->|Socket.io: Live Bed occupancy & OPD Queue Sync| Express
    Express <-->|Prisma ORM| DB
```

- **REST Interface**: Governs secure state mutations and queries: Authentication (`/auth`), Patient Registration (`/patients`), OPD Tokens (`/opd`), Ward Bed Allocation (`/beds`), Admissions/Discharges (`/admissions`), Pharmacy logs (`/medicines`), and City Metrics (`/city`).
- **Socket.io Sync**: Broadcasts live updates across hospital client views: Bed board state changes (`bed_status_updated`), Patient queue changes (`queue_updated`), Doctor TTS token calls (`token_called`), and system warnings (`system_alert`).

---

## 🚀 How to Run & Deploy

### Option A: Using Docker Compose (Recommended - Quickest Setup)

To build and run the entire multi-container stack (PostgreSQL, Express Backend, and Vite Frontend) in a single command:

1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/AkshayaSwati-26/iSHRMS.git
   cd iSHRMS
   ```
2. Build and run the containers in detached mode:
   ```bash
   docker-compose up --build -d
   ```
3. Once initialized, the services will be running at:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend REST API**: [http://localhost:5000/api](http://localhost:5000/api)
   - **Database (PostgreSQL)**: Port `5435` (mapped to container port `5432`)

---

### Option B: Local Manual Setup

#### Prerequisites
- Node.js (v18+)
- PostgreSQL database

#### 1. Database Setup
Ensure PostgreSQL is running and update the `.env` database connection string in `ishms-backend/.env`. Run the migrations and seed data:
```bash
cd ishms-backend
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

#### 2. Frontend Setup
```bash
cd ishms-frontend
npm install
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.
