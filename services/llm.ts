import { Platform } from 'react-native';


const API_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY || '';
console.log('🔑 Clé API:', API_KEY ? 'Chargée ✅' : 'Manquante ❌');

// Configuration Groq (gratuit, rapide)
const LLM_CONFIG = {
  baseUrl: 'https://api.groq.com/openai/v1',
  model: 'llama-3.1-8b-instant',
};

interface LLMRequest {
  messages: { role: 'system' | 'user'; content: string }[];
  temperature?: number;
  max_tokens?: number;
}

interface LLMResponse {
  choices: { message: { content: string } }[];
  error?: { message: string };
}

export async function callLLM(request: LLMRequest): Promise<string> {
  if (!API_KEY) {
    throw new Error('Clé API non configurée. Ajoutez LLM_API_KEY dans .env');
  }

  try {
    const response = await fetch(`${LLM_CONFIG.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_CONFIG.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erreur HTTP ${response.status}`);
    }

    const data: LLMResponse = await response.json();
    return data.choices[0]?.message?.content || 'Pas de réponse du modèle';
  } catch (error: any) {
    console.error('Erreur LLM:', error);
    throw new Error(error.message || 'Erreur de connexion à l\'API');
  }
}

// Prompts pour chaque fonctionnalité IA

export function buildSearchPrompt(query: string, events: any[]): string {
  const eventsJson = JSON.stringify(events.slice(0, 20), null, 2); // Limite à 20 événements
  
  return `Tu es un assistant intelligent pour un campus universitaire.
L'utilisateur cherche un événement avec cette requête: "${query}"

CATALOGUE DES ÉVÉNEMENTS (format JSON):
${eventsJson}

INSTRUCTIONS:
1. Analyse la requête en langage naturel
2. Identifie les événements pertinents même sans correspondance exacte de mots-clés
3. Pour chaque événement pertinent, donne:
   - Le titre exact
   - Une justification courte (1 phrase) expliquant pourquoi il correspond à la requête

FORMAT DE RÉPONSE:
## Résultats de recherche

1. **[Titre de l'événement]** - *Justification: pourquoi cet événement correspond*

2. **[Titre de l'événement]** - *Justification: pourquoi cet événement correspond*

Si aucun événement ne correspond, dis-le clairement.`;
}

export function buildRecommendationPrompt(userHistory: any[], upcomingEvents: any[]): string {
  const historyJson = JSON.stringify(userHistory.slice(0, 10), null, 2);
  const eventsJson = JSON.stringify(upcomingEvents.slice(0, 15), null, 2);
  
  return `Tu es un assistant intelligent pour un campus universitaire.
Tu dois recommander 3 événements à venir basés sur l'historique de l'étudiant.

HISTORIQUE DE L'ÉTUDIANT (favoris et inscriptions):
${historyJson}

ÉVÉNEMENTS À VENIR:
${eventsJson}

INSTRUCTIONS:
1. Analyse les patterns dans l'historique (catégories préférées, tags, etc.)
2. Suggère EXACTEMENT 3 événements à venir que l'étudiant n'a pas encore consultés
3. Pour chaque suggestion, donne:
   - Le titre exact
   - Une justification personnalisée (1-2 phrases) expliquant pourquoi ça correspond à son profil

FORMAT DE RÉPONSE:
## Recommandations pour vous 🎯

1. **[Titre]** - *Pourquoi ça vous correspond: ...*

2. **[Titre]** - *Pourquoi ça vous correspond: ...*

3. **[Titre]** - *Pourquoi ça vous correspond: ...*`;
}

export function buildPlanningPrompt(constraints: string, weekEvents: any[]): string {
  const eventsJson = JSON.stringify(weekEvents.slice(0, 20), null, 2);
  
  return `Tu es un assistant de planification pour étudiants.
L'étudiant a ces contraintes: "${constraints}"

ÉVÉNEMENTS DE LA SEMAINE:
${eventsJson}

INSTRUCTIONS:
1. Crée un planning de participation suggéré sur la semaine
2. Respecte STRICTEMENT les contraintes horaires mentionnées
3. Évite les conflits d'horaires
4. Pour chaque jour, suggère 0, 1 ou plusieurs événements pertinents
5. Explique brièvement chaque choix

FORMAT DE RÉPONSE:
## Planning suggéré 📅

**Lundi**: [Événement] à [Heure] - *Pourquoi c'est pertinent*

**Mardi**: Aucun événement suggéré / [Événement] à [Heure]

...etc pour chaque jour de la semaine

**Conseil final**: Un conseil global sur la planification`;
}

export function buildQAPrompt(question: string, events: any[]): string {
  const eventsJson = JSON.stringify(events.slice(0, 20), null, 2);
  
  return `Tu es un assistant expert du campus universitaire.
Tu as accès au catalogue complet des événements.

QUESTION: "${question}"

CATALOGUE:
${eventsJson}

INSTRUCTIONS:
1. Réponds à la question de façon claire et concise
2. Base-toi UNIQUEMENT sur les données du catalogue
3. Si des calculs sont nécessaires (places disponibles, etc.), fais-les
4. Si tu ne peux pas répondre avec certitude, dis-le honnêtement

FORMAT: Réponse directe, pas de markdown complexe.`;
}