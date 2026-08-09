require('dotenv').config();
const prisma = require('./src/config/prisma');
const bcrypt = require('bcryptjs');

async function seedEverything() {
  console.log('🚀 SEEDING 100% COMPLETE MASTER DATASET ACROSS ALL MODULES & TABLES...\n');

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
    console.log('✅ 7 Roles initialized.');

    // 2. Hospitals (For City Dashboard & Multi-Hospital Monitoring)
    const hospital1 = await prisma.hospital.upsert({
      where: { code: 'CCH01' },
      update: {},
      create: {
        name: 'City Central Hospital & Research Center',
        code: 'CCH01',
        address: '123 Healthcare Boulevard, Metro City',
        phone: '+91-98765-00000'
      }
    });

    const hospital2 = await prisma.hospital.upsert({
      where: { code: 'MGH02' },
      update: {},
      create: {
        name: 'Metro General Hospital',
        code: 'MGH02',
        address: '45 Civic Center Drive, North City',
        phone: '+91-98765-11111'
      }
    });

    const hospital3 = await prisma.hospital.upsert({
      where: { code: 'SJH03' },
      update: {},
      create: {
        name: 'Apex Super Specialty Care',
        code: 'SJH03',
        address: '88 Ring Road, South City',
        phone: '+91-98765-22222'
      }
    });
    console.log(`✅ 3 Hospitals initialized: ${hospital1.name}, ${hospital2.name}, ${hospital3.name}`);

    // 3. Departments
    const deptNames = [
      'General Medicine',
      'Cardiology',
      'Emergency & Trauma',
      'Pediatrics',
      'Orthopedics',
      'Neurology',
      'Oncology',
      'Intensive Care Unit (ICU)'
    ];

    const depts = {};
    for (const name of deptNames) {
      depts[name] = await prisma.department.findFirst({ where: { name, hospitalId: hospital1.id } }) ||
        await prisma.department.create({ data: { name, hospitalId: hospital1.id } });
    }
    console.log('✅ 8 Departments initialized.');

    // 4. Staff Users Across Roles
    const staffList = [
      { email: 'superadmin@ishrms.com', firstName: 'Super', lastName: 'Admin', role: roles.SUPER_ADMIN, hospitalId: null },
      { email: 'admin@ishrms.com', firstName: 'Rajesh', lastName: 'Kumar', role: roles.ADMIN, hospitalId: hospital1.id },
      { email: 'doctor@ishrms.com', firstName: 'Anant', lastName: 'Sharma', role: roles.DOCTOR, hospitalId: hospital1.id },
      { email: 'cardio.doc@ishrms.com', firstName: 'Sunita', lastName: 'Rao', role: roles.DOCTOR, hospitalId: hospital1.id },
      { email: 'ortho.doc@ishrms.com', firstName: 'Vikram', lastName: 'Aditya', role: roles.DOCTOR, hospitalId: hospital1.id },
      { email: 'nurse@ishrms.com', firstName: 'Swati', lastName: 'Patel', role: roles.NURSE, hospitalId: hospital1.id },
      { email: 'receptionist@ishrms.com', firstName: 'Rahul', lastName: 'Verma', role: roles.RECEPTIONIST, hospitalId: hospital1.id },
      { email: 'pharmacist@ishrms.com', firstName: 'Amit', lastName: 'Gupta', role: roles.PHARMACIST, hospitalId: hospital1.id }
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
    console.log('✅ 8 Staff users initialized.');

    // 5. Patients (Demo Patient + Historical Patients)
    const patientData = [
      { uhid: 'UHID-20260731-99999', name: 'Rahul Sharma', age: 32, gender: 'Male', bloodGroup: 'O+', phone: '9998887770', email: 'patient@ishrms.com', address: '45, Heritage Park, Metro City', isPortal: true },
      { uhid: 'UHID-100001', name: 'Rohan Sharma', age: 42, gender: 'Male', bloodGroup: 'O+', phone: '9876543210', email: 'rohan.s@gmail.com', address: '45, Park Street, Metropolis', isPortal: false },
      { uhid: 'UHID-100002', name: 'Priya Patel', age: 28, gender: 'Female', bloodGroup: 'B+', phone: '8765432109', email: 'priya.p@gmail.com', address: 'Block C, Sunrise Apts, Metropolis', isPortal: false },
      { uhid: 'UHID-20260801-10001', name: 'Kavita Verma', age: 54, gender: 'Female', bloodGroup: 'A+', phone: '9876543211', email: 'kavita@gmail.com', address: '12 Green Avenue, Metro City', isPortal: false },
      { uhid: 'UHID-20260801-10002', name: 'Ramesh Gupta', age: 68, gender: 'Male', bloodGroup: 'AB+', phone: '9876543212', email: 'ramesh@gmail.com', address: '78 Senior Citizens Complex', isPortal: false },
      { uhid: 'UHID-20260801-10003', name: 'Neha Kapoor', age: 31, gender: 'Female', bloodGroup: 'O-', phone: '9876543213', email: 'neha.k@gmail.com', address: '99 Cyber Towers, Metro City', isPortal: false },
      { uhid: 'UHID-20260801-10004', name: 'Vikram Singh', age: 49, gender: 'Male', bloodGroup: 'B-', phone: '9876543214', email: 'vikram.s@gmail.com', address: '304 Fort Road, Metro City', isPortal: false }
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
          address: p.address,
          emergencyContactName: 'Family Contact',
          emergencyContactPhone: '9991112223',
          userId
        }
      });
    }
    console.log('✅ 7 Patients & Portal User accounts initialized.');

    // 6. Wards, Rooms, and Beds in all statuses (Available, Occupied, Cleaning, Maintenance)
    const wardGM = await prisma.ward.create({
      data: { name: 'General Medicine Ward A', type: 'General', departmentId: depts['General Medicine'].id }
    });
    const wardICU = await prisma.ward.create({
      data: { name: 'Intensive Care Unit (ICU)', type: 'ICU', departmentId: depts['Intensive Care Unit (ICU)'].id }
    });
    const wardER = await prisma.ward.create({
      data: { name: 'Trauma & Emergency Ward', type: 'Emergency', departmentId: depts['Emergency & Trauma'].id }
    });
    const wardCardio = await prisma.ward.create({
      data: { name: 'Cardiac Care Unit (CCU)', type: 'ICU', departmentId: depts['Cardiology'].id }
    });

    const roomGM1 = await prisma.room.create({ data: { name: 'Room 101', wardId: wardGM.id } });
    const roomGM2 = await prisma.room.create({ data: { name: 'Room 102', wardId: wardGM.id } });
    const roomICU1 = await prisma.room.create({ data: { name: 'ICU Bay 1', wardId: wardICU.id } });
    const roomER1 = await prisma.room.create({ data: { name: 'ER Bed Bay', wardId: wardER.id } });

    const bedDefs = [
      { label: 'G-101-A', room: roomGM1, type: 'General', status: 'Available' },
      { label: 'G-101-B', room: roomGM1, type: 'General', status: 'Occupied' },
      { label: 'G-101-C', room: roomGM1, type: 'General', status: 'Cleaning' },
      { label: 'G-102-A', room: roomGM2, type: 'General', status: 'Available' },
      { label: 'G-102-B', room: roomGM2, type: 'General', status: 'Maintenance' },
      { label: 'ICU-B1-01', room: roomICU1, type: 'ICU', status: 'Occupied' },
      { label: 'ICU-B1-02', room: roomICU1, type: 'ICU', status: 'Available' },
      { label: 'ER-BAY-01', room: roomER1, type: 'Emergency', status: 'Occupied' },
      { label: 'ER-BAY-02', room: roomER1, type: 'Emergency', status: 'Available' },
      { label: 'ER-BAY-03', room: roomER1, type: 'Emergency', status: 'Available' }
    ];

    const bedsMap = {};
    for (const b of bedDefs) {
      bedsMap[b.label] = await prisma.bed.create({
        data: { label: b.label, roomId: b.room.id, type: b.type, status: b.status }
      });
    }
    console.log('✅ Wards, Rooms & 10 Beds in various states initialized.');

    // 7. Admissions
    const mainPatient = patients['UHID-20260731-99999'];
    await prisma.admission.create({
      data: {
        patientId: mainPatient.id,
        departmentId: depts['General Medicine'].id,
        doctorId: users['doctor@ishrms.com'].id,
        bedId: bedsMap['G-101-B'].id,
        status: 'Admitted',
        admittedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000)
      }
    });

    await prisma.admission.create({
      data: {
        patientId: patients['UHID-20260801-10002'].id,
        departmentId: depts['Intensive Care Unit (ICU)'].id,
        doctorId: users['cardio.doc@ishrms.com'].id,
        bedId: bedsMap['ICU-B1-01'].id,
        status: 'Admitted',
        admittedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000)
      }
    });
    await prisma.patient.update({ where: { id: mainPatient.id }, data: { isAdmitted: true } });
    console.log('✅ Inpatient Admissions initialized.');

    // 8. OPD Queue Tokens across Priorities (Normal, SeniorCitizen, Pregnancy, Emergency)
    const tokenConsult = await prisma.oPDToken.create({
      data: { tokenNumber: 100, patientId: mainPatient.id, departmentId: depts['General Medicine'].id, doctorId: users['doctor@ishrms.com'].id, priority: 'Normal', status: 'Completed' }
    });

    const opdTokens = [
      { tokenNumber: 101, patientId: mainPatient.id, departmentId: depts['General Medicine'].id, doctorId: users['doctor@ishrms.com'].id, priority: 'Normal', status: 'Waiting' },
      { tokenNumber: 102, patientId: patients['UHID-20260801-10002'].id, departmentId: depts['Cardiology'].id, doctorId: users['cardio.doc@ishrms.com'].id, priority: 'SeniorCitizen', status: 'Waiting' },
      { tokenNumber: 103, patientId: patients['UHID-20260801-10003'].id, departmentId: depts['Emergency & Trauma'].id, doctorId: users['doctor@ishrms.com'].id, priority: 'Emergency', status: 'InConsultation' },
      { tokenNumber: 104, patientId: patients['UHID-100002'].id, departmentId: depts['Pediatrics'].id, doctorId: users['doctor@ishrms.com'].id, priority: 'Pregnancy', status: 'Waiting' },
      { tokenNumber: 105, patientId: patients['UHID-20260801-10001'].id, departmentId: depts['Orthopedics'].id, doctorId: users['ortho.doc@ishrms.com'].id, priority: 'Normal', status: 'Waiting' }
    ];

    for (const t of opdTokens) {
      await prisma.oPDToken.create({ data: t });
    }
    console.log('✅ 6 OPD Queue Tokens initialized.');

    // 9. Appointments
    const appointments = [
      { patientId: mainPatient.id, doctorId: users['doctor@ishrms.com'].id, departmentId: depts['General Medicine'].id, appointmentDate: new Date(Date.now() + 24 * 3600 * 1000), timeSlot: '10:30 AM', status: 'Scheduled', notes: 'Routine checkup for BP and fatigue.' },
      { patientId: patients['UHID-100001'].id, doctorId: users['cardio.doc@ishrms.com'].id, departmentId: depts['Cardiology'].id, appointmentDate: new Date(Date.now() + 48 * 3600 * 1000), timeSlot: '02:00 PM', status: 'Scheduled', notes: 'Echocardiogram review.' },
      { patientId: patients['UHID-100002'].id, doctorId: users['ortho.doc@ishrms.com'].id, departmentId: depts['Orthopedics'].id, appointmentDate: new Date(Date.now() + 72 * 3600 * 1000), timeSlot: '11:00 AM', status: 'Scheduled', notes: 'Knee joint pain consultation.' }
    ];
    for (const a of appointments) {
      await prisma.appointment.create({ data: a });
    }
    console.log('✅ 3 Scheduled Appointments initialized.');

    // 10. Consultations & Prescriptions
    await prisma.consultation.create({
      data: {
        tokenId: tokenConsult.id,
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

    // 11. Pharmacy Medicines Inventory (Stock, Low-Stock Warnings & Expiry Warnings)
    const medicinesData = [
      { name: 'Paracetamol 650mg', genericName: 'Acetaminophen', batchNumber: 'BATCH-P25', manufacturer: 'GSK Pharma', purchaseDate: new Date('2026-01-10'), expiryDate: new Date('2027-12-31'), unitPrice: 2.50, stockQuantity: 500, thresholdQuantity: 50, hospitalId: hospital1.id },
      { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', batchNumber: 'BATCH-A88', manufacturer: 'Abbott Labs', purchaseDate: new Date('2026-02-15'), expiryDate: new Date('2027-06-30'), unitPrice: 12.00, stockQuantity: 40, thresholdQuantity: 50, hospitalId: hospital1.id }, // Low stock!
      { name: 'Metformin 850mg', genericName: 'Metformin Hydrochloride', batchNumber: 'BATCH-M12', manufacturer: 'Pfizer', purchaseDate: new Date('2025-06-01'), expiryDate: new Date('2026-07-15'), unitPrice: 4.80, stockQuantity: 300, thresholdQuantity: 30, hospitalId: hospital1.id },
      { name: 'Cough Syrup (Ascoril) 100ml', genericName: 'Levosalbutamol + Ambroxol', batchNumber: 'BATCH-C44', manufacturer: 'Glenmark', purchaseDate: new Date('2025-11-20'), expiryDate: new Date('2026-04-10'), unitPrice: 85.00, stockQuantity: 150, thresholdQuantity: 20, hospitalId: hospital1.id }, // Expired!
      { name: 'Pantocid 40mg', genericName: 'Pantoprazole', batchNumber: 'BATCH-PAN99', manufacturer: 'Sun Pharma', purchaseDate: new Date('2026-03-01'), expiryDate: new Date('2028-02-28'), unitPrice: 6.20, stockQuantity: 1000, thresholdQuantity: 100, hospitalId: hospital1.id },
      { name: 'Azithromycin 500mg', genericName: 'Azithromycin', batchNumber: 'BATCH-AZ55', manufacturer: 'Cipla', purchaseDate: new Date('2026-01-01'), expiryDate: new Date('2027-10-10'), unitPrice: 22.50, stockQuantity: 250, thresholdQuantity: 30, hospitalId: hospital1.id },
      { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin Calcium', batchNumber: 'BATCH-AT10', manufacturer: 'Lupin', purchaseDate: new Date('2026-02-01'), expiryDate: new Date('2028-01-15'), unitPrice: 9.50, stockQuantity: 600, thresholdQuantity: 50, hospitalId: hospital1.id }
    ];

    for (const m of medicinesData) {
      await prisma.medicine.create({ data: m });
    }
    console.log('✅ 7 Pharmacy Stock items initialized (with low-stock & expiry alerts).');

    // 12. Lab Tests Catalog & Orders
    const standardTests = [
      { code: 'CBC-01', name: 'Complete Blood Count (CBC)', category: 'Hematology', sampleType: 'Blood', referenceRange: 'Hb: 12-16 g/dL, WBC: 4000-11000', unit: 'g/dL', price: 450 },
      { code: 'LFT-01', name: 'Liver Function Test (LFT)', category: 'Biochemistry', sampleType: 'Blood', referenceRange: 'Bilirubin: 0.3-1.2, SGOT: 10-40', unit: 'mg/dL', price: 850 },
      { code: 'KFT-01', name: 'Kidney Function Test (KFT)', category: 'Biochemistry', sampleType: 'Blood', referenceRange: 'Urea: 15-45, Creatinine: 0.6-1.2', unit: 'mg/dL', price: 750 },
      { code: 'LIP-01', name: 'Lipid Profile', category: 'Biochemistry', sampleType: 'Blood', referenceRange: 'Cholesterol: <200, Triglycerides: <150', unit: 'mg/dL', price: 900 },
      { code: 'CXR-01', name: 'Chest X-Ray PA View', category: 'Radiology', sampleType: 'Imaging', referenceRange: 'Normal lung fields & heart size', unit: 'N/A', price: 600 },
      { code: 'UR-01', name: 'Urine Routine & Microscopy', category: 'Microbiology', sampleType: 'Urine', referenceRange: 'Pus cells: 0-2, Protein: Nil', unit: 'HPF', price: 300 }
    ];

    const labTestsMap = {};
    for (const t of standardTests) {
      labTestsMap[t.code] = await prisma.labTest.upsert({
        where: { code: t.code },
        update: {},
        create: t
      });
    }

    const labTS = Date.now();
    await prisma.labOrder.create({
      data: {
        orderNumber: `LAB-ORD-${labTS}-1`,
        patientId: mainPatient.id,
        orderedById: users['doctor@ishrms.com'].id,
        priority: 'STAT',
        status: 'Resulted',
        notes: 'Check CBC for infection & LFT for drug safety',
        items: {
          create: [
            { labTestId: labTestsMap['CBC-01'].id, sampleCollectedAt: new Date(), resultValue: '14.5', resultUnit: 'g/dL', isAbnormal: false, isCritical: false, resultedAt: new Date(), resultedById: users['doctor@ishrms.com'].id },
            { labTestId: labTestsMap['LFT-01'].id, sampleCollectedAt: new Date(), resultValue: '48', resultUnit: 'U/L', isAbnormal: true, isCritical: false, resultNotes: 'Slightly elevated SGOT', resultedAt: new Date(), resultedById: users['doctor@ishrms.com'].id }
          ]
        }
      }
    });

    await prisma.labOrder.create({
      data: {
        orderNumber: `LAB-ORD-${labTS}-2`,
        patientId: patients['UHID-100001'].id,
        orderedById: users['cardio.doc@ishrms.com'].id,
        priority: 'Urgent',
        status: 'SampleCollected',
        notes: 'Cardiac Lipid Evaluation',
        items: {
          create: [
            { labTestId: labTestsMap['LIP-01'].id, sampleCollectedAt: new Date() }
          ]
        }
      }
    });
    console.log('✅ 6 Lab Catalog tests & 2 Lab Orders initialized.');

    // 13. Billing & Payment Transactions
    const billTS = Date.now();
    await prisma.bill.create({
      data: {
        billNumber: `BILL-${billTS}-1`,
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

    await prisma.bill.create({
      data: {
        billNumber: `BILL-${billTS}-2`,
        patientId: patients['UHID-100001'].id,
        status: 'PartiallyPaid',
        subtotal: 3500,
        taxAmount: 350,
        discountAmount: 0,
        totalAmount: 3850,
        paidAmount: 2000,
        balanceAmount: 1850,
        notes: 'IPD Ward Admission Advance',
        generatedById: users['receptionist@ishrms.com'].id,
        items: {
          create: [
            { type: 'Bed', description: 'General Ward Bed Charge (2 Days)', quantity: 2, unitPrice: 1500, totalPrice: 3000 },
            { type: 'Procedure', description: 'Nursing & Telemetry Monitoring', quantity: 1, unitPrice: 500, totalPrice: 500 }
          ]
        },
        payments: {
          create: [
            { amount: 2000, method: 'Cash', referenceNumber: 'CASH-REC-101', notes: 'Cash advance payment', processedById: users['receptionist@ishrms.com'].id }
          ]
        }
      }
    });
    console.log('✅ Invoices & Payment Transactions initialized.');

    // 14. Patient Portal Specific Records
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
        hospitalId: hospital1.id,
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

    // 15. Audit Logs for Traceability
    const auditEvents = [
      { userId: users['receptionist@ishrms.com'].id, action: 'PATIENT_REGISTERED', details: 'Registered patient Rahul Sharma (UHID-20260731-99999)', ipAddress: '127.0.0.1' },
      { userId: users['doctor@ishrms.com'].id, action: 'CONSULTATION_COMPLETED', details: 'Completed OPD consultation for token #100', ipAddress: '127.0.0.1' },
      { userId: users['nurse@ishrms.com'].id, action: 'BED_ALLOCATED', details: 'Allocated bed G-101-B to patient Rahul Sharma', ipAddress: '127.0.0.1' },
      { userId: users['pharmacist@ishrms.com'].id, action: 'MEDICINE_DISPENSED', details: 'Dispensed Paracetamol 650mg and Amoxicillin 500mg', ipAddress: '127.0.0.1' }
    ];
    for (const log of auditEvents) {
      await prisma.auditLog.create({ data: log });
    }
    console.log('✅ 4 System Audit Logs initialized.');

    console.log('\n🎉 100% COMPLETE MASTER DATASET SEEDED ACROSS ALL MODULES & TABLES SUCCESSFULLY!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding Error:', err);
    process.exit(1);
  }
}

seedEverything();
