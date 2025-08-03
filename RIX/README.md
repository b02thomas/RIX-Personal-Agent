# RIX - Personal AI Second Brain MVP

Ein fortschrittlicher persönlicher AI Assistent, der als "Second Brain" System fungiert. Diese Progressive Web App (PWA) kombiniert konversationelle KI, intelligente Automatisierung und Vorhersageanalysen mit einer sprachgesteuerten Erfahrung.

## 🚀 Features

### Fünf-Tab PWA Struktur
1. **🎤 Voice/Chat Hub** - Primäre Konversationsschnittstelle mit Real-time Chat
2. **📅 Smart Calendar** - Tägliches Management-System mit KI-Optimierung
3. **📊 Intelligence Overview** - AI Insights Dashboard mit Produktivitätsanalysen
4. **📰 News Intelligence** - Personalisierter News Feed mit Marktanalysen
5. **⚙️ Settings & Integrations** - Konfigurationspanel mit N8N Management

### Chat/Voice Hub Features (Part 2)
- **Real-time Chat Interface** mit Message History
- **Voice Recording** mit Web Speech API
- **Message Threading** und Conversation Context
- **Typing Indicators** für bessere UX
- **Auto-scroll** zu neuesten Nachrichten
- **Conversation Management** (Erstellen, Löschen, Wechseln)
- **N8N Integration** für AI Processing
- **WebSocket Support** (vorbereitet für Real-time Updates)

### N8N Integration Features (Part 3)
- **SMB-AI-Solution Integration** mit vollständiger Workflow-Unterstützung
- **Intelligente Workflow-Auswahl** basierend auf Nachrichteninhalt
- **Sichere Webhook-Kommunikation** mit Signatur-Validierung
- **Rate Limiting** und Monitoring für alle N8N Endpoints
- **Workflow Status Monitoring** mit Response-Time Tracking
- **Automatische Workflow-Trigger** für verschiedene Nachrichtentypen
- **Erweiterte Sicherheitsfeatures** für N8N Kommunikation
- **N8N API Integration** mit JWT Token Authentifizierung
- **Workflow Management** mit Live-Monitoring und Execution Tracking

### PWA & Advanced Features (Part 4)
- **Progressive Web App** mit vollständiger Offline-Funktionalität
- **Service Worker** mit Workbox für intelligentes Caching
- **App Installation** auf Desktop und Mobile Geräten
- **Push Notifications** (vorbereitet für zukünftige Features)
- **Background Sync** für Offline-Synchronisation
- **Erweiterte State Management** mit Zustand Stores
- **Dummy Data Implementation** für alle Dashboard-Tabs
- **Smart Calendar** mit KI-Optimierung und Zeitblock-Management
- **Intelligence Overview** mit Produktivitätsmetriken und AI-Insights
- **News Intelligence** mit personalisierten Nachrichten und Marktanalysen
- **Connection Monitoring** mit Real-time Status-Tracking
- **Health Check System** für System-Monitoring

### Technologie-Stack
- **Frontend**: Next.js 15 mit TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand mit Persistierung
- **Datenbank**: PostgreSQL mit pgvector
- **Authentication**: JWT mit Refresh Token
- **PWA**: Service Worker mit Workbox
- **Real-time**: Socket.io (vorbereitet)
- **Voice**: Web Speech API + RecordRTC
- **Automation**: N8N Integration mit SMB-AI-Solution
- **Caching**: Workbox für intelligentes Offline-Caching

## 📋 Voraussetzungen

- Node.js 18+ 
- PostgreSQL 14+ mit pgvector Extension
- npm oder yarn
- N8N Instance (SMB-AI-Solution für Part 3)

## 🛠️ Installation

### 1. Repository klonen
```bash
git clone <repository-url>
cd RIX
```

### 2. Dependencies installieren
```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren
Erstellen Sie eine `.env.local` Datei im Root-Verzeichnis:

```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=rix_personal_agent
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# N8N Integration (Part 3)
N8N_BASE_URL=https://n8n.smb-ai-solution.com
N8N_WEBHOOK_SECRET=your_n8n_webhook_secret_here
N8N_API_KEY=your_n8n_api_key_here
N8N_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNDZiMDY2MS1iZDRlLTRjOGYtYmQxZi1jYWUxMGFkNWE0OTkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU0MDM3NzQ1fQ.R_Gc9taPmtgoHoCOAnkF6jPqe1ocgIFX5VRJka4Gers
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 4. PostgreSQL Datenbank einrichten

#### pgvector Extension installieren
```sql
-- Für Ubuntu/Debian
sudo apt-get install postgresql-14-pgvector

-- Für macOS mit Homebrew
brew install pgvector
```

#### Datenbank erstellen
```sql
CREATE DATABASE rix_personal_agent;
\c rix_personal_agent;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 5. Datenbank initialisieren
```bash
npm run dev
```
Die Datenbank-Tabellen werden automatisch beim ersten Start erstellt.

### 6. Entwicklungsserver starten
```bash
npm run dev
```

Die Anwendung ist jetzt unter `http://localhost:3000` verfügbar.

## 🏗️ Projektstruktur

```
RIX/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # Authentication APIs
│   │   │   ├── conversations/ # Chat APIs
│   │   │   ├── n8n/          # N8N Webhooks & API (Part 3)
│   │   │   └── health/       # Health Check (Part 4)
│   │   ├── auth/              # Auth Pages
│   │   └── dashboard/         # Dashboard Pages
│   ├── components/            # React Components
│   │   ├── ui/               # shadcn/ui Components
│   │   ├── layout/           # Layout Components
│   │   ├── chat/             # Chat Components (Part 2)
│   │   └── n8n/              # N8N Components (Part 3)
│   ├── lib/                  # Utilities & Config
│   │   ├── n8n/             # N8N Integration (Part 3)
│   │   ├── dummy-data/      # Mock Data (Part 4)
│   │   └── ...
│   ├── store/                # Zustand Stores
│   │   ├── auth-store.ts     # Authentication State
│   │   ├── chat-store.ts     # Chat State (Part 2)
│   │   ├── n8n-store.ts      # N8N State (Part 3)
│   │   ├── preferences-store.ts # User Preferences (Part 4)
│   │   └── connection-store.ts  # Connection Status (Part 4)
│   └── types/                # TypeScript Types
├── public/                   # Static Assets
│   ├── manifest.json         # PWA Manifest (Part 4)
│   └── sw.js                # Service Worker (Part 4)
└── package.json
```

## 🔐 Authentication System

Das System verwendet JWT-Token mit Refresh-Mechanismus:

- **Access Token**: 15 Minuten Gültigkeit
- **Refresh Token**: 7 Tage Gültigkeit
- **HTTP-only Cookies** für sichere Token-Speicherung
- **Automatische Token-Erneuerung**

### API Endpoints

**Authentication:**
- `POST /api/auth/signup` - Benutzerregistrierung
- `POST /api/auth/signin` - Benutzeranmeldung
- `POST /api/auth/refresh` - Token-Erneuerung
- `POST /api/auth/logout` - Abmeldung

**Chat (Part 2):**
- `GET /api/conversations` - Benutzer-Konversationen abrufen
- `POST /api/conversations` - Neue Konversation erstellen
- `GET /api/conversations/[id]` - Konversation mit Nachrichten abrufen
- `POST /api/conversations/[id]/messages` - Nachricht senden
- `DELETE /api/conversations/[id]` - Konversation löschen

**N8N Webhooks (Part 3):**
- `POST /api/n8n/webhook/master-brain` - Master Brain Responses
- `POST /api/n8n/webhook/voice-processing` - Voice Processing Results
- `POST /api/n8n/webhook/news-intelligence` - News Intelligence Updates
- `POST /api/n8n/webhook/calendar-intelligence` - Calendar Intelligence Updates
- `GET /api/n8n/status` - N8N Connectivity & Workflow Status

**N8N API (Part 3):**
- `GET /api/n8n/workflows` - Alle Workflows abrufen
- `GET /api/n8n/workflows/[id]` - Spezifischen Workflow abrufen
- `POST /api/n8n/workflows/[id]/execute` - Workflow ausführen
- `GET /api/n8n/executions` - Executions abrufen

**System (Part 4):**
- `GET /api/health` - System Health Check

## 💬 Chat System (Part 2)

### Features
- **Real-time Messaging** mit optimistischer UI
- **Voice Recording** mit Browser APIs
- **Conversation Management** mit Persistierung
- **Message History** mit Auto-scroll
- **Typing Indicators** für bessere UX
- **N8N Integration** für AI Processing

### Components
- `ChatContainer` - Haupt-Container für Chat Interface
- `MessageList` - Nachrichtenliste mit Auto-scroll
- `MessageBubble` - Einzelne Nachrichtenblase
- `InputArea` - Text-Eingabe mit Send Button
- `VoiceRecorder` - Sprachaufnahme mit Timer
- `TypingIndicator` - Schreib-Indikator
- `ConversationList` - Konversationsliste

### State Management
- `useChatStore` - Zustand Store für Chat State
- Persistierung von Konversationen
- Real-time Updates (vorbereitet)

## 🤖 N8N Integration System (Part 3)

### Features
- **SMB-AI-Solution Integration** mit vollständiger Workflow-Unterstützung
- **Intelligente Workflow-Auswahl** basierend auf Nachrichteninhalt
- **Sichere Webhook-Kommunikation** mit Signatur-Validierung
- **Rate Limiting** und Monitoring für alle N8N Endpoints
- **Workflow Status Monitoring** mit Response-Time Tracking
- **Automatische Workflow-Trigger** für verschiedene Nachrichtentypen
- **N8N API Integration** mit JWT Token Authentifizierung
- **Workflow Management** mit Live-Monitoring

### N8N Workflows
- **Master Brain Orchestrator** - Zentrale AI-Verarbeitung
- **Voice Processing Pipeline** - Sprachaufnahme und Transkription
- **News Intelligence Engine** - Personalisierte News-Analyse
- **Calendar Intelligence System** - Termin-Management und -Optimierung
- **Task Management Automation** - Aufgaben-Verwaltung
- **Project Chatbot Engine** - Projekt-spezifische AI-Unterstützung
- **Morning Brief Generator** - Tägliche Zusammenfassungen
- **Notification Management System** - Intelligente Benachrichtigungen
- **Analytics Learning Engine** - Verhaltensanalyse und -Optimierung

### N8N Client Library
- `N8NClient` - Zentrale Client-Klasse für alle N8N Operationen
- `N8NWebhookMiddleware` - Sicherheits- und Validierungs-Middleware
- `useN8NStore` - Zustand Store für N8N Status und Monitoring
- **API Methods** - Workflow Management, Execution Tracking
- **JWT Authentication** - Sichere API-Kommunikation

### N8N API Features
- **Workflow Management** - Abrufen, Ausführen, Überwachen
- **Execution Tracking** - Live-Monitoring von Workflow-Ausführungen
- **Status Monitoring** - Real-time Workflow-Status
- **Error Handling** - Umfassende Fehlerbehandlung
- **Performance Tracking** - Response-Time Monitoring

### Sicherheitsfeatures
- **Webhook Secret Validation** für eingehende Requests
- **API Key Authentication** für ausgehende Requests
- **JWT Token Authentication** für API-Zugriff
- **Request Signing** und Verifikation
- **Rate Limiting** auf Webhook-Endpoints
- **Comprehensive Logging** für Monitoring

## 📱 PWA Features (Part 4)

### Progressive Web App
- **Offline-Funktionalität** mit Service Worker
- **App-Installation** auf Desktop und Mobile
- **Push-Benachrichtigungen** (vorbereitet)
- **Background Sync** für Offline-Synchronisation
- **Intelligentes Caching** mit Workbox
- **Manifest.json** mit vollständiger PWA-Konfiguration

### Service Worker Features
- **Workbox Integration** für intelligentes Caching
- **Cache-First Strategie** für statische Assets
- **Network-First Strategie** für API Calls
- **Offline-Fallback** für kritische Seiten
- **Background Sync** für Offline-Aktionen
- **Push Notification Support** (vorbereitet)

## 📊 Dashboard Features (Part 4)

### Smart Calendar (Tab 2)
- **Zeitblock-Management** mit Produktivitäts-Tracking
- **KI-Optimierung** für Terminplanung
- **Produktivitäts-Metriken** in Echtzeit
- **AI-Empfehlungen** für bessere Zeitplanung
- **Meeting-Management** mit Teilnehmer-Tracking
- **Fokus-Zeit Optimierung** basierend auf Produktivitätsdaten

### Intelligence Overview (Tab 3)
- **Produktivitäts-Metriken** mit Trend-Analysen
- **Projekt-Management** mit Fortschritts-Tracking
- **AI-Insights** mit Handlungsempfehlungen
- **Lernempfehlungen** basierend auf Interessen
- **Performance-Analysen** mit wöchentlichen Trends
- **Team-Kollaboration** Metriken

### News Intelligence (Tab 4)
- **Personalisierte Nachrichten** basierend auf Interessen
- **Marktanalysen** mit Echtzeit-Daten
- **Sentiment-Analyse** für Nachrichten
- **Trending Topics** mit Mention-Tracking
- **Finanzdaten** für relevante Aktien
- **KI-Empfehlungen** für News-Konsum

## 🎨 UI/UX Features

- **Mobile-first** responsives Design
- **Bottom Navigation** für Mobile
- **Sidebar Navigation** für Desktop
- **Dark/Light Mode** Support
- **Smooth Animations** mit Framer Motion
- **Accessibility** optimiert
- **PWA Installation** Prompts
- **Offline Indicators** für bessere UX

## 🔧 Entwicklung

### Verfügbare Scripts

```bash
npm run dev          # Entwicklungsserver starten
npm run build        # Produktions-Build erstellen
npm run start        # Produktions-Server starten
npm run lint         # ESLint ausführen
npm run type-check   # TypeScript Typen prüfen
```

### Code-Struktur

- **TypeScript** für Typsicherheit
- **ESLint** für Code-Qualität
- **Prettier** für Code-Formatierung
- **Husky** für Git-Hooks (optional)

## 🚀 Deployment

### Vercel (Empfohlen)

1. Repository zu Vercel verbinden
2. Umgebungsvariablen in Vercel Dashboard setzen
3. PostgreSQL Datenbank (z.B. Supabase, Neon) einrichten
4. Deploy

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📊 Datenbank-Schema

### Haupttabellen

```sql
-- Benutzer
users (id, email, password_hash, first_name, last_name, created_at, updated_at)

-- Sessions
user_sessions (id, user_id, refresh_token, expires_at, created_at)

-- Konversationen (Part 2)
conversations (id, user_id, title, created_at, updated_at)

-- Nachrichten (Part 2)
messages (id, conversation_id, user_id, content, message_type, is_from_ai, created_at)

-- Kalender-Events
calendar_events (id, user_id, title, description, start_time, end_time, location, is_all_day)

-- Benutzer-Präferenzen
user_preferences (id, user_id, theme, language, notifications_enabled, voice_enabled)
```

## 🔮 Nächste Schritte

### Part 5: Advanced Features & Production
- **Real-time WebSocket Integration** für Live-Updates
- **Advanced Analytics** mit Chart.js oder Recharts
- **Push Notifications** mit Service Worker
- **Advanced N8N Workflows** für komplexe Automatisierung
- **Performance Optimization** und Caching-Strategien
- **Advanced Security Features** und Penetration Testing
- **Mobile App** mit React Native oder Flutter
- **AI-Powered Features** mit OpenAI Integration

## 🤝 Beitragen

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/amazing-feature`)
3. Commits erstellen (`git commit -m 'Add amazing feature'`)
4. Branch pushen (`git push origin feature/amazing-feature`)
5. Pull Request erstellen

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:

1. Issues auf GitHub erstellen
2. Dokumentation durchsuchen
3. Community-Diskussionen besuchen

---

**RIX** - Ihr persönlicher AI Second Brain 🧠✨

**Status**: MVP Part 4/4 ✅ Vollständig implementiert 