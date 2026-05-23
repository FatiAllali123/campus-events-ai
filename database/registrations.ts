import { getDatabase } from './init';
import { Registration } from '../types';

export function createRegistration(registration: Registration): void {
  const db = getDatabase();
  
  db.runSync(
    'INSERT INTO registrations (id, eventId, userId, createdAt, status) VALUES (?, ?, ?, ?, ?)',
    [registration.id, registration.eventId, registration.userId, registration.createdAt, registration.status]
  );
  
  // Mettre à jour le compteur
  db.runSync(
    'UPDATE events SET registeredCount = registeredCount + 1 WHERE id = ?',
    [registration.eventId]
  );
}

export function getRegistrationsByUser(userId: string): Registration[] {
  const db = getDatabase();
  return db.getAllSync<Registration>(
    'SELECT * FROM registrations WHERE userId = ? AND status = ? ORDER BY createdAt DESC',
    [userId, 'confirmed']
  );
}

export function getRegistrationByEventAndUser(eventId: string, userId: string): Registration | null {
  const db = getDatabase();
  return db.getFirstSync<Registration>(
    'SELECT * FROM registrations WHERE eventId = ? AND userId = ? AND status = ?',
    [eventId, userId, 'confirmed']
  );
}

export function cancelRegistration(eventId: string, userId: string): void {
  const db = getDatabase();
  
  db.runSync(
    'UPDATE registrations SET status = ? WHERE eventId = ? AND userId = ?',
    ['cancelled', eventId, userId]
  );
  
  // Mettre à jour le compteur
  db.runSync(
    'UPDATE events SET registeredCount = registeredCount - 1 WHERE id = ?',
    [eventId]
  );
}

export function getRegistrationCount(eventId: string): number {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM registrations WHERE eventId = ? AND status = ?',
    [eventId, 'confirmed']
  );
  return result?.count || 0;
}