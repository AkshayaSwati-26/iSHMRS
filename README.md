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
graph TB
    classDef actor fill:#f8fafc,stroke:#64748b,stroke-width:1px,stroke-dasharray: 4 4;
    classDef workflow fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef service fill:#eff6ff,stroke:#2563eb,stroke-width:2px;
    classDef db fill:#fff7ed,stroke:#ea580c,stroke-width:2px;
    classDef infra fill:#faf5ff,stroke:#8b5cf6,stroke-width:2px;

    subgraph EA [External Actors]
        direction TB
        Patients((Patients))
        Receptionist((Receptionist))
        Doctors((Doctors))
        Nurses((Nurses))
        Pharmacist((Pharmacist))
    end
    class EA actor;

    subgraph Steps [Clinical Workflows]
        direction TB
        subgraph S1 [1. Patient Intake]
            Register[Register / Retrieve Patient] --> CreateToken[Create OPD Token]
        end
        subgraph S2 [2. Doctor Consultation]
            ViewQueue[View Prioritized Queue] --> CheckVitals[Check Vitals & Symptoms] --> Decision{Decision}
            Decision -->|Outpatient| Rx[Write Prescription]
            Decision -->|Inpatient| AdmitOrder[Admit Order]
        end
        subgraph S3 [3. Bed Allocation]
            OpenBoard[Open Bed Board] --> CheckStatus[View Bed Status] --> AssignBed[Assign Available Bed]
        end
        subgraph S4 [4. Inpatient Care]
            Monitor[Monitor Treatment] --> Transfer[Transfer Bed] --> Discharge[Discharge Inpatient]
        end
        subgraph S5 [5. Pharmacy & Inventory]
            RetrieveRx[Retrieve Prescription] --> Dispense[Dispense Medication] --> DeductStock[Deduct Stock & Alert]
        end
    end
    class S1,S2,S3,S4,S5 workflow;

    subgraph Services [Application & Backend Services]
        PatientServ[Patient Service]
        QueueServ[OPD Queue Service]
        ConsultServ[Consultation Service]
        BedServ[Bed Management Service]
        PharmacyServ[Pharmacy Service]
        AuditServ[Audit Log Service]
    end
    class PatientServ,QueueServ,ConsultServ,BedServ,PharmacyServ,AuditServ service;

    subgraph CentralDB [Centralized PostgreSQL Database]
        DB[(PostgreSQL Relational Storage)]
    end
    class DB db;

    subgraph Infra [Infrastructure & Integrations]
        Auth[JWT Auth]
        WebSockets[Socket.io Real-time]
        TTS[Speech Synthesis Queue Caller]
    end
    class Auth,WebSockets,TTS infra;

    %% Connections
    Receptionist --> S1
    Doctors --> S2
    Receptionist --> S3
    Nurses --> S4
    Pharmacist --> S5

    S1 & S2 & S3 & S4 & S5 -.-> Services
    Services -.-> CentralDB
    CentralDB -.-> Infra
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

## 🚀 How to Run Locally

### Prerequisites
- Node.js (v18+)
- PostgreSQL database

### 1. Database Setup
Ensure PostgreSQL is running and update the `.env` database connection string in `ishms-backend/.env`. Run the migrations and seed data:
```bash
cd ishms-backend
npm install
npx prisma migrate dev
node prisma/seed.js
npm run dev
```

### 2. Frontend Setup
```bash
cd ishms-frontend
npm install
npm run dev
```
Open [http://localhost:5174](http://localhost:5174) in your browser.
