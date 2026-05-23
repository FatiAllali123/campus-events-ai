// Types pour les événements
export type Category = 'Talk' | 'Workshop' | 'Club' | 'Exam' | 'Other';

export interface Event {
  id: string;
  title: string;
  description: string;
  category: Category;
  startDateTime: string; // ISO 8601
  endDateTime?: string;
  locationName: string;
  locationAddress?: string;
  organizerName: string;
  capacity?: number;
  registeredCount: number;
  imageUrl?: string;
  tags?: string[];
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  userId: string;
  createdAt: string;
  status: 'confirmed' | 'cancelled';
}

export interface Favorite {
  eventId: string;
  userId: string;
  createdAt: string;
}

export interface LLMResult {
  id: string;
  eventId?: string;
  userId: string;
  type: 'search' | 'recommendation' | 'planning' | 'qa';
  inputText: string;
  outputText: string;
  createdAt: string;
}

export type UserRole = 'admin' | 'student';

export interface User {
  email: string;
  password: string;
  role: UserRole;
  name: string;
}