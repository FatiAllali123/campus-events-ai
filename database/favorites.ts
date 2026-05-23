import { getDatabase } from './init';
import { Favorite, Event } from '../types';

export function addFavorite(favorite: Favorite): void {
  const db = getDatabase();
  
  db.runSync(
    'INSERT OR IGNORE INTO favorites (eventId, userId, createdAt) VALUES (?, ?, ?)',
    [favorite.eventId, favorite.userId, favorite.createdAt]
  );
}

export function removeFavorite(eventId: string, userId: string): void {
  const db = getDatabase();
  db.runSync(
    'DELETE FROM favorites WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  );
}

export function getFavoritesByUser(userId: string): Event[] {
  const db = getDatabase();
  
  const rows = db.getAllSync<any>(
    `SELECT e.* FROM events e
     INNER JOIN favorites f ON e.id = f.eventId
     WHERE f.userId = ?
     ORDER BY f.createdAt DESC`,
    [userId]
  );
  
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    capacity: row.capacity || undefined,
    endDateTime: row.endDateTime || undefined,
    locationAddress: row.locationAddress || undefined,
    imageUrl: row.imageUrl || undefined,
  }));
}

export function isFavorite(eventId: string, userId: string): boolean {
  const db = getDatabase();
  const result = db.getFirstSync<{ count: number }>(
    'SELECT COUNT(*) as count FROM favorites WHERE eventId = ? AND userId = ?',
    [eventId, userId]
  );
  return (result?.count || 0) > 0;
}