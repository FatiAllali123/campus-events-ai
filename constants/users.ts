import { User } from '../types';

export const PRECONFIGURED_USERS: User[] = [
  {
    email: 'admin@campus.ma',
    password: 'admin123',
    role: 'admin',
    name: 'Administrateur',
  },
  {
    email: 'etudiant@campus.ma',
    password: 'etudiant123',
    role: 'student',
    name: 'Étudiant',
  },
];