import { getDatabase } from './init';
import { LLMResult } from '../types';

export function saveLLMResult(result: LLMResult): void {
  const db = getDatabase();
  
  db.runSync(
    'INSERT INTO llm_results (id, eventId, userId, type, inputText, outputText, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [result.id, result.eventId || null, result.userId, result.type, result.inputText, result.outputText, result.createdAt]
  );
}

export function getLLMResultsByUser(userId: string): LLMResult[] {
  const db = getDatabase();
  return db.getAllSync<LLMResult>(
    'SELECT * FROM llm_results WHERE userId = ? ORDER BY createdAt DESC',
    [userId]
  );
}

export function getLLMResultByType(userId: string, type: string, inputText: string): LLMResult | null {
  const db = getDatabase();
  return db.getFirstSync<LLMResult>(
    'SELECT * FROM llm_results WHERE userId = ? AND type = ? AND inputText = ? ORDER BY createdAt DESC LIMIT 1',
    [userId, type, inputText]
  );
}

export function clearLLMResults(userId: string): void {
  const db = getDatabase();
  db.runSync('DELETE FROM llm_results WHERE userId = ?', [userId]);
}