-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST');

-- CreateEnum
CREATE TYPE "BedStatus" AS ENUM ('Available', 'Occupied', 'Reserved', 'Cleaning', 'Maintenance', 'TransferPending');

-- CreateEnum
CREATE TYPE "BedType" AS ENUM ('General', 'ICU', 'Emergency', 'Isolation', 'Maternity', 'OperationRecovery');

-- CreateEnum
CREATE TYPE "OPDTokenStatus" AS ENUM ('Waiting', 'InConsultation', 'Completed', 'Cancelled', 'NoShow');

-- CreateEnum
CREATE TYPE "OPDTokenPriority" AS ENUM ('Normal', 'Emergency', 'SeniorCitizen', 'Pregnancy');

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('Admitted', 'Discharged', 'Transferred');

-- CreateEnum
CREATE TYPE "InventoryTransactionType" AS ENUM ('StockIn', 'StockOut', 'StockTransfer', 'StockAudit');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('MedicineExpiry', 'LowStock', 'BedShortage', 'EmergencyCase', 'QueueOverflow', 'HighOccupancy', 'SystemError');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('Active', 'Acknowledged', 'Resolved');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('Daily', 'Weekly', 'Monthly', 'Department', 'BedUtilization', 'MedicineConsumption', 'PatientStats');

-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "name" "RoleName" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "phone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "hospital_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "uhid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "blood_group" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "is_admitted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientHistory" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "vitals" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "PatientHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ward" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "BedType" NOT NULL,
    "department_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Ward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ward_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bed" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "status" "BedStatus" NOT NULL DEFAULT 'Available',
    "type" "BedType" NOT NULL DEFAULT 'General',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Bed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OPDToken" (
    "id" TEXT NOT NULL,
    "token_number" INTEGER NOT NULL,
    "patient_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "doctor_id" TEXT,
    "priority" "OPDTokenPriority" NOT NULL DEFAULT 'Normal',
    "status" "OPDTokenStatus" NOT NULL DEFAULT 'Waiting',
    "called_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "OPDToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "symptoms" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "vitals" JSONB,
    "prescriptions" JSONB,
    "labRecommendations" JSONB,
    "admission_recommended" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admission" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "bed_id" TEXT NOT NULL,
    "admitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "AdmissionStatus" NOT NULL DEFAULT 'Admitted',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Admission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Discharge" (
    "id" TEXT NOT NULL,
    "admission_id" TEXT NOT NULL,
    "discharged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    "summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Discharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "generic_name" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "stock_quantity" INTEGER NOT NULL,
    "threshold_quantity" INTEGER NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Medicine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "medicine_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "type" "InventoryTransactionType" NOT NULL,
    "remarks" TEXT,
    "created_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'Active',
    "message" TEXT NOT NULL,
    "severity" "Severity" NOT NULL DEFAULT 'Medium',
    "hospital_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalSync" (
    "id" TEXT NOT NULL,
    "hospital_id" TEXT NOT NULL,
    "last_synced_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sync_status" TEXT NOT NULL,
    "payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HospitalSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "file_url" TEXT,
    "generated_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_code_key" ON "Hospital"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_uhid_key" ON "Patient"("uhid");

-- CreateIndex
CREATE UNIQUE INDEX "Consultation_token_id_key" ON "Consultation"("token_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientHistory" ADD CONSTRAINT "PatientHistory_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ward" ADD CONSTRAINT "Ward_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_ward_id_fkey" FOREIGN KEY ("ward_id") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bed" ADD CONSTRAINT "Bed_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPDToken" ADD CONSTRAINT "OPDToken_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPDToken" ADD CONSTRAINT "OPDToken_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OPDToken" ADD CONSTRAINT "OPDToken_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_token_id_fkey" FOREIGN KEY ("token_id") REFERENCES "OPDToken"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_bed_id_fkey" FOREIGN KEY ("bed_id") REFERENCES "Bed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discharge" ADD CONSTRAINT "Discharge_admission_id_fkey" FOREIGN KEY ("admission_id") REFERENCES "Admission"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medicine" ADD CONSTRAINT "Medicine_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_medicine_id_fkey" FOREIGN KEY ("medicine_id") REFERENCES "Medicine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalSync" ADD CONSTRAINT "HospitalSync_hospital_id_fkey" FOREIGN KEY ("hospital_id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_generated_by_id_fkey" FOREIGN KEY ("generated_by_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
