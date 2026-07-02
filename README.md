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
    %% Custom Styling definitions for visual layers
    classDef userStyle fill:#0284c7,stroke:#0369a1,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef feStyle fill:#0d9488,stroke:#0f766e,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef gatewayStyle fill:#2563eb,stroke:#1d4ed8,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef beStyle fill:#4f46e5,stroke:#4338ca,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef rtStyle fill:#06b6d4,stroke:#0891b2,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef dbStyle fill:#16a34a,stroke:#15803d,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef infraStyle fill:#581c87,stroke:#4a044e,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef extStyle fill:#b45309,stroke:#78350f,stroke-width:1.5px,color:#ffffff,font-weight:bold;
    classDef ccStyle fill:#be123c,stroke:#9f1239,stroke-width:1.5px,color:#ffffff,font-weight:bold;

    %% --- Users Layer ---
    subgraph Users [Users Layer]
        Patient[Patient]:::userStyle
        Receptionist[Receptionist]:::userStyle
        Doctor[Doctor]:::userStyle
        Nurse[Nurse]:::userStyle
        Pharmacist[Pharmacist]:::userStyle
        Admin[Hospital Admin]:::userStyle
    end

    %% --- Frontend Layer ---
    subgraph Frontend [Frontend Layer - React + Vite + Tailwind CSS]
        direction TB
        Auth_FE[Authentication]:::feStyle
        Dashboard_FE[Role-Based Dashboard]:::feStyle
        Reg_FE[Patient Registration]:::feStyle
        OPD_FE[OPD Queue Dashboard]:::feStyle
        Doctor_FE[Doctor Dashboard]:::feStyle
        EMR_FE[EMR]:::feStyle
        Bed_FE[Bed Management]:::feStyle
        Ward_FE[Ward Management]:::feStyle
        Admit_FE[Admission & Discharge]:::feStyle
        Transfer_FE[Transfer Management]:::feStyle
        Inv_FE[Inventory Management]:::feStyle
        Pharm_FE[Pharmacy Management]:::feStyle
        Notif_FE[Notification Center]:::feStyle
        Reports_FE[Reports & Analytics]:::feStyle
    end

    %% --- API Gateway ---
    subgraph Gateway [API Gateway]
        REST_API[REST API Requests]:::gatewayStyle
        Auth_MW[Auth Middleware]:::gatewayStyle
        Validation_MW[Validation & Rate Limiting]:::gatewayStyle
        Routing_MW[Routing]:::gatewayStyle
    end

    %% --- Backend Services ---
    subgraph Backend [Backend Services - Node.js + Express]
        direction TB
        Auth_Svc[Authentication Svc]:::beStyle
        User_Svc[User Management Svc]:::beStyle
        Patient_Svc[Patient Management Svc]:::beStyle
        OPD_Svc[OPD Queue Svc]:::beStyle
        Consult_Svc[Doctor Consultation Svc]:::beStyle
        EMR_Svc[EMR Svc]:::beStyle
        Bed_Svc[Bed Management Svc]:::beStyle
        Admit_Svc[Admission Svc]:::beStyle
        Pharm_Svc[Pharmacy Svc]:::beStyle
        Inv_Svc[Inventory Svc]:::beStyle
        Notif_Svc[Notification Svc]:::beStyle
        Analytics_Svc[Analytics Svc]:::beStyle
        Report_Svc[Report Generation Svc]:::beStyle
        Audit_Svc[Audit Log Svc]:::beStyle
    end

    %% --- Real-Time Layer ---
    subgraph RealTime [Real-Time Communication Layer]
        SocketIO[Socket.IO Server]:::rtStyle
        Live_Queue[Live Queue updates]:::rtStyle
        Live_Bed[Live Bed Board]:::rtStyle
        Live_Inv[Live Inventory]:::rtStyle
        Live_Notif[Live Notifications]:::rtStyle
    end

    %% --- Database Layer ---
    subgraph Database [Database Layer - MongoDB / PostgreSQL]
        direction TB
        Coll_Users[(Users)]:::dbStyle
        Coll_Patients[(Patients)]:::dbStyle
        Coll_Doctors[(Doctors)]:::dbStyle
        Coll_Depts[(Departments)]:::dbStyle
        Coll_Beds[(Beds)]:::dbStyle
        Coll_Wards[(Wards)]:::dbStyle
        Coll_Admit[(Admissions)]:::dbStyle
        Coll_Transfers[(Transfers)]:::dbStyle
        Coll_Records[(Medical Records)]:::dbStyle
        Coll_Appts[(Appointments)]:::dbStyle
        Coll_OPD[(OPD Queue)]:::dbStyle
        Coll_Consults[(Consultations)]:::dbStyle
        Coll_Meds[(Medicines)]:::dbStyle
        Coll_Inventory[(Inventory)]:::dbStyle
        Coll_Notif[(Notifications)]:::dbStyle
        Coll_Reports[(Reports)]:::dbStyle
    end

    %% --- Infrastructure Layer ---
    subgraph Infrastructure [Infrastructure Layer]
        direction LR
        JWT_Auth[JWT Auth]:::infraStyle
        RBAC_Auth[RBAC Security]:::infraStyle
        Cloud_Store[Cloud Storage]:::infraStyle
        File_Upload[File Upload]:::infraStyle
        SMS_Gate[SMS Gateway]:::infraStyle
        Email_Gate[Email Gateway]:::infraStyle
        Logging[Logging & Monitoring]:::infraStyle
        Backup[Backup & Recovery]:::infraStyle
        Env_Vars[Env Variables]:::infraStyle
        HTTPS_Sec[HTTPS]:::infraStyle
        API_Sec[API Security]:::infraStyle
    end

    %% --- External Integrations ---
    subgraph Integrations [External Integrations]
        direction LR
        Gov_Health[Gov Health APIs]:::extStyle
        City_Net[City Hospital Net]:::extStyle
        LIS_Int[LIS Laboratory]:::extStyle
        PACS_Int[RIS / PACS Radiology]:::extStyle
        Insurance_Int[Insurance APIs]:::extStyle
        Payment_Int[Payment Gateway]:::extStyle
        AI_Engine[AI Prediction]:::extStyle
        IoT_Beds[IoT Smart Beds]:::extStyle
        Ambulance[Ambulance Tracking]:::extStyle
        HL7[FHIR / HL7]:::extStyle
        Cloud_Svc[Cloud Services]:::extStyle
    end

    %% --- Cross-Cutting Features ---
    subgraph CrossCutting [Cross-Cutting Features]
        direction LR
        Secure_Auth[Secure Authentication]:::ccStyle
        Authorization[Authorization]:::ccStyle
        Audit_Log[Audit Logging]:::ccStyle
        Notif_Engine[Notification Engine]:::ccStyle
        RT_Sync[Real-Time Sync]:::ccStyle
        Analytics[Analytics]:::ccStyle
        Scalability[Scalability]:::ccStyle
        Cloud_Ready[Cloud Ready]:::ccStyle
        Fault_Tol[Fault Tolerance]:::ccStyle
    end

    %% --- Connections ---
    Users --> Frontend
    Frontend --> REST_API
    REST_API --> Auth_MW
    Auth_MW --> Validation_MW
    Validation_MW --> Routing_MW
    Routing_MW --> Backend
    Backend --> Database

    %% Real-time Socket sync
    Backend <--> SocketIO
    SocketIO <--> Frontend
    SocketIO --- Live_Queue & Live_Bed & Live_Inv & Live_Notif

    %% Infrastructure & Integrations
    Infrastructure --> Backend
    Integrations --> Backend
    CrossCutting -.-> Backend
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
