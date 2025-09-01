
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
    division: 'Divisi Dakwah'
  },
  {
    id: 'manager1_uid',
    name: 'Budi Santoso',
    email: 'budi.santoso@example.com',
    roles: ['Manager', 'Employee'],
    avatarUrl: 'https://i.pravatar.cc/150?u=budi',
    position: 'Kepala Divisi',
    institution: 'YAYASAN SAHABAT QURAN',
    division: 'Divisi Dakwah'
  },
  {
    id: 'admin1_uid',
    name: 'Citra Dewi',
    email: 'citra.dewi@example.com',
    roles: ['Admin', 'Manager', 'Employee'],
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

const departments = [
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Dewan Direksi ICWM" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Keuangan", bagian: "Kasir" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Keuangan", bagian: "Infaq Bulanan Wali Santri" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Humas dan Tamu" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Administrasi WNA" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Konsumsi" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Transportasi" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Sarana-Prasarana & Inventaris" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Pembangunan" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Pertanian dan Perkebunan" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Operasional", bagian: "Bagian Keamanan" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "Yayasan Mimbar Hidayah Qur'an (MHQ)", unit: "Bagian Hubungan Masyarakat (Humas)" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "Yayasan Mimbar Hidayah Qur'an (MHQ)", unit: "Bagian Pengawasan Proyek" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "Yayasan Mimbar Hidayah Qur'an (MHQ)", unit: "Bagian IT dan Dokumentasi" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Divisi Manajemen Program Sosial", bagian: "LAZIS SaQu", unit: "Bagian IT dan Publikasi" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Ma'had Sabilul Qur'an (MSQ)" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Ma'had Sulthon Al-Islamy (MSI)" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Ma'had Tahfiz Imtiaz" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Mahabbah Boarding School" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "MAJELIS IDAROH" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Fotokopi" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Koperasi" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Kantin" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Sahabat Resto" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Perekonomian", bagian: "Bagian Peternakan dan Perikanan" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Manajemen Pondok Cabang (PKM, SMA, SMP)", bagian: "Bagian Pengabdian dan Alumni" },
    { lembaga: "ISLAMIC CENTER WADI MUBARAK", divisi: "Pelaksana Harian ICWM", bagian: "Manajemen SDM (Personalia dan PSMB)" },
];

const budgetCategories = [
  { name: "01. ATK & Barang Cetakan" },
  { name: "02. BBM Mobil" },
  { name: "03. BBM Motor" },
  { name: "04. Peralatan & Perlengkapan Kebersihan" },
  { name: "05. Konsumsi Jamuan Tamu" },
  { name: "06. Konsumsi Santri & Asatidz" },
  { name: "07. Mukafaah Pengurus Pondok (W.M)" },
  { name: "08. Rekening Telepon Dan Internet" },
  { name: "09. Rekening Listrik" },
  { name: "10. Tol Dan Parkir" },
  { name: "11. Biaya Pajak Tanah" },
  { name: "12. Biaya Pajak Mobil" },
  { name: "13. Biaya Pajak Motor" },
  { name: "14. Konsumsi Rapat & Kajian" },
  { name: "15. Perkebunan" },
  { name: "16. Perawatan Kendaraan" },
  { name: "17. Biaya Administrasi Bank" },
  { name: "18. Biaya Lainnya" },
  { name: "19. Peralatan & Perlengkapan Pondok" },
  { name: "20. Perbaikan Gedung" },
  { name: "21. Perjalanan Dinas" },
  { name: "22. Tunjangan Hari Raya (THR)" },
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
      console.log(`User ${user.name} already exists. Updating roles.`);
      await docRef.update({ roles: user.roles });
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

  // Seed budget categories
  console.log('\nSeeding budget categories...');
  const categoriesCollection = db.collection('budgetCategories');
  for (const category of budgetCategories) {
    const querySnapshot = await categoriesCollection.where('name', '==', category.name).get();
    if (querySnapshot.empty) {
      await categoriesCollection.add(category);
      console.log(`Added category: ${category.name}`);
    } else {
      console.log(`Category "${category.name}" already exists. Skipping.`);
    }
  }


  console.log('\n--- Database Seed Complete ---');
}

seed().catch((error) => {
  console.error('Error seeding database:', error);
});
