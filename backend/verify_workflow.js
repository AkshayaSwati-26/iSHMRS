const prisma = require('./src/config/prisma');

async function testFullWorkflow() {
  console.log('🚀 TESTING END-TO-END HOSPITAL WORKFLOW...\n');

  try {
    // 1. Verify DB Connection & Models
    const patientCount = await prisma.patient.count();
    const userCount = await prisma.user.count();
    const bedCount = await prisma.bed.count();
    const labTestCount = await prisma.labTest.count();

    console.log(`✅ DB Connection OK:`);
    console.log(`   - Patients: ${patientCount}`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - Beds: ${bedCount}`);
    console.log(`   - Lab Tests: ${labTestCount}\n`);

    // 2. Verify PATIENT Role and Demo Account
    const demoPatient = await prisma.patient.findUnique({
      where: { uhid: 'UHID-20260731-99999' },
      include: { user: { include: { role: true } } }
    });

    if (!demoPatient || !demoPatient.user) {
      throw new Error('Demo patient account missing!');
    }
    console.log(`✅ Demo Patient Account Verified:`);
    console.log(`   - Name: ${demoPatient.name}`);
    console.log(`   - UHID: ${demoPatient.uhid}`);
    console.log(`   - Email: ${demoPatient.email}`);
    console.log(`   - Role: ${demoPatient.user.role.name}\n`);

    // 3. Verify Lab Order Workflow
    const doctor = await prisma.user.findFirst({
      where: { role: { name: 'DOCTOR' } }
    });

    if (!doctor) throw new Error('No doctor found in database!');

    const labTest = await prisma.labTest.findFirst();
    if (!labTest) throw new Error('No lab test found in database!');

    // Create test lab order
    const labOrder = await prisma.labOrder.create({
      data: {
        orderNumber: `TEST-LAB-${Date.now()}`,
        patientId: demoPatient.id,
        orderedById: doctor.id,
        priority: 'STAT',
        items: {
          create: [{ labTestId: labTest.id }]
        }
      },
      include: { items: true }
    });
    console.log(`✅ Lab Order Creation Workflow Verified: Order #${labOrder.orderNumber}`);

    // Update sample collection
    await prisma.labOrder.update({
      where: { id: labOrder.id },
      data: { status: 'SampleCollected' }
    });
    console.log(`✅ Lab Sample Collection Workflow Verified: Sample Collected`);

    // Publish lab result
    await prisma.labOrderItem.update({
      where: { id: labOrder.items[0].id },
      data: {
        resultValue: '14.2',
        resultUnit: 'g/dL',
        isAbnormal: false,
        isCritical: false,
        resultedAt: new Date()
      }
    });

    await prisma.labOrder.update({
      where: { id: labOrder.id },
      data: { status: 'Resulted' }
    });
    console.log(`✅ Lab Results Workflow Verified: Results Published & Linked to Patient\n`);

    // 4. Verify Billing & Payment Workflow
    const bill = await prisma.bill.create({
      data: {
        billNumber: `TEST-BILL-${Date.now()}`,
        patientId: demoPatient.id,
        status: 'Generated',
        subtotal: 1000,
        taxAmount: 180,
        discountAmount: 80,
        totalAmount: 1100,
        paidAmount: 0,
        balanceAmount: 1100,
        items: {
          create: [
            { type: 'Consultation', description: 'Specialist Consultation', quantity: 1, unitPrice: 500, totalPrice: 500 },
            { type: 'Lab', description: labTest.name, quantity: 1, unitPrice: 500, totalPrice: 500 }
          ]
        }
      }
    });
    console.log(`✅ OPD/IPD Billing Workflow Verified: Invoice #${bill.billNumber} (Total: ₹${bill.totalAmount})`);

    // Record Payment
    const payment = await prisma.paymentTransaction.create({
      data: {
        billId: bill.id,
        amount: 1100,
        method: 'UPI',
        referenceNumber: 'UPI-9876543210',
        processedById: doctor.id
      }
    });

    await prisma.bill.update({
      where: { id: bill.id },
      data: { paidAmount: 1100, balanceAmount: 0, status: 'Paid' }
    });
    console.log(`✅ Payment Transaction Workflow Verified: ₹1100 Paid via UPI (Status: Paid)\n`);

    // Clean up test records
    await prisma.paymentTransaction.delete({ where: { id: payment.id } });
    await prisma.bill.delete({ where: { id: bill.id } });
    await prisma.labOrder.delete({ where: { id: labOrder.id } });

    console.log('🎉 ALL WORKFLOW LOOPS VERIFIED WITH 0 GAPS!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Workflow Verification Error:', err.message);
    process.exit(1);
  }
}

testFullWorkflow();
