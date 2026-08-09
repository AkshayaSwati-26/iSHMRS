require('dotenv').config();
const prisma = require('./src/config/prisma');
const bcrypt = require('bcryptjs');

async function seedRichData() {
  console.log('🚀 SEEDING COMPREHENSIVE PRODUCTION-GRADE DEMO DATA FOR ALL MODULES...\n');

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Roles
    const roleNames = ['SUPER_ADMIN', 'ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST', 'PHARMACIST', 'PATIENT'];
    const roles = {};
    for (const name of roleNames) {
      roles[name] = await prisma.role.upsert({
        where: { name },
        update: {},
        create: { name }
      });
    }
    console.log('✅ Roles initialized.');

    // 2. Hospital
    const hospital = await prisma.hospital.upsert({
      where: { code: 'CCH01' },
      update: {},
      create: {
        name: 'City Central Hospital & Research Center',
        code: 'CCH01',
        address: '123 Healthcare Boulevard, Metro City',
        phone: '+91-98765-00000'
      }
    });
    console.log(`✅ Hospital: ${hospital.name}`);

    // 3. Departments
    const deptNames = ['General Medicine', 'Cardiology', 'Emergency & Trauma', 'Pediatrics', 'Orthopedics', 'Neurology'];
    const depts = {};
    for (const name of deptNames) {
      depts[name] = await prisma.department.findFirst({ where: { name, hospitalId: hospital.id } }) ||
        await prisma.department.create({ data: { name, hospitalId: hospital.id } });
    }
    console.log('✅ 6 Departments initialized.');

    // 4. Staff Users
    const staffList = [
      { email: 'superadmin@ishrms.com', firstName: 'Super', lastName: 'Admin', role: roles.SUPER_ADMIN, hospitalId: null },
      { email: 'admin@ishrms.com', firstName: 'Rajesh', lastName: 'Kumar', role: roles.ADMIN, hospitalId: hospital.id },
      { email: 'doctor@ishrms.com', firstName: 'Anant', lastName: 'Sharma', role: roles.DOCTOR, hospitalId: hospital.id },
      { email: 'cardio.doc@ishrms.com', firstName: 'Sunita', lastName: 'Rao', role: roles.DOCTOR, hospitalId: hospital.id },
      { email: 'nurse@ishrms.com', firstName: 'Swati', lastName: 'Patel', role: roles.NURSE, hospitalId: hospital.id },
      { email: 'receptionist@ishrms.com', firstName: 'Rahul', lastName: 'Verma', role: roles.RECEPTIONIST, hospitalId: hospital.id },
      { email: 'pharmacist@ishrms.com', firstName: 'Amit', lastName: 'Gupta', role: roles.PHARMACIST, hospitalId: hospital.id }
    ];

    const users = {};
    for (const s of staffList) {
      users[s.email] = await prisma.user.upsert({
        where: { email: s.email },
        update: { password: hashedPassword },
        create: {
          email: s.email,
          password: hashedPassword,
          firstName: s.firstName,
          lastName: s.lastName,
          roleId: s.role.id,
          hospitalId: s.hospitalId
        }
      });
    }
    console.log('✅ Staff users initialized.');

    // 5. Patients & Portal User Accounts
    const patientData = [
      { uhid: 'UHID-20260731-99999', name: 'Rahul Sharma', age: 32, gender: 'Male', bloodGroup: 'O+', phone: '9998887770', email: 'patient@ishrms.com', isPortal: true },
      { uhid: 'UHID-20260801-10001', name: 'Priya Verma', age: 28, gender: 'Female', bloodGroup: 'B+', phone: '9876543211', email: 'priya@gmail.com', isPortal: false },
      { uhid: 'UHID-20260801-10002', name: 'Ramesh Gupta', age: 64, gender: 'Male', bloodGroup: 'A+', phone: '9876543212', email: 'ramesh@gmail.com', isPortal: false },
      { uhid: 'UHID-20260801-10003', name: 'Neha Kapoor', age: 35, gender: 'Female', bloodGroup: 'AB+', phone: '9876543213', email: 'neha@gmail.com', isPortal: false },
      { uhid: 'UHID-20260801-10004', name: 'Vikram Singh', age: 50, gender: 'Male', bloodGroup: 'O-', phone: '9876543214', email: 'vikram@gmail.com', isPortal: false }
    ];

    const patients = {};
    for (const p of patientData) {
      let userId = null;
      if (p.isPortal) {
        const portalUser = await prisma.user.upsert({
          where: { email: p.email },
          update: { password: hashedPassword },
          create: {
            email: p.email,
            password: hashedPassword,
            firstName: p.name.split(' ')[0],
            lastName: p.name.split(' ')[1] || '',
            roleId: roles.PATIENT.id
          }
        });
        userId = portalUser.id;
      }

      patients[p.uhid] = await prisma.patient.upsert({
        where: { uhid: p.uhid },
        update: { userId },
        create: {
          uhid: p.uhid,
          name: p.name,
          age: p.age,
          gender: p.gender,
          bloodGroup: p.bloodGroup,
          phone: p.phone,
          email: p.email,
          dateOfBirth: new Date(2026 - p.age, 4, 15),
          address: '45, Heritage Park, Metro City',
          emergencyContactName: 'Family Contact',
          emergencyContactPhone: '9991112223',
          userId
        }
      });
    }
    console.log('✅ 5 Patients & Portal Users initialized.');

    // 6. Wards, Rooms, and Beds
    const ward1 = await prisma.ward.create({
      data: { name: 'General Ward A', type: 'General', departmentId: depts['General Medicine'].id }
    });
    const ward2 = await prisma.ward.create({
      data: { name: 'ICU Cardiac Unit', type: 'ICU', departmentId: depts['Cardiology'].id }
    });

    const room1 = await prisma.room.create({ data: { name: 'Room 101', wardId: ward1.id } });
    const room2 = await prisma.room.create({ data: { name: 'ICU Bay 1', wardId: ward2.id } });

    const bedLabels = [
      { label: 'G-101-A', room: room1, type: 'General', status: 'Available' },
      { label: 'G-101-B', room: room1, type: 'General', status: 'Occupied' },
      { label: 'G-101-C', room: room1, type: 'General', status: 'Cleaning' },
      { label: 'ICU-B1-01', room: room2, type: 'ICU', status: 'Occupied' },
      { label: 'ICU-B1-02', room: room2, type: 'ICU', status: 'Available' }
    ];

    const beds = [];
    for (const b of bedLabels) {
      beds.push(await prisma.bed.create({
        data: { label: b.label, roomId: b.room.id, type: b.type, status: b.status }
      }));
    }
    console.log('✅ Wards, Rooms & Beds initialized.');

    // 7. Admissions
    const mainPatient = patients['UHID-20260731-99999'];
    const activeAdmission = await prisma.admission.create({
      data: {
        patientId: mainPatient.id,
        departmentId: depts['General Medicine'].id,
        doctorId: users['doctor@ishrms.com'].id,
        bedId: beds[1].id, // G-101-B Occupied
        status: 'Admitted',
        admittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      }
    });
    await prisma.patient.update({ where: { id: mainPatient.id }, data: { isAdmitted: true } });
    console.log('✅ Inpatient admission initialized.');

    // 8. OPD Queue Tokens
    const opdTokens = [
      { tokenNumber: 101, patientId: mainPatient.id, departmentId: depts['General Medicine'].id, doctorId: users['doctor@ishrms.com'].id, priority: 'Normal', status: 'Waiting' },
      { tokenNumber: 102, patientId: patients['UHID-20260801-10002'].id, departmentId: depts['Cardiology'].id, doctorId: users['cardio.doc@ishrms.com'].id, priority: 'SeniorCitizen', status: 'Waiting' },
      { tokenNumber: 103, patientId: patients['UHID-20260801-10003'].id, departmentId: depts['Emergency & Trauma'].id, doctorId: users['doctor@ishrms.com'].id, priority: 'Emergency', status: 'InConsultation' }
    ];

    for (const t of opdTokens) {
      await prisma.oPDToken.create({ data: t });
    }
    console.log('✅ 3 OPD Tokens initialized.');

    // 9. Appointments
    const appointments = [
      { patientId: mainPatient.id, doctorId: users['doctor@ishrms.com'].id, departmentId: depts['General Medicine'].id, appointmentDate: new Date(Date.now() + 24 * 3600 * 1000), timeSlot: '10:30 AM', status: 'Scheduled', notes: 'Routine checkup for BP and fatigue.' },
      { patientId: patients['UHID-20260801-10001'].id, doctorId: users['cardio.doc@ishrms.com'].id, departmentId: depts['Cardiology'].id, appointmentDate: new Date(Date.now() + 48 * 3600 * 1000), timeSlot: '02:00 PM', status: 'Scheduled', notes: 'Echocardiogram review.' }
    ];
    for (const a of appointments) {
      await prisma.appointment.create({ data: a });
    }
    console.log('✅ Appointments initialized.');

    // 10. Consultations & Prescriptions
    const consultation = await prisma.consultation.create({
      data: {
        tokenId: (await prisma.oPDToken.findFirst()).id,
        patientId: mainPatient.id,
        doctorId: users['doctor@ishrms.com'].id,
        symptoms: 'Fever, cough, mild breathlessness for 3 days',
        diagnosis: 'Acute Upper Respiratory Tract Infection',
        vitals: { BP: '125/82', HR: '84 bpm', Temp: '100.4 F', SpO2: '97%' },
        prescriptions: [
          { name: 'Paracetamol 650mg', dosage: '1 tablet 3 times a day', duration: '5 days', instructions: 'After meals' },
          { name: 'Amoxicillin 500mg', dosage: '1 capsule twice a day', duration: '7 days', instructions: 'After meals' },
          { name: 'Cough Syrup (Ascoril)', dosage: '2 teaspoonfuls 3 times a day', duration: '5 days', instructions: 'After food' }
        ],
        admissionRecommended: false,
        followUpDate: new Date(Date.now() + 7 * 24 * 3600 * 1000)
      }
    });
    console.log('✅ Consultation & Prescriptions initialized.');

    // 11. Medicines Inventory
    const meds = [
      { name: 'Paracetamol 650mg', genericName: 'Acetaminophen', batchNumber: 'BATCH-P25', manufacturer: 'GSK Pharma', purchaseDate: new Date('2026-01-10'), expiryDate: new Date('2027-12-31'), unitPrice: 2.50, stockQuantity: 500, thresholdQuantity: 50, hospitalId: hospital.id },
      { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', batchNumber: 'BATCH-A88', manufacturer: 'Abbott Labs', purchaseDate: new Date('2026-02-15'), expiryDate: new Date('2027-06-30'), unitPrice: 12.00, stockQuantity: 40, thresholdQuantity: 50, hospitalId: hospital.id },
      { name: 'Pantocid 40mg', genericName: 'Pantoprazole', batchNumber: 'BATCH-PAN99', manufacturer: 'Sun Pharma', purchaseDate: new Date('2026-03-01'), expiryDate: new Date('2028-02-28'), unitPrice: 6.20, stockQuantity: 1000, thresholdQuantity: 100, hospitalId: hospital.id },
      { name: 'Cough Syrup 100ml', genericName: 'Levosalbutamol', batchNumber: 'BATCH-C44', manufacturer: 'Glenmark', purchaseDate: new Date('2025-11-20'), expiryDate: new Date('2026-04-10'), unitPrice: 85.00, stockQuantity: 150, thresholdQuantity: 20, hospitalId: hospital.id }
    ];
    for (const m of meds) {
      await prisma.medicine.create({ data: m });
    }
    console.log('✅ Pharmacy Stock initialized.');

    // 12. Lab Orders & Tests Results
    const labTestCBC = await prisma.labTest.findFirst({ where: { code: 'CBC-01' } });
    const labTestLFT = await prisma.labTest.findFirst({ where: { code: 'LFT-01' } });

    const labOrder = await prisma.labOrder.create({
      data: {
        orderNumber: 'LAB-20260809-9001',
        patientId: mainPatient.id,
        orderedById: users['doctor@ishrms.com'].id,
        priority: 'STAT',
        status: 'Resulted',
        notes: 'Check CBC for infection & LFT for drug safety',
        items: {
          create: [
            { labTestId: labTestCBC.id, sampleCollectedAt: new Date(), resultValue: '14.5', resultUnit: 'g/dL', isAbnormal: false, isCritical: false, resultedAt: new Date(), resultedById: users['doctor@ishrms.com'].id },
            { labTestId: labTestLFT.id, sampleCollectedAt: new Date(), resultValue: '48', resultUnit: 'U/L', isAbnormal: true, isCritical: false, resultNotes: 'Slightly elevated SGOT', resultedAt: new Date(), resultedById: users['doctor@ishrms.com'].id }
          ]
        }
      }
    });
    console.log('✅ Lab Order & Test Results initialized.');

    // 13. Billing & Payment Transactions
    const bill = await prisma.bill.create({
      data: {
        billNumber: 'BILL-20260809-7701',
        patientId: mainPatient.id,
        status: 'Paid',
        subtotal: 1800,
        taxAmount: 180,
        discountAmount: 100,
        totalAmount: 1880,
        paidAmount: 1880,
        balanceAmount: 0,
        notes: 'OPD Consultation + Lab Tests + Pharmacy Medicines',
        generatedById: users['receptionist@ishrms.com'].id,
        items: {
          create: [
            { type: 'Consultation', description: 'General Medicine Consultation Fee', quantity: 1, unitPrice: 500, totalPrice: 500 },
            { type: 'Lab', description: 'Complete Blood Count (CBC)', quantity: 1, unitPrice: 450, totalPrice: 450 },
            { type: 'Lab', description: 'Liver Function Test (LFT)', quantity: 1, unitPrice: 850, totalPrice: 850 }
          ]
        },
        payments: {
          create: [
            { amount: 1880, method: 'UPI', referenceNumber: 'UPI-METRO-998877', notes: 'Paid via GPay', processedById: users['receptionist@ishrms.com'].id }
          ]
        }
      }
    });
    console.log('✅ Invoice & Payment Transactions initialized.');

    // 14. Patient Portal Specific Records (Vitals Logs, Symptoms, Documents, Feedback, Insurance, Med Schedule)
    const vitalsLogs = [
      { patientId: mainPatient.id, type: 'BloodPressure', value: 120, value2: 80, unit: 'mmHg', notes: 'Morning rest measurement', loggedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000) },
      { patientId: mainPatient.id, type: 'BloodPressure', value: 124, value2: 82, unit: 'mmHg', notes: 'Post walk', loggedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
      { patientId: mainPatient.id, type: 'BloodPressure', value: 118, value2: 78, unit: 'mmHg', notes: 'Normal rest', loggedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
      { patientId: mainPatient.id, type: 'BloodSugar', value: 98, unit: 'mg/dL', notes: 'Fasting sugar', loggedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
      { patientId: mainPatient.id, type: 'SpO2', value: 98, unit: '%', notes: 'Normal room air', loggedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000) }
    ];
    for (const v of vitalsLogs) {
      await prisma.patientVitalLog.create({ data: v });
    }

    await prisma.patientSymptomEntry.create({
      data: {
        patientId: mainPatient.id,
        symptoms: ['Mild Fever', 'Dry Cough', 'Headache'],
        severity: 'Moderate',
        notes: 'Fever peaks in evening around 100F'
      }
    });

    await prisma.patientDocument.create({
      data: {
        patientId: mainPatient.id,
        name: 'Blood_Test_Report_August_2026.pdf',
        type: 'LabReport',
        fileUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
        notes: 'CBC & LFT Lab Report'
      }
    });

    await prisma.patientFeedback.create({
      data: {
        patientId: mainPatient.id,
        doctorId: users['doctor@ishrms.com'].id,
        hospitalId: hospital.id,
        rating: 5,
        npsScore: 10,
        comment: 'Dr. Anant Sharma was extremely thorough and attentive during consultation!'
      }
    });

    await prisma.insuranceDetails.upsert({
      where: { patientId: mainPatient.id },
      update: {},
      create: {
        patientId: mainPatient.id,
        provider: 'Star Health Insurance',
        policyNumber: 'POLICY-ST-998877',
        holderName: 'Rahul Sharma',
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-12-31'),
        coverageAmount: 500000
      }
    });

    await prisma.medicationAdherence.create({
      data: {
        patientId: mainPatient.id,
        medicineName: 'Paracetamol 650mg',
        dosage: '1 Tablet',
        scheduledTime: '08:00 AM',
        isTaken: true,
        takenAt: new Date()
      }
    });

    await prisma.medicationAdherence.create({
      data: {
        patientId: mainPatient.id,
        medicineName: 'Amoxicillin 500mg',
        dosage: '1 Capsule',
        scheduledTime: '02:00 PM',
        isTaken: false
      }
    });

    console.log('✅ Patient Portal Vitals, Symptoms, Documents, Insurance & Med Schedule initialized.');

    console.log('\n🎉 COMPREHENSIVE PRODUCTION-GRADE DEMO DATA SEEDED FOR ALL MODULES SUCCESSFULLY!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
}

seedRichData();
