import { getDatabase } from './init';
import { Event } from '../types';

export function createEvent(event: Event): void {
  const db = getDatabase();
  
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

export function getAllEvents(): Event[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>('SELECT * FROM events ORDER BY startDateTime DESC');
  
  return rows.map(row => ({
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    capacity: row.capacity || undefined,
    endDateTime: row.endDateTime || undefined,
    locationAddress: row.locationAddress || undefined,
    imageUrl: row.imageUrl || undefined,
  }));
}

export function getEventById(id: string): Event | null {
  const db = getDatabase();
  const row = db.getFirstSync<any>('SELECT * FROM events WHERE id = ?', [id]);
  
  if (!row) return null;
  
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
    capacity: row.capacity || undefined,
    endDateTime: row.endDateTime || undefined,
    locationAddress: row.locationAddress || undefined,
    imageUrl: row.imageUrl || undefined,
  };
}

export function updateEvent(event: Event): void {
  const db = getDatabase();
  
  db.runSync(
    `UPDATE events SET
      title = ?, description = ?, category = ?, startDateTime = ?,
      endDateTime = ?, locationName = ?, locationAddress = ?,
      organizerName = ?, capacity = ?, imageUrl = ?, tags = ?
    WHERE id = ?`,
    [
      event.title,
      event.description,
      event.category,
      event.startDateTime,
      event.endDateTime || null,
      event.locationName,
      event.locationAddress || null,
      event.organizerName,
      event.capacity || null,
      event.imageUrl || null,
      event.tags ? JSON.stringify(event.tags) : null,
      event.id,
    ]
  );
}

export function deleteEvent(id: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM events WHERE id = ?', [id]);
}

export function searchEvents(query: string): Event[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(
    'SELECT * FROM events WHERE LOWER(title) LIKE ? ORDER BY startDateTime DESC',
    [`%${query.toLowerCase()}%`]
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

export function getEventsByCategory(category: string): Event[] {
  const db = getDatabase();
  const rows = db.getAllSync<any>(
    'SELECT * FROM events WHERE category = ? ORDER BY startDateTime DESC',
    [category]
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

export function getUpcomingEvents(): Event[] {
  const db = getDatabase();
  const now = new Date().toISOString();
  const rows = db.getAllSync<any>(
    'SELECT * FROM events WHERE startDateTime > ? ORDER BY startDateTime ASC',
    [now]
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

export function getPastEvents(): Event[] {
  const db = getDatabase();
  const now = new Date().toISOString();
  const rows = db.getAllSync<any>(
    'SELECT * FROM events WHERE startDateTime < ? ORDER BY startDateTime DESC',
    [now]
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