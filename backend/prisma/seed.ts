import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.service.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.account.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.provider.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@advancia.com',
      name: 'System Administrator',
      role: 'SUPER_ADMIN',
      isActive: true,
    },
  });

  const providerUser = await prisma.user.create({
    data: {
      email: 'provider@advancia.com',
      name: 'Dr. Sarah Johnson',
      role: 'PROVIDER',
      isActive: true,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: 'staff@advancia.com',
      name: 'John Smith',
      role: 'STAFF',
      isActive: true,
    },
  });

  const patientUser1 = await prisma.user.create({
    data: {
      email: 'patient1@advancia.com',
      name: 'Alice Williams',
      role: 'PATIENT',
      isActive: true,
    },
  });

  const patientUser2 = await prisma.user.create({
    data: {
      email: 'patient2@advancia.com',
      name: 'Bob Martinez',
      role: 'PATIENT',
      isActive: true,
    },
  });

  // Create provider profile
  const provider = await prisma.provider.create({
    data: {
      userId: providerUser.id,
      npiNumber: '1234567890',
      licenseNumber: 'MD123456',
      specialty: 'Family Medicine',
      practiceName: 'Johnson Family Practice',
      phoneNumber: '+1-555-0123',
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      acceptingNewPatients: true,
    },
  });

  // Create staff profile
  const staff = await prisma.staff.create({
    data: {
      userId: staffUser.id,
      employeeId: 'EMP001',
      department: 'Billing',
      position: 'Billing Specialist',
      permissions: {
        canCreateInvoices: true,
        canProcessPayments: true,
        canViewReports: true,
        canManagePatients: false
      },
    },
  });

  // Create patient profiles
  const patient1 = await prisma.patient.create({
    data: {
      userId: patientUser1.id,
      medicalRecordNumber: 'MRN000001',
      dateOfBirth: new Date('1985-06-15'),
      gender: 'FEMALE',
      phoneNumber: '+1-555-0124',
      address: {
        street: '456 Oak Ave',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      emergencyContact: {
        name: 'Robert Williams',
        relationship: 'Spouse',
        phoneNumber: '+1-555-0125'
      },
      insuranceInfo: {
        provider: 'Blue Cross Blue Shield',
        memberId: 'BCBS123456',
        groupNumber: 'GRP789',
        planType: 'PPO'
      },
      medicalHistory: {
        allergies: ['Penicillin', 'Pollen'],
        medications: ['Lisinopril', 'Metformin'],
        conditions: ['Hypertension', 'Type 2 Diabetes']
      },
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      userId: patientUser2.id,
      medicalRecordNumber: 'MRN000002',
      dateOfBirth: new Date('1990-03-22'),
      gender: 'MALE',
      phoneNumber: '+1-555-0126',
      address: {
        street: '789 Pine Rd',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        country: 'USA'
      },
      emergencyContact: {
        name: 'Maria Martinez',
        relationship: 'Mother',
        phoneNumber: '+1-555-0127'
      },
      insuranceInfo: {
        provider: 'Aetna',
        memberId: 'AETNA987654',
        groupNumber: 'GRP456',
        planType: 'HMO'
      },
      medicalHistory: {
        allergies: ['None'],
        medications: ['Ibuprofen'],
        conditions: ['Seasonal Allergies']
      },
    },
  });

  // Create accounts for patients
  const account1 = await prisma.account.create({
    data: {
      userId: patientUser1.id,
      accountNumber: 'ACC000001',
      accountType: 'CHECKING',
      balance: 0.00,
      currency: 'USD',
      isActive: true,
    },
  });

  const account2 = await prisma.account.create({
    data: {
      userId: patientUser2.id,
      accountNumber: 'ACC000002',
      accountType: 'CHECKING',
      balance: 0.00,
      currency: 'USD',
      isActive: true,
    },
  });

  // Create medical services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        providerId: provider.id,
        code: '99213',
        name: 'Office or other outpatient visit for established patient',
        description: 'Standard office visit for established patients',
        category: 'Office Visit',
        price: 150.00,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        providerId: provider.id,
        code: '99214',
        name: 'Office or other outpatient visit for new patient',
        description: 'Initial consultation for new patients',
        category: 'Office Visit',
        price: 200.00,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        providerId: provider.id,
        code: '99396',
        name: 'Annual wellness visit',
        description: 'Annual preventive care examination',
        category: 'Preventive Care',
        price: 120.00,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        providerId: provider.id,
        code: '80053',
        name: 'Comprehensive metabolic panel',
        description: 'Blood chemistry tests including glucose, kidney function, electrolytes',
        category: 'Laboratory',
        price: 85.00,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        providerId: provider.id,
        code: '85025',
        name: 'Unilateral mammogram',
        description: 'Screening mammogram of one breast',
        category: 'Imaging',
        price: 125.00,
        isActive: true,
      },
    }),
    prisma.service.create({
      data: {
        providerId: provider.id,
        code: '99215',
        name: 'Extended office visit',
        description: 'Extended consultation time (30+ minutes)',
        category: 'Office Visit',
        price: 250.00,
        isActive: true,
      },
    }),
  ]);

  // Create sample invoices
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-0001',
      patientId: patient1.id,
      providerId: provider.id,
      accountId: account1.id,
      totalAmount: 275.00,
      amountPaid: 0.00,
      balance: 275.00,
      status: 'SENT',
      dueDate: new Date('2024-02-15'),
      serviceDate: new Date('2024-02-01'),
      items: {
        create: [
          {
            serviceId: services[0].id, // Office visit
            quantity: 1,
            unitPrice: 150.00,
            totalAmount: 150.00,
            description: 'Regular office visit for follow-up'
          },
          {
            serviceId: services[3].id, // Lab tests
            quantity: 1,
            unitPrice: 85.00,
            totalAmount: 85.00,
            description: 'Comprehensive metabolic panel'
          },
          {
            serviceId: services[4].id, // Mammogram
            quantity: 1,
            unitPrice: 40.00, // Adjusted price for insurance
            totalAmount: 40.00,
            description: 'Screening mammogram (insurance rate)'
          }
        ]
      }
    },
  });

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-0002',
      patientId: patient2.id,
      providerId: provider.id,
      accountId: account2.id,
      totalAmount: 200.00,
      amountPaid: 50.00,
      balance: 150.00,
      status: 'PARTIALLY_PAID',
      dueDate: new Date('2024-02-10'),
      serviceDate: new Date('2024-01-25'),
      items: {
        create: [
          {
            serviceId: services[1].id, // New patient visit
            quantity: 1,
            unitPrice: 200.00,
            totalAmount: 200.00,
            description: 'Initial consultation and examination'
          }
        ]
      }
    },
  });

  const invoice3 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2024-0003',
      patientId: patient1.id,
      providerId: provider.id,
      accountId: account1.id,
      totalAmount: 120.00,
      amountPaid: 120.00,
      balance: 0.00,
      status: 'PAID',
      dueDate: new Date('2024-01-20'),
      serviceDate: new Date('2024-01-05'),
      items: {
        create: [
          {
            serviceId: services[2].id, // Annual wellness
            quantity: 1,
            unitPrice: 120.00,
            totalAmount: 120.00,
            description: 'Annual preventive care examination'
          }
        ]
      }
    },
  });

  // Create sample payments
  await prisma.payment.createMany({
    data: [
      {
        paymentNumber: 'PAY-2024-0001',
        patientId: patient2.id,
        invoiceId: invoice2.id,
        accountId: account2.id,
        amount: 50.00,
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
        transactionId: 'txn_1234567890',
        processedAt: new Date('2024-02-01'),
        processorResponse: {
          stripeChargeId: 'ch_1234567890',
          status: 'succeeded'
        }
      },
      {
        paymentNumber: 'PAY-2024-0002',
        patientId: patient1.id,
        invoiceId: invoice3.id,
        accountId: account1.id,
        amount: 120.00,
        method: 'ACH_TRANSFER',
        status: 'COMPLETED',
        transactionId: 'txn_0987654321',
        processedAt: new Date('2024-01-15'),
        processorResponse: {
          stripeChargeId: 'ch_0987654321',
          status: 'succeeded'
        }
      },
      {
        paymentNumber: 'PAY-2024-0003',
        patientId: patient1.id,
        invoiceId: invoice1.id,
        accountId: account1.id,
        amount: 100.00,
        method: 'HEALTH_SAVINGS_ACCOUNT',
        status: 'FAILED',
        transactionId: 'txn_1111111111',
        processorResponse: {
          error: 'Insufficient HSA funds',
          declineCode: 'insufficient_funds'
        }
      }
    ]
  });

  // Create sample claims
  await prisma.claim.createMany({
    data: [
      {
        claimNumber: 'CLM-2024-0001',
        patientId: patient1.id,
        providerId: provider.id,
        invoiceId: invoice3.id,
        totalAmount: 120.00,
        approvedAmount: 96.00,
        status: 'APPROVED',
        submittedAt: new Date('2024-01-10'),
        processedAt: new Date('2024-01-18')
      },
      {
        claimNumber: 'CLM-2024-0002',
        patientId: patient2.id,
        providerId: provider.id,
        invoiceId: invoice2.id,
        totalAmount: 200.00,
        approvedAmount: 160.00,
        status: 'PARTIALLY_APPROVED',
        submittedAt: new Date('2024-01-28'),
        processedAt: new Date('2024-02-05'),
        denialReason: 'Partial coverage - patient responsible for $40 copay'
      },
      {
        claimNumber: 'CLM-2024-0003',
        patientId: patient1.id,
        providerId: provider.id,
        invoiceId: invoice1.id,
        totalAmount: 275.00,
        status: 'SUBMITTED',
        submittedAt: new Date('2024-02-05')
      }
    ]
  });

  // Create sample audit logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: 'USER_LOGIN',
        resource: 'User',
        resourceId: adminUser.id,
        newValues: { loginMethod: 'web' },
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        userId: providerUser.id,
        action: 'INVOICE_CREATE',
        resource: 'Invoice',
        resourceId: invoice1.id,
        newValues: { invoiceNumber: 'INV-2024-0001', totalAmount: 275.00 },
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      {
        userId: patientUser2.id,
        action: 'PAYMENT_PROCESS',
        resource: 'Payment',
        resourceId: 'PAY-2024-0001',
        newValues: { amount: 50.00, method: 'CREDIT_CARD' },
        ipAddress: '192.168.1.102',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      }
    ]
  });

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
