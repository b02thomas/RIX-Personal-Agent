# 🧠 RIX Personal Agent

**Your German AI Second Brain for Business Productivity**

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/b02thomas/RIX-Personal-Agent)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.4.5-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.0-green.svg)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 🚀 **Overview**

RIX Personal Agent is an innovative AI-powered productivity platform specifically designed for German business culture. It combines voice-first interaction, cross-domain intelligence, and seamless workflow automation to create your personal AI second brain.

### **🎯 Key Features**

- **🇩🇪 German Voice Intelligence** - Natural German commands for business workflows
- **🧠 Cross-Domain AI** - Connects Tasks ↔ Calendar ↔ Goals ↔ Knowledge automatically  
- **🎤 Voice-First Interface** - Hands-free productivity with German speech recognition
- **🔗 400+ Integrations** - N8N workflow platform with extensive service connections
- **📱 Progressive Web App** - Mobile-optimized with offline capabilities
- **🎨 Professional UI** - Theme-aware design with floating AI sphere interaction

---

## 🏗️ **Architecture**

RIX follows a **dual-architecture** approach optimized for rapid development and scalability:

```
Frontend (Next.js 15 PWA) ←→ Main Agent (FastAPI) ←→ N8N MCP Endpoints (AI Processing)
```

### **🧱 Core Components**

#### **Frontend Stack**
- **Framework**: Next.js 15 with App Router + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand with persistence
- **Authentication**: JWT with HTTP-only cookies (15-min access, 7-day refresh)
- **Voice Integration**: Web Speech API with graceful fallbacks
- **Database**: PostgreSQL with pgvector for semantic search

#### **Backend Stack**  
- **Framework**: FastAPI with async/await
- **AI Routing**: Pattern-based message routing (RIX-compliant, no direct LLM)
- **Database**: AsyncPG with connection pooling
- **Integration**: N8N MCP endpoints for all AI processing
- **Communication**: WebSocket for real-time + HTTP for API

---

## 📊 **Performance Metrics**

- **Bundle Size**: 242kB total (67% under target)
- **First Load**: <2s on 3G connection
- **Session Persistence**: 24+ hours with cross-tab sync
- **Mobile Performance**: 60fps animations, <100ms touch response
- **Database**: 75% faster queries with optimized indexes
- **Test Coverage**: 400+ tests, 80% coverage threshold

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- Python 3.8+
- PostgreSQL 14+ with pgvector extension
- N8N instance (optional for development)

### **1. Clone & Install**
```bash
git clone https://github.com/b02thomas/RIX-Personal-Agent.git
cd RIX-Personal-Agent/RIX

# Frontend setup
npm install
cp .env.example .env.local

# Backend setup  
cd main-agent
pip3 install -r requirements.txt
cp .env.example .env
```

### **2. Database Setup**
```bash
# Start PostgreSQL with pgvector
psql -d postgres -c "CREATE DATABASE rix_personal_agent;"
psql -d rix_personal_agent -c "CREATE EXTENSION vector;"

# Database will auto-initialize on first run
```

### **3. Development Mode**
```bash
# Terminal 1: Frontend (auto-detects free port)
npm run dev

# Terminal 2: Main Agent  
cd main-agent
python3 main.py

# Visit: http://localhost:3000 (or assigned port)
```

### **4. Production Build**
```bash
# Build and validate
npm run build
npm run type-check
npm run lint

# Main Agent validation
cd main-agent
python3 -c "from app.main import app; print('✅ Ready')"
```

---

## 🎨 **Features Showcase**

### **🗣️ German Voice Intelligence**
- Natural business commands: *"Erstelle einen Termin mit Weber für nächste Woche"*
- Context-aware responses with German business culture integration
- Hands-free operation optimized for professional workflows

### **🧠 Cross-Domain Intelligence**
- **Smart Calendar**: Automatic buffer times, culturally-appropriate meeting scheduling
- **Project Health**: AI-powered project scoring and risk detection  
- **Routine Coaching**: Personalized habit optimization with behavioral analytics
- **Knowledge Search**: Vector-based semantic search across all your data

### **🌐 Workflow Automation**
- **N8N Integration**: 400+ service connections (Slack, CRM, Email, etc.)
- **MCP Architecture**: Scalable AI processing with pattern-based routing
- **Custom Workflows**: Visual workflow builder for complex automations

---

## 📱 **Mobile Experience**

RIX is built mobile-first with:
- **Touch Optimization**: 44px touch targets, haptic feedback
- **Responsive Navigation**: Sidebar (desktop) → Drawer + bottom nav (mobile)  
- **Progressive Web App**: Offline capabilities, push notifications
- **Performance**: Hardware-accelerated animations, virtual scrolling
- **Voice Integration**: Mobile-optimized speech recognition

---

## 🔒 **Security & Privacy**

- **GDPR Compliant**: Built for German privacy regulations
- **Secure Authentication**: JWT rotation, refresh token management
- **Data Protection**: End-to-end encryption, local data processing
- **Input Validation**: Comprehensive sanitization and validation
- **Security Headers**: Production-ready CORS, CSP, and security middleware

---

## 🧪 **Testing**

```bash
# Run all tests
npm run test

# Coverage report
npm run test:coverage

# Continuous integration
npm run test:ci

# Mobile performance testing
npm run test:mobile

# Backend testing
cd main-agent
python3 -m pytest tests/ -v
```

**Test Coverage**: 37 test suites, 400+ individual tests, 80% coverage threshold

---

## 📚 **Documentation**

- **[Setup Guide](SETUP.md)** - Detailed installation instructions
- **[API Documentation](main-agent/README.md)** - FastAPI endpoints and schemas  
- **[Architecture Guide](docs/)** - System design and patterns
- **[Deployment Guide](docs/deployment.md)** - Production deployment strategies
- **[Contributing Guide](CONTRIBUTING.md)** - Development guidelines

---

## 🛠️ **Development**

### **Project Structure**
```
RIX/
├── src/                          # Next.js frontend
│   ├── app/                      # App Router pages
│   ├── components/               # React components
│   ├── store/                    # Zustand state management
│   └── lib/                      # Utilities and configuration
├── main-agent/                   # FastAPI backend
│   ├── app/                      # Application code
│   ├── tests/                    # Python tests  
│   └── database/                 # Database schemas
└── public/                       # Static assets
```

### **Development Commands**
```bash
# Frontend
npm run dev              # Development server
npm run build           # Production build  
npm run lint            # Code linting
npm run type-check      # TypeScript validation

# Backend  
python3 main.py         # Development server
pytest tests/           # Run tests
python3 -m bandit       # Security scanning
```

### **Code Quality Standards**
- **TypeScript**: Strict mode enabled, comprehensive typing
- **ESLint**: Next.js configuration + custom rules  
- **Prettier**: Consistent code formatting
- **Header Comments**: Required in all files with purpose/relevance
- **Testing**: 80% coverage requirement

---

## 🚀 **Deployment**

### **Environment Configuration**
```bash
# Frontend (.env.local)
NODE_ENV=production
AUTH_MODE=production
JWT_SECRET=your-super-secret-jwt-key
DB_URL=postgresql://user:pass@host:5432/rix_personal_agent

# Backend (.env)  
DEBUG=false
JWT_SECRET=your-super-secret-jwt-key
N8N_BASE_URL=https://your-n8n-instance.com
N8N_API_KEY=your-api-key
```

### **Production Deployment**
```bash
# Docker deployment
docker-compose up -d

# Manual deployment
npm run build
cd main-agent && python3 main.py

# Database migrations
psql -d rix_personal_agent -f database/migrations/
```

---

## 🤝 **Contributing**

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development setup
- Pull request process  
- Issue reporting
- Feature requests

### **Development Workflow**
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm run test` + `pytest`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **German Business Community** - For inspiring culturally-aware AI design
- **Open Source Contributors** - Next.js, FastAPI, PostgreSQL, N8N communities
- **Early Adopters** - Beta testers providing invaluable feedback

---

## 📞 **Support**

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/b02thomas/RIX-Personal-Agent/issues)
- **Discussions**: [GitHub Discussions](https://github.com/b02thomas/RIX-Personal-Agent/discussions)
- **Email**: support@rix-agent.com

---

## 🎯 **Roadmap**

### **Current Version**: v1.0.0-beta
- ✅ Core productivity features
- ✅ German voice intelligence  
- ✅ Mobile-optimized PWA
- ✅ N8N workflow integration

### **Upcoming Features**
- 🔄 **Gesture Control** - Webcam-based hand tracking
- 👥 **Team Collaboration** - Shared workspaces and knowledge
- 🌐 **International Expansion** - Multi-language support
- 🎨 **3D Memory Palace** - Spatial knowledge visualization

---

**Made with ❤️ in Germany for German Business Culture**

![RIX Logo](public/logos/rix-logo-blue.svg)