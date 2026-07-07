-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('Scheduled', 'Completed', 'Cancelled', 'NoShow');

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "appointment_date" TIMESTAMP(3) NOT NULL,
    "time_slot" TEXT NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'Scheduled',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
