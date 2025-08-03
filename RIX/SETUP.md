# RIX Setup Guide - Erste Version

## 🚀 Schnellstart

### 1. Umgebungsvariablen einrichten

Erstelle eine `.env.local` Datei im Root-Verzeichnis:

```env
# Database
DB_USER=postgres
DB_HOST=localhost
DB_NAME=rix_personal_agent
DB_PASSWORD=your_password
DB_PORT=5432

# JWT
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# N8N Integration (für später)
N8N_BASE_URL=https://n8n.smb-ai-solution.com
N8N_WEBHOOK_SECRET=your_n8n_webhook_secret_here
N8N_API_KEY=your_n8n_api_key_here
N8N_JWT_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiNDZiMDY2MS1iZDRlLTRjOGYtYmQxZi1jYWUxMGFkNWE0OTkiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU0MDM3NzQ1fQ.R_Gc9taPmtgoHoCOAnkF6jPqe1ocgIFX5VRJka4Gers

# Socket (für später)
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

### 2. PostgreSQL einrichten

#### pgvector Extension installieren:

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-14-pgvector
```

**macOS mit Homebrew:**
```bash
brew install pgvector
```

#### Datenbank erstellen:
```sql
CREATE DATABASE rix_personal_agent;
\c rix_personal_agent;
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Entwicklungsserver starten

```bash
npm run dev
```

Die Datenbank-Tabellen werden automatisch beim ersten Start erstellt.

## 📋 Was funktioniert in der ersten Version

### ✅ Implementiert:
- **Authentication System** - Registrierung, Login, JWT
- **Basis Navigation** - 5-Tab Struktur
- **Dashboard Layout** - Responsive Design
- **Dummy Data** - Für alle Tabs
- **PWA Features** - Service Worker, Manifest
- **N8N Integration** - API Endpoints vorbereitet

### 🎯 Erste Schritte zum Testen:

1. **Registrierung/Login** testen
2. **Navigation** zwischen Tabs testen
3. **Dummy Data** in allen Tabs anzeigen
4. **PWA Installation** testen
5. **Health Check** unter `/api/health` testen

## 🔧 Schrittweise Entwicklung

### Phase 1: Basis-Funktionalität ✅
- [x] Authentication
- [x] Navigation
- [x] Dummy Data
- [x] PWA Setup

### Phase 2: Chat System (nächster Schritt)
- [ ] Real-time Chat implementieren
- [ ] Voice Recording hinzufügen
- [ ] WebSocket Integration
- [ ] N8N Webhook Tests

### Phase 3: N8N Integration
- [ ] N8N Workflows konfigurieren
- [ ] Webhook Endpoints testen
- [ ] AI Processing implementieren

### Phase 4: Advanced Features
- [ ] Real-time Updates
- [ ] Push Notifications
- [ ] Advanced Analytics

## 🐛 Troubleshooting

### Häufige Probleme:

1. **Datenbank-Verbindung fehlschlägt:**
   - PostgreSQL läuft?
   - `.env.local` korrekt konfiguriert?
   - pgvector Extension installiert?

2. **JWT Fehler:**
   - `JWT_SECRET` in `.env.local` gesetzt?
   - Secret lang genug (mindestens 32 Zeichen)?

3. **PWA funktioniert nicht:**
   - HTTPS erforderlich für PWA Features
   - Service Worker registriert?

## 📞 Support

Bei Problemen:
1. Console-Logs prüfen
2. Network-Tab im Browser prüfen
3. `/api/health` Endpoint testen
4. Issue auf GitHub erstellen 