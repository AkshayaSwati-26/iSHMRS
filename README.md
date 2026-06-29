# iSHRMS: Integrated Smart Hospital Resource Management System

iSHRMS is a state-of-the-art, high-class clinical operations platform designed to streamline hospital administration, automate OPD consultation queues, sync metropolitan hospital resources, manage real-time ward bed states, and optimize pharmacy logs.

---

## 🛠️ Core Technology Stack
* **Frontend**: React (Vite) + Tailwind CSS + Framer Motion (for animations) + Recharts (for charts).
* **Backend**: Node.js (Express) + Socket.io (for real-time updates) + Prisma ORM.
* **Database**: PostgreSQL.

---

## 🏥 Core Features
* **🔐 Role Security (RBAC)**: Custom logins and dashboards for Admins, Doctors, Nurses, Receptionists, and Pharmacists.
* **🏙️ City-Wide Network (City Dashboard)**: Connects and compares multiple hospitals in real time to balance patient loads and bed spaces.
* **📋 Real-Time Bed Board**: A visual map showing which beds are **Available**, **Occupied**, **Cleaning**, or in **Maintenance**.
* **🩺 Smart OPD Queue**: Prioritizes patient tokens (Normal, Emergency, Senior, Pregnancy) and manages doctor consultations and prescriptions.
* **💊 Pharmacy Tracker**: Tracks drug stock, gives low-stock/expiry warnings, and features a dedicated **Dispense Form** to log transactions.
* **🔔 Live Notifications**: An animated dropdown panel in the top bar showing instant clinical alerts and quick-resolve buttons.

---

## 🔄 System Workflow
1. **Intake**: A patient registers at the front desk. The receptionist issues an OPD token with priority scoring (Normal, Emergency, Senior, Pregnancy).
2. **Consultation**: The doctor views the prioritized queue in real time, conducts check-ups, and registers diagnoses/vitals. They prescribe medicines or order ward admission.
3. **Admission**: Receptionists view the live Bed Board sensor grid, select an available bed, and assign a physician.
4. **Care & Discharge**: Nurses track ward beds. Discharged beds are automatically sent to cleaning status before returning to the available pool.
5. **Dispensation**: Pharmacists retrieve patient prescriptions, dispense drugs, and automatically deduct inventory stock levels.

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
