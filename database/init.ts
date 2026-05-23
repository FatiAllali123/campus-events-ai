import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('campusevents.db');
  }
  return db;
}

export function initDatabase() {
  const database = getDatabase();

  // ✅ Activer les clés étrangères AVANT toute création de table
  database.execSync('PRAGMA foreign_keys = ON;');

  database.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      startDateTime TEXT NOT NULL,
      endDateTime TEXT,
      locationName TEXT NOT NULL,
      locationAddress TEXT,
      organizerName TEXT NOT NULL,
      capacity INTEGER,
      registeredCount INTEGER DEFAULT 0,
      imageUrl TEXT,
      tags TEXT,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY,
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'confirmed',
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS favorites (
      eventId TEXT NOT NULL,
      userId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      PRIMARY KEY (eventId, userId),
      FOREIGN KEY (eventId) REFERENCES events(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS llm_results (
      id TEXT PRIMARY KEY,
      eventId TEXT,
      userId TEXT NOT NULL,
      type TEXT NOT NULL,
      inputText TEXT NOT NULL,
      outputText TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);

  console.log('✅ Base de données initialisée');
}

export function seedDatabase() {
  const db = getDatabase();

  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM events');
  if (count && count.count > 0) return;

  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const events = [
    {
      id: 'evt-001',
      title: 'Workshop Machine Learning avec TensorFlow',
      description: 'Apprenez les bases du machine learning avec TensorFlow. Atelier pratique avec exercices guidés. Prérequis: connaissances de base en Python.',
      category: 'Workshop',
      startDateTime: tomorrow.toISOString(),
      endDateTime: new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      locationName: 'Salle Informatique B12',
      locationAddress: 'Bâtiment Sciences, Campus Universitaire',
      organizerName: 'Club Informatique',
      capacity: 30,
      registeredCount: 12,
      imageUrl: undefined,
      tags: ['IA', 'Machine Learning', 'Python', 'TensorFlow'],
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-002',
      title: "Talk: L'avenir de l'IA Générative",
      description: 'Conférence sur les avancées récentes en IA générative (LLM, images, vidéos). Discussion sur les impacts éthiques et professionnels.',
      category: 'Talk',
      startDateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      locationName: 'Amphithéâtre A1',
      locationAddress: 'Bâtiment Central, Campus Universitaire',
      organizerName: 'Département Informatique',
      capacity: 200,
      registeredCount: 45,
      imageUrl: undefined,
      tags: ['IA', 'Conférence', 'Avenir', 'Éthique'],
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-003',
      title: 'Club Robotique: Session Arduino',
      description: "Session pratique du club robotique. Construction d'un robot suiveur de ligne avec Arduino. Matériel fourni.",
      category: 'Club',
      startDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      locationName: 'Atelier Mécatronique',
      locationAddress: "Bâtiment Ingénierie, Campus Universitaire",
      organizerName: 'Club Robotique',
      capacity: 20,
      registeredCount: 8,
      imageUrl: undefined,
      tags: ['Robotique', 'Arduino', 'Électronique', 'Pratique'],
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-004',
      title: 'Préparation Examen Algorithmique',
      description: "Session de révision collective pour l'examen d'algorithmique. Exercices types et conseils de méthodologie.",
      category: 'Exam',
      startDateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      endDateTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
      locationName: 'Salle C24',
      locationAddress: 'Bâtiment Sciences, Campus Universitaire',
      organizerName: 'Prof. Martin',
      capacity: 50,
      registeredCount: 35,
      imageUrl: undefined,
      tags: ['Examen', 'Algorithmique', 'Révision', 'Maths'],
      createdAt: now.toISOString(),
    },
    {
      id: 'evt-005',
      title: 'Soirée Networking Data Science',
      description: "Rencontre avec des professionnels du data science. Opportunités de stage et d'emploi. Bring your CV!",
      category: 'Other',
      startDateTime: nextWeek.toISOString(),
      endDateTime: new Date(nextWeek.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      locationName: 'Hall Principal',
      locationAddress: 'Bâtiment Central, Campus Universitaire',
      organizerName: 'Association des Anciens',
      capacity: 100,
      registeredCount: 22,
      imageUrl: undefined,
      tags: ['Data Science', 'Networking', 'Stage', 'Carrière'],
      createdAt: now.toISOString(),
    },
  ];

  for (const event of events) {
    db.runSync(
      `INSERT INTO events (
        id, title, description, category, startDateTime, endDateTime,
        locationName, locationAddress, organizerName, capacity,
        registeredCount, imageUrl, tags, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event.id,
        event.title,
        event.description,
        event.category,
        event.startDateTime,
        event.endDateTime || null,
        event.locationName,
        event.locationAddress || null,
        event.organizerName,
        event.capacity || null,
        event.registeredCount,
        event.imageUrl || null,
        event.tags ? JSON.stringify(event.tags) : null,
        event.createdAt,
      ]
    );
  }

  console.log('✅ Données de test ajoutées');
}

export function closeDatabase() {
  if (db) {
    db.closeSync();
    db = null;
  }
}
