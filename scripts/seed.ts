
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';

// Load environment variables from .env file
config({ path: '.env.local' });
config();

// Find your service account credentials in the Firebase console
// and place them in a file named `service-account.json` in the root
// of your project.
const serviceAccount = require('../service-account.json');

// --- Your sample data goes here ---

const users = [
  {
    id: 'employee1_uid',
    name: 'Aisha Lestari',
    email: 'aisha.lestari@example.com',
    role: 'Employee',
    avatarUrl: 'https://i.pravatar.cc/150?u=aisha',
    position: 'Staff',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah'
  },
  {
    id: 'manager1_uid',
    name: 'Budi Santoso',
    email: 'budi.santoso@example.com',
    role: 'Manager',
    avatarUrl: 'https://i.pravatar.cc/150?u=budi',
    position: 'Kepala Divisi',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah'
  },
  {
    id: 'admin1_uid',
    name: 'Citra Dewi',
    email: 'citra.dewi@example.com',
    role: 'Admin',
    avatarUrl: 'https://i.pravatar.cc/150?u=citra',
    position: 'System Administrator',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi IT & Publikasi'
  },
];

const requests = [
  {
    requester: {
      id: 'employee1_uid',
      name: 'Aisha Lestari',
      avatarUrl: 'https://i.pravatar.cc/150?u=aisha',
    },
    supervisor: {
        id: 'manager1_uid',
        name: 'Budi Santoso',
    },
    category: '01. ATK & Barang Cetakan',
    description: 'Pembelian 10 rim kertas A4 dan 2 kotak tinta printer untuk kebutuhan administrasi kantor.',
    amount: 750000,
    status: 'pending',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah',
    createdAt: Timestamp.fromDate(new Date('2024-05-20T10:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-05-20T10:00:00Z')),
  },
  {
    requester: {
      id: 'employee1_uid',
      name: 'Aisha Lestari',
      avatarUrl: 'https://i.pravatar.cc/150?u=aisha',
    },
    supervisor: {
        id: 'manager1_uid',
        name: 'Budi Santoso',
    },
    category: '14. Konsumsi Rapat & Kajian',
    description: 'Penyediaan konsumsi untuk rapat bulanan divisi Dakwah.',
    amount: 500000,
    status: 'approved',
    managerComment: 'Disetujui, harap lampirkan nota pembelian.',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah',
    createdAt: Timestamp.fromDate(new Date('2024-05-15T14:30:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-05-16T09:00:00Z')),
  },
  {
    requester: {
      id: 'employee1_uid',
      name: 'Aisha Lestari',
      avatarUrl: 'https://i.pravatar.cc/150?u=aisha',
    },
    supervisor: {
        id: 'manager1_uid',
        name: 'Budi Santoso',
    },
    category: '21. Perjalanan Dinas',
    description: 'Biaya perjalanan dinas ke Bandung untuk menghadiri seminar.',
    amount: 1200000,
    status: 'rejected',
    managerComment: 'Ditolak, seminar dapat diikuti secara online.',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah',
    createdAt: Timestamp.fromDate(new Date('2024-05-10T08:00:00Z')),
    updatedAt: Timestamp.fromDate(new Date('2024-05-10T11:00:00Z')),
  },
];


// --- Seeding logic ---

async function seed() {
  console.log('--- Starting Database Seed ---');
  
  // Initialize Firebase Admin
  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  
  const db = getFirestore();

  // Seed users
  console.log('Seeding users...');
  const usersCollection = db.collection('users');
  for (const user of users) {
    const docRef = usersCollection.doc(user.id);
    const doc = await docRef.get();
    if (doc.exists) {
      console.log(`User ${user.name} already exists. Skipping.`);
    } else {
      await docRef.set(user);
      console.log(`Added user: ${user.name}`);
    }
  }

  // Seed requests
  console.log('\nSeeding requests...');
  const requestsCollection = db.collection('requests');
  for (const request of requests) {
    // Check if a similar request exists to avoid duplicates
    const querySnapshot = await requestsCollection
      .where('requester.id', '==', request.requester.id)
      .where('category', '==', request.category)
      .where('amount', '==', request.amount)
      .get();
      
    if (querySnapshot.empty) {
      await requestsCollection.add(request);
      console.log(`Added request: ${request.category}`);
    } else {
      console.log(`Request for ${request.category} already exists. Skipping.`);
    }
  }

  console.log('\n--- Database Seed Complete ---');
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
});
