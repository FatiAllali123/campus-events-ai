# 🎓 CampusEvents AI

Application mobile React Native / Expo pour la gestion intelligente des événements universitaires, avec assistant IA intégré (Groq + LLaMA 3.1).

## ✨ Fonctionnalités

### Rôle Étudiant
- Catalogue d'événements avec recherche, filtres par catégorie et période
- Favoris et inscriptions persistants
- Assistant IA : recherche en langage naturel, recommandations, planning, Q&R

### Rôle Admin
- CRUD complet (créer, modifier, supprimer, lister) les événements
- Validations de formulaires, gestion des capacités

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Application Expo Go sur votre téléphone (iOS ou Android)

### Étapes

```bash
# 1. Cloner le repo
git clone https://github.com/FatiAllali123/campus-events-ai.git
cd campus-events-ai

# 2. Installer les dépendances
npm install

# 3. Configurer la clé API
cp .env.example .env
# Éditez .env et ajoutez votre clé Groq (voir section Configuration)

# 4. Lancer l'application
npx expo start
```

Scanner le QR code avec Expo Go pour tester sur votre téléphone.

---

## 🔑 Configuration de la clé API

L'assistant IA utilise [Groq](https://console.groq.com) (gratuit).
```bash
EXPO_PUBLIC_LLM_API_KEY=gsk_votre_clé_ici
```
> ⚠️ Ne committez jamais votre clé API. Le fichier `.env` est dans `.gitignore`.

---

## 👤 Comptes de démo

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@campus.ma` | `admin123` |
| Étudiant | `etudiant@campus.ma` | `etudiant123` |

---

## 🗄️ Base de données

SQLite via `expo-sqlite`. Les tables sont créées automatiquement au premier lancement :

- `events` — catalogue des événements
- `registrations` — inscriptions des étudiants
- `favorites` — favoris par utilisateur
- `llm_results` — cache des réponses IA

---

## 🤖 Architecture des prompts IA

Les 4 prompts sont définis dans `services/llm.ts` :

| Prompt | Fichier | Description |
|--------|---------|-------------|
| Recherche NL | `buildSearchPrompt` | Trouve des événements sans mot-clé exact |
| Recommandation | `buildRecommendationPrompt` | Suggestions basées sur l'historique |
| Planning | `buildPlanningPrompt` | Planning hebdomadaire sans conflits |
| Q&R | `buildQAPrompt` | Questions transversales sur le catalogue |

Voir les commentaires JSDoc dans `services/llm.ts` pour la justification détaillée de chaque prompt.

---

---

## 🛠️ Stack technique

- **React Native** + **Expo Router** (navigation fichier)
- **expo-sqlite** (persistance locale)
- **Groq API** + LLaMA 3.1 8B Instant (IA)
- **TypeScript** (typage statique)
- **AsyncStorage** (session utilisateur)



1. Créez un compte sur [console.groq.com](https://console.groq.com)
2. Générez une clé API
3. Créez un fichier `.env` à la racine :
