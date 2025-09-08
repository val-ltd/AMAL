

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import path from 'path';

// Load environment variables from .env file
config({ path: path.resolve(__dirname, '../.env.local') });
config();

// Find your service account credentials in the Firebase console
// and place them in a file named `service-account.json` in the root
// of your project.
const serviceAccountPath = path.resolve(process.cwd(), 'service-account.json');
const serviceAccount = require(serviceAccountPath);

// --- Your sample data goes here ---

const users = [
  {
    id: 'employee1_uid',
    name: 'Aisha Lestari',
    email: 'aisha.lestari@example.com',
    roles: ['Employee'],
    avatarUrl: 'https://i.pravatar.cc/150?u=aisha',
    position: 'Staff',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah',
    gender: 'Female',
    phoneNumber: '081234567890',
    address: 'Jl. Merdeka No. 1, Jakarta',
    bankAccounts: [
      {
        bankName: 'Bank Central Asia (BCA)',
        accountNumber: '1122334455',
        accountHolderName: 'Aisha Lestari',
        bankCode: '014',
      }
    ],
    isDeleted: false,
  },
  {
    id: 'manager1_uid',
    name: 'Budi Santoso',
    email: 'budi.santoso@example.com',
    roles: ['Manager', 'Employee'],
    avatarUrl: 'https://i.pravatar.cc/150?u=budi',
    position: 'Kepala Divisi',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah',
    isDeleted: false,
  },
  {
    id: 'admin1_uid',
    name: 'Citra Dewi',
    email: 'citra.dewi@example.com',
    roles: ['Admin', 'Manager', 'Employee'],
    avatarUrl: 'https://i.pravatar.cc/150?u=citra',
    position: 'System Administrator',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi IT & Publikasi',
    isDeleted: false,
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

const departments = [
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Dewan Direksi ICWM", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Keuangan", bagian: "Kasir", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Keuangan", bagian: "Infaq Bulanan Wali Santri", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Humas dan Tamu", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Administrasi WNA", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Konsumsi", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Transportasi", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Sarana-Prasarana & Inventaris", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Pembangunan", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Pertanian dan Perkebunan", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Keamanan", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "Yayasan Mimbar Hidayah Qur'an (MHQ)", unit: "Bagian Hubungan Masyarakat (Humas)", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "Yayasan Mimbar Hidayah Qur'an (MHQ)", unit: "Bagian Pengawasan Proyek", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "Yayasan Mimbar Hidayah Qur'an (MHQ)", unit: "Bagian IT dan Dokumentasi", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "LAZIS SaQu", unit: "Bagian IT dan Publikasi", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Ma'had Sabilul Qur'an (MSQ)", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Ma'had Sulthon Al-Islamy (MSI)", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Ma'had Tahfiz Imtiaz", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Mahabbah Boarding School", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "MAJELIS IDAROH", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Fotokopi", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Koperasi", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Kantin", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Sahabat Resto", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Peternakan dan Perikanan", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Pondok Cabang (PKM, SMA, SMP)", bagian: "Bagian Pengabdian dan Alumni", isDeleted: false },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Pelaksana Harian ICWM", bagian: "Manajemen SDM (Personalia dan PSMB)", isDeleted: false },
];

const budgetCategories = [
  { name: "01. ATK & Barang Cetakan", isDeleted: false },
  { name: "02. BBM Mobil", isDeleted: false },
  { name: "03. BBM Motor", isDeleted: false },
  { name: "04. Peralatan & Perlengkapan Kebersihan", isDeleted: false },
  { name: "05. Konsumsi Jamuan Tamu", isDeleted: false },
  { name: "06. Konsumsi Santri & Asatidz", isDeleted: false },
  { name: "07. Mukafaah Pengurus Pondok (W.M)", isDeleted: false },
  { name: "08. Rekening Telepon Dan Internet", isDeleted: false },
  { name: "09. Rekening Listrik", isDeleted: false },
  { name: "10. Tol Dan Parkir", isDeleted: false },
  { name: "11. Biaya Pajak Tanah", isDeleted: false },
  { name: "12. Biaya Pajak Mobil", isDeleted: false },
  { name: "13. Biaya Pajak Motor", isDeleted: false },
  { name: "14. Konsumsi Rapat & Kajian", isDeleted: false },
  { name: "15. Perkebunan", isDeleted: false },
  { name: "16. Perawatan Kendaraan", isDeleted: false },
  { name: "17. Biaya Administrasi Bank", isDeleted: false },
  { name: "18. Biaya Lainnya", isDeleted: false },
  { name: "19. Peralatan & Perlengkapan Pondok", isDeleted: false },
  { name: "20. Perbaikan Gedung", isDeleted: false },
  { name: "21. Perjalanan Dinas", isDeleted: false },
  { name: "22. Tunjangan Hari Raya (THR)", isDeleted: false },
];

const fundAccounts = [
    {
        namaLembaga: 'REKENING OPERASIONAL BULANAN YICWM',
        accountName: 'ISLAMIC CENTER WADI MUBARAK',
        accountNumber: '1200008551',
        bankName: 'Bank Syariah Indonesia (BSI)',
        cabang: 'KCP Cisarua',
        pejabatJabatan: 'KETUA YIC WADI MUBARAK',
        pejabatNama: 'Muhamad Dede Sulaeman',
        namaBendahara: 'Muhamad Dede Sulaeman',
        bankBendahara: 'Bank Syariah Indonesia (BSI)',
        rekeningBendahara: '1152308683',
        kodeBank: '451',
        petugas: 'Kasir',
        isDeleted: false,
    },
    {
        namaLembaga: 'REKENING OPERASIONAL BULANAN YASAQU',
        accountName: 'OPERASIONAL BULANAN YASAQU',
        accountNumber: '7191267324',
        bankName: 'Bank Syariah Indonesia (BSI)',
        cabang: 'KCP Cisarua',
        pejabatJabatan: 'KETUA YIC WADI MUBARAK',
        pejabatNama: 'Muhamad Dede Sulaeman',
        namaBendahara: 'Muhamad Dede Sulaeman',
        bankBendahara: 'Bank Syariah Indonesia (BSI)',
        rekeningBendahara: '1152308683',
        kodeBank: '451',
        petugas: 'Kasir',
        isDeleted: false,
    },
];

const banks = [
    { name: 'Bank Syariah Indonesia (BSI)', code: '451', isDeleted: false },
    { name: 'Bank Central Asia (BCA)', code: '014', isDeleted: false },
    { name: 'Bank Mandiri', code: '008', isDeleted: false },
    { name: 'Bank Rakyat Indonesia (BRI)', code: '002', isDeleted: false },
    { name: 'Bank Negara Indonesia (BNI)', code: '009', isDeleted: false },
];

const units = [
    { name: 'Pcs', isDeleted: false },
    { name: 'Unit', isDeleted: false },
    { name: 'Buah', isDeleted: false },
    { name: 'Rim', isDeleted: false },
    { name: 'Dus', isDeleted: false },
    { name: 'Liter', isDeleted: false },
    { name: 'Kg', isDeleted: false },
];

const memoSubjects = [
    { name: 'ANGGARAN BULANAN', isDeleted: false },
    { name: 'KEBUTUHAN PROYEK', isDeleted: false },
    { name: 'ACARA KHUSUS', isDeleted: false },
];

const transferTypes = [
    { name: 'BI-FAST', fee: 2500, isDeleted: false },
    { name: 'RTGS', fee: 30000, isDeleted: false },
    { name: 'LLG', fee: 6500, isDeleted: false },
];

// --- Seeding logic ---
async function seedCollection(db: any, collectionName: string, data: any[], uniqueField: string) {
    console.log(`\nSeeding ${collectionName}...`);
    const collectionRef = db.collection(collectionName);
    let addedCount = 0;
    for (const item of data) {
        const querySnapshot = await collectionRef.where(uniqueField, '==', item[uniqueField]).get();
        if (querySnapshot.empty) {
            await collectionRef.add(item);
            addedCount++;
        }
    }
    console.log(`Added ${addedCount} new documents to ${collectionName}.`);
}


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
    await docRef.set(user, { merge: true });
    console.log(`Added/Updated user: ${user.name}`);
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

  // Seed departments
  console.log('\nSeeding departments...');
  const departmentsCollection = db.collection('departments');
  for (const department of departments) {
    // Check if a similar department exists to avoid duplicates
    let query: any = departmentsCollection.where('lembaga', '==', department.lembaga).where('divisi', '==', department.divisi);
    
    const querySnapshot = await query.get();
    
    let exists = false;
    if (!querySnapshot.empty) {
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            if(data.bagian === (department.bagian || null) && data.unit === (department.unit || null)) {
                exists = true;
                break;
            }
        }
    }
      
    if (!exists) {
      await departmentsCollection.add(department);
      console.log(`Added department: ${department.lembaga} / ${department.divisi}`);
    } else {
      console.log(`Department for ${department.lembaga} / ${department.divisi} already exists. Skipping.`);
    }
  }

  // Seed system data
  await seedCollection(db, 'budgetCategories', budgetCategories, 'name');
  await seedCollection(db, 'fundAccounts', fundAccounts, 'accountNumber');
  await seedCollection(db, 'banks', banks, 'name');
  await seedCollection(db, 'units', units, 'name');
  await seedCollection(db, 'memoSubjects', memoSubjects, 'name');
  await seedCollection(db, 'transferTypes', transferTypes, 'name');
  
  console.log('\n--- Database Seed Complete ---');
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
});

    
