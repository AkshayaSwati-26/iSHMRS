require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting seed...');

  // Check if seeding is already complete
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('⚡ Database already seeded. Skipping seed process.');
    return;
  }

  // 1. Seed Roles
  const roles = [
    { name: 'SUPER_ADMIN' },
    { name: 'ADMIN' },
    { name: 'DOCTOR' },
    { name: 'NURSE' },
    { name: 'RECEPTIONIST' },
    { name: 'PHARMACIST' }
  ];

  const seededRoles = {};
  for (const r of roles) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: {},
      create: { name: r.name }
    });
    seededRoles[r.name] = role;
    console.log(`Role upserted: ${role.name}`);
  }

  // 2. Seed Default Hospital
  const hospital = await prisma.hospital.upsert({
    where: { code: 'CCH01' },
    update: {},
    create: {
      name: 'City Central Hospital',
      code: 'CCH01',
      address: '123 Healthcare Blvd, Metropolis',
      phone: '+1-555-0199'
    }
  });
  console.log(`Hospital upserted: ${hospital.name} (${hospital.code})`);

  // 3. Seed Departments
  const depts = [
    { name: 'General Medicine' },
    { name: 'Cardiology' },
    { name: 'Pediatrics' },
    { name: 'Orthopedics' },
    { name: 'Emergency' }
  ];

  const seededDepts = {};
  for (const d of depts) {
    const dept = await prisma.department.create({
      data: {
        name: d.name,
        hospitalId: hospital.id
      }
    });
    seededDepts[d.name] = dept;
    console.log(`Department created: ${dept.name}`);
  }

  // 4. Seed Wards, Rooms, and Beds
  // For General Medicine, create General and ICU wards
  const gmWards = [
    { name: 'General Medicine Ward A', type: 'General' },
    { name: 'Medicine ICU', type: 'ICU' }
  ];

  for (const w of gmWards) {
    const ward = await prisma.ward.create({
      data: {
        name: w.name,
        type: w.type,
        departmentId: seededDepts['General Medicine'].id
      }
    });

    // Create 2 rooms in this ward
    for (let rNum = 1; rNum <= 2; rNum++) {
      const room = await prisma.room.create({
        data: {
          name: `${w.name} - Room ${rNum}`,
          wardId: ward.id
        }
      });

      // Create 3 beds in each room
      for (let bNum = 1; bNum <= 3; bNum++) {
        await prisma.bed.create({
          data: {
            label: `${room.name} - Bed ${bNum}`,
            roomId: room.id,
            type: w.type,
            status: bNum === 1 ? 'Occupied' : (bNum === 2 ? 'Cleaning' : 'Available')
          }
        });
      }
    }
  }

  // For Emergency Dept, create Emergency Ward
  const emergencyWard = await prisma.ward.create({
    data: {
      name: 'Trauma & Emergency Ward',
      type: 'Emergency',
      departmentId: seededDepts['Emergency'].id
    }
  });
  const erRoom = await prisma.room.create({
    data: {
      name: 'ER Room 1',
      wardId: emergencyWard.id
    }
  });
  for (let bNum = 1; bNum <= 4; bNum++) {
    await prisma.bed.create({
      data: {
        label: `ER-Bed-${bNum}`,
        roomId: erRoom.id,
        type: 'Emergency',
        status: bNum === 1 ? 'Occupied' : 'Available'
      }
    });
  }

  console.log('Beds, Rooms, and Wards seeded.');

  // 5. Seed Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const usersData = [
    {
      email: 'superadmin@ishrms.com',
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: seededRoles['SUPER_ADMIN'].id,
      hospitalId: null
    },
    {
      email: 'admin@ishrms.com',
      password: hashedPassword,
      firstName: 'Hospital',
      lastName: 'Admin',
      roleId: seededRoles['ADMIN'].id,
      hospitalId: hospital.id
    },
    {
      email: 'doctor@ishrms.com',
      password: hashedPassword,
      firstName: 'Anant',
      lastName: 'Sharma',
      roleId: seededRoles['DOCTOR'].id,
      hospitalId: hospital.id
    },
    {
      email: 'nurse@ishrms.com',
      password: hashedPassword,
      firstName: 'Swati',
      lastName: 'Patel',
      roleId: seededRoles['NURSE'].id,
      hospitalId: hospital.id
    },
    {
      email: 'receptionist@ishrms.com',
      password: hashedPassword,
      firstName: 'Rahul',
      lastName: 'Verma',
      roleId: seededRoles['RECEPTIONIST'].id,
      hospitalId: hospital.id
    },
    {
      email: 'pharmacist@ishrms.com',
      password: hashedPassword,
      firstName: 'Amit',
      lastName: 'Gupta',
      roleId: seededRoles['PHARMACIST'].id,
      hospitalId: hospital.id
    }
  ];

  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        password: u.password,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId: u.roleId,
        hospitalId: u.hospitalId
      }
    });
    console.log(`User seeded: ${user.firstName} ${user.lastName} (${u.email})`);
  }

  // 6. Seed Medicines
  const medicinesData = [
    {
      name: 'Paracetamol 650mg',
      genericName: 'Acetaminophen',
      batchNumber: 'BATCH-P25',
      manufacturer: 'GSK Pharma',
      purchaseDate: new Date('2026-01-10'),
      expiryDate: new Date('2027-12-31'),
      unitPrice: 2.50,
      stockQuantity: 500,
      thresholdQuantity: 50
    },
    {
      name: 'Amoxicillin 500mg',
      genericName: 'Amoxicillin Trihydrate',
      batchNumber: 'BATCH-A88',
      manufacturer: 'Abbott Labs',
      purchaseDate: new Date('2026-02-15'),
      expiryDate: new Date('2027-06-30'),
      unitPrice: 12.00,
      stockQuantity: 40, // Low stock!
      thresholdQuantity: 50
    },
    {
      name: 'Metformin 850mg',
      genericName: 'Metformin Hydrochloride',
      batchNumber: 'BATCH-M12',
      manufacturer: 'Pfizer',
      purchaseDate: new Date('2025-06-01'),
      expiryDate: new Date('2026-07-15'), // Expiring soon!
      unitPrice: 4.80,
      stockQuantity: 300,
      thresholdQuantity: 30
    },
    {
      name: 'Cough Syrup (Ascoril) 100ml',
      genericName: 'Levosalbutamol + Ambroxol',
      batchNumber: 'BATCH-C44',
      manufacturer: 'Glenmark',
      purchaseDate: new Date('2025-11-20'),
      expiryDate: new Date('2026-04-10'), // Already Expired! (current date is June 2026)
      unitPrice: 85.00,
      stockQuantity: 150,
      thresholdQuantity: 20
    },
    {
      name: 'Pantocid 40mg',
      genericName: 'Pantoprazole',
      batchNumber: 'BATCH-PAN99',
      manufacturer: 'Sun Pharma',
      purchaseDate: new Date('2026-03-01'),
      expiryDate: new Date('2028-02-28'),
      unitPrice: 6.20,
      stockQuantity: 1000,
      thresholdQuantity: 100
    }
  ];

  for (const m of medicinesData) {
    const med = await prisma.medicine.create({
      data: {
        ...m,
        hospitalId: hospital.id
      }
    });
    console.log(`Medicine seeded: ${med.name}`);
  }

  // 7. Seed sample patients
  const patientsData = [
    {
      uhid: 'UHID-100001',
      name: 'Rohan Sharma',
      age: 42,
      gender: 'Male',
      bloodGroup: 'O+',
      phone: '9876543210',
      address: '45, Park Street, Metropolis',
      emergencyContactName: 'Rita Sharma',
      emergencyContactPhone: '9876543211'
    },
    {
      uhid: 'UHID-100002',
      name: 'Priya Patel',
      age: 28,
      gender: 'Female',
      bloodGroup: 'B+',
      phone: '8765432109',
      address: 'Block C, Sunrise Apts, Metropolis',
      emergencyContactName: 'Kunal Patel',
      emergencyContactPhone: '8765432108'
    }
  ];

  for (const p of patientsData) {
    const patient = await prisma.patient.upsert({
      where: { uhid: p.uhid },
      update: {},
      create: p
    });
    console.log(`Patient seeded: ${patient.name} (${patient.uhid})`);
  }

  console.log('🌱 Seed complete!');
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
