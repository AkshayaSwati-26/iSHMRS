require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting population of extra clinical sample data...');

  // 1. Fetch default hospital & doctor
  const defaultHospital = await prisma.hospital.findFirst({
    where: { code: 'CCH01' }
  });
  if (!defaultHospital) {
    console.error('❌ Default hospital not found! Please run regular seed first.');
    return;
  }

  const doctor = await prisma.user.findFirst({
    where: { email: 'doctor@ishrms.com' }
  });
  if (!doctor) {
    console.error('❌ Default doctor not found!');
    return;
  }

  const defaultDept = await prisma.department.findFirst({
    where: { hospitalId: defaultHospital.id }
  });

  // 2. Upsert Extra Metropolitan Hospitals for City Dashboard
  const extraHospitals = [
    {
      name: 'Metropolis General Hospital',
      code: 'MGH01',
      address: '742 Evergreen Terrace, Metropolis West',
      phone: '+1-555-0211'
    },
    {
      name: 'St. Jude Children Hospital',
      code: 'SJC01',
      address: '12 Medical Plaza, Metropolis North',
      phone: '+1-555-0322'
    },
    {
      name: 'Hope Care Sanitarium',
      code: 'HCS01',
      address: '500 Asylum Ridge Road, Metropolis East',
      phone: '+1-555-0433'
    }
  ];

  const seededHospitals = [];
  for (const eh of extraHospitals) {
    const hosp = await prisma.hospital.upsert({
      where: { code: eh.code },
      update: {},
      create: eh
    });
    seededHospitals.push(hosp);
    console.log(`Hospital node upserted: ${hosp.name} (${hosp.code})`);
  }

  // 3. Create Latest Sync logs with rich comparative metrics for all hospitals
  const syncs = [
    {
      hospitalId: defaultHospital.id,
      syncStatus: 'SUCCESS',
      payload: { availableBeds: 18, occupiedBeds: 34, queueSize: 15, medicineShortages: 2, emergencyAlerts: 1 }
    },
    {
      hospitalId: seededHospitals[0].id,
      syncStatus: 'SUCCESS',
      payload: { availableBeds: 45, occupiedBeds: 92, queueSize: 28, medicineShortages: 5, emergencyAlerts: 2 }
    },
    {
      hospitalId: seededHospitals[1].id,
      syncStatus: 'SUCCESS',
      payload: { availableBeds: 24, occupiedBeds: 18, queueSize: 6, medicineShortages: 0, emergencyAlerts: 0 }
    },
    {
      hospitalId: seededHospitals[2].id,
      syncStatus: 'SUCCESS',
      payload: { availableBeds: 12, occupiedBeds: 48, queueSize: 19, medicineShortages: 8, emergencyAlerts: 3 }
    }
  ];

  for (const s of syncs) {
    await prisma.hospitalSync.create({
      data: {
        hospitalId: s.hospitalId,
        syncStatus: s.syncStatus,
        payload: s.payload
      }
    });
    console.log(`Synced metrics generated for hospital ID: ${s.hospitalId}`);
  }

  // 4. Seed Extra Patient Profiles
  const extraPatients = [
    { uhid: 'UHID-200001', name: 'Deepak Malhotra', age: 54, gender: 'Male', bloodGroup: 'A+', phone: '9822334455', address: 'Apartment 4B, Skyview, Metropolis' },
    { uhid: 'UHID-200002', name: 'Asha Varma', age: 31, gender: 'Female', bloodGroup: 'B-', phone: '9833445566', address: '18, Green Meadows, Metropolis' },
    { uhid: 'UHID-200003', name: 'Sunita Rao', age: 67, gender: 'Female', bloodGroup: 'AB+', phone: '9844556677', address: 'Block D, Heritage Heights, Metropolis' },
    { uhid: 'UHID-200004', name: 'George DSouza', age: 45, gender: 'Male', bloodGroup: 'O-', phone: '9855667788', address: 'Flat 102, Ocean Breeze, Metropolis' },
    { uhid: 'UHID-200005', name: 'Jennifer Lawrence', age: 29, gender: 'Female', bloodGroup: 'A-', phone: '9866778899', address: '78, Beverly Park, Metropolis' },
    { uhid: 'UHID-200006', name: 'Kabir Khan', age: 38, gender: 'Male', bloodGroup: 'O+', phone: '9877889900', address: '49, Victoria Boulevard, Metropolis' },
    { uhid: 'UHID-200007', name: 'Vikram Rathore', age: 62, gender: 'Male', bloodGroup: 'B+', phone: '9888990011', address: '10, Cantonment Enclave, Metropolis' },
    { uhid: 'UHID-200008', name: 'Siddharth Sen', age: 24, gender: 'Male', bloodGroup: 'AB-', phone: '9899001122', address: '22, Lakeview Road, Metropolis' },
    { uhid: 'UHID-200009', name: 'Sneha Reddy', age: 41, gender: 'Female', bloodGroup: 'O+', phone: '9900112233', address: '7A, Palm Meadows, Metropolis' },
    { uhid: 'UHID-200010', name: 'Arjun Kapoor', age: 35, gender: 'Male', bloodGroup: 'A+', phone: '9911223344', address: 'Flat 305, Oakwood Crest, Metropolis' }
  ];

  const seededPatients = [];
  for (const ep of extraPatients) {
    const patient = await prisma.patient.upsert({
      where: { uhid: ep.uhid },
      update: {},
      create: ep
    });
    seededPatients.push(patient);
    console.log(`Extra patient record loaded: ${patient.name}`);
  }

  // 5. Seed Extra Medicine Stock Items for Inventory Module
  const extraMedicines = [
    { name: 'Aspirin 81mg', genericName: 'Acetylsalicylic Acid', batchNumber: 'BATCH-ASP12', manufacturer: 'Bayer', purchaseDate: new Date('2026-02-10'), expiryDate: new Date('2028-01-31'), unitPrice: 1.20, stockQuantity: 800, thresholdQuantity: 100 },
    { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', batchNumber: 'BATCH-IBU98', manufacturer: 'Advil Inc', purchaseDate: new Date('2026-03-05'), expiryDate: new Date('2027-11-30'), unitPrice: 3.50, stockQuantity: 600, thresholdQuantity: 80 },
    { name: 'Lipitor 10mg', genericName: 'Atorvastatin Calcium', batchNumber: 'BATCH-LIP07', manufacturer: 'Pfizer', purchaseDate: new Date('2026-01-15'), expiryDate: new Date('2028-06-30'), unitPrice: 18.50, stockQuantity: 400, thresholdQuantity: 50 },
    { name: 'Zithromax 250mg', genericName: 'Azithromycin', batchNumber: 'BATCH-ZIT55', manufacturer: 'Sandoz', purchaseDate: new Date('2026-02-22'), expiryDate: new Date('2027-05-15'), unitPrice: 22.00, stockQuantity: 18, thresholdQuantity: 30 }, // Low Stock!
    { name: 'Lantus Insulin 100IU', genericName: 'Insulin Glargine', batchNumber: 'BATCH-INS21', manufacturer: 'Sanofi', purchaseDate: new Date('2025-12-01'), expiryDate: new Date('2026-08-10'), unitPrice: 65.00, stockQuantity: 120, thresholdQuantity: 20 },
    { name: 'Ventolin HFA', genericName: 'Albuterol Sulfate', batchNumber: 'BATCH-VEN83', manufacturer: 'GSK', purchaseDate: new Date('2026-04-01'), expiryDate: new Date('2028-04-30'), unitPrice: 45.00, stockQuantity: 200, thresholdQuantity: 25 },
    { name: 'Cozaar 50mg', genericName: 'Losartan Potassium', batchNumber: 'BATCH-COZ09', manufacturer: 'Merck', purchaseDate: new Date('2025-08-10'), expiryDate: new Date('2026-05-01'), unitPrice: 5.40, stockQuantity: 350, thresholdQuantity: 40 }, // Already Expired!
    { name: 'Synthroid 75mcg', genericName: 'Levothyroxine Sodium', batchNumber: 'BATCH-SYN32', manufacturer: 'AbbVie', purchaseDate: new Date('2026-01-20'), expiryDate: new Date('2027-10-15'), unitPrice: 9.80, stockQuantity: 500, thresholdQuantity: 60 },
    { name: 'Lasix 40mg', genericName: 'Furosemide', batchNumber: 'BATCH-LAS41', manufacturer: 'Sanofi', purchaseDate: new Date('2026-03-10'), expiryDate: new Date('2027-12-31'), unitPrice: 2.80, stockQuantity: 8, thresholdQuantity: 20 }, // Low Stock!
    { name: 'Zoloft 50mg', genericName: 'Sertraline Hydrochloride', batchNumber: 'BATCH-ZOL76', manufacturer: 'Viatris', purchaseDate: new Date('2026-02-18'), expiryDate: new Date('2028-02-28'), unitPrice: 14.20, stockQuantity: 250, thresholdQuantity: 30 }
  ];

  for (const em of extraMedicines) {
    const med = await prisma.medicine.create({
      data: {
        ...em,
        hospitalId: defaultHospital.id
      }
    });
    console.log(`Extra medicine stock loaded: ${med.name}`);
  }

  // 6. Seed Sample Appointments for Appointments module
  const appointmentSlots = [
    { patientIdx: 0, dateOffset: -1, slot: '09:00 AM - 09:30 AM', status: 'Completed', notes: 'Completed checkup for chronic headache' },
    { patientIdx: 1, dateOffset: 0, slot: '10:00 AM - 10:30 AM', status: 'Scheduled', notes: 'Consultation for joint pain' },
    { patientIdx: 2, dateOffset: 0, slot: '11:30 AM - 12:00 PM', status: 'Scheduled', notes: 'Hypertension follow-up' },
    { patientIdx: 3, dateOffset: 1, slot: '02:00 PM - 02:30 PM', status: 'Scheduled', notes: 'General physical assessment' },
    { patientIdx: 4, dateOffset: 1, slot: '03:30 PM - 04:00 PM', status: 'Cancelled', notes: 'Patient requested cancellation' },
    { patientIdx: 5, dateOffset: 2, slot: '11:00 AM - 11:30 AM', status: 'Scheduled', notes: 'Reviewing recent ECG graphs' },
    { patientIdx: 6, dateOffset: 2, slot: '12:30 PM - 01:00 PM', status: 'Scheduled', notes: 'Prescription renewal request' },
    { patientIdx: 7, dateOffset: 3, slot: '09:30 AM - 10:00 AM', status: 'Scheduled', notes: 'First consultations for skin rash' }
  ];

  for (const app of appointmentSlots) {
    const appDate = new Date();
    appDate.setDate(appDate.getDate() + app.dateOffset);
    appDate.setHours(10, 0, 0, 0); // normalize time

    await prisma.appointment.create({
      data: {
        patientId: seededPatients[app.patientIdx].id,
        doctorId: doctor.id,
        departmentId: defaultDept.id,
        appointmentDate: appDate,
        timeSlot: app.slot,
        status: app.status,
        notes: app.notes
      }
    });
    console.log(`Appointment seeded for patient: ${seededPatients[app.patientIdx].name} at slot: ${app.slot}`);
  }

  // 7. Seed Active OPD Waiting Tokens
  const opdTokens = [
    { tokenNum: 101, patientIdx: 8, priority: 'Normal', status: 'Waiting' },
    { tokenNum: 102, patientIdx: 9, priority: 'Emergency', status: 'Waiting' }
  ];

  for (const ot of opdTokens) {
    await prisma.oPDToken.create({
      data: {
        tokenNumber: ot.tokenNum,
        patientId: seededPatients[ot.patientIdx].id,
        departmentId: defaultDept.id,
        doctorId: doctor.id,
        priority: ot.priority,
        status: ot.status
      }
    });
    console.log(`Active OPD queue token generated: Token #${ot.tokenNum}`);
  }

  // 8. Seed Sample Active alerts
  const sampleAlerts = [
    { type: 'LowStock', message: 'Medicine stock alert: "Zithromax 250mg" is below threshold (18 units remaining).', severity: 'High' },
    { type: 'LowStock', message: 'Medicine stock alert: "Lasix 40mg" is severely low (8 units remaining).', severity: 'Critical' },
    { type: 'MedicineExpiry', message: 'Medicine expiry alert: "Cozaar 50mg" (Batch BATCH-COZ09) expired on 2026-05-01.', severity: 'Critical' }
  ];

  for (const sa of sampleAlerts) {
    await prisma.alert.create({
      data: {
        type: sa.type,
        message: sa.message,
        severity: sa.severity,
        hospitalId: defaultHospital.id,
        status: 'Active'
      }
    });
    console.log(`Seeded active warning flag: ${sa.message}`);
  }

  console.log('🌱 Extra clinical sample datasets loaded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
