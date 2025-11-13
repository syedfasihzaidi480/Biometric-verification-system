# Create-Anything Project Structure Analysis

## 📋 Project Overview

This is a **full-stack biometric verification platform** with mobile and web clients, backend API services, ML processing, and admin dashboard.

---

## 🏗️ Architecture

```
create-anything/
├── 📱 Mobile Apps (React Native + Expo)
├── 🌐 Web Apps (React + Vite)
├── 🔧 Backend API (Node.js + TypeScript)
├── 🤖 ML Service (Python + FastAPI)
├── 📊 Admin Dashboard (React + TypeScript)
└── 📚 Documentation (Deployment, Setup, Guides)
```

---

## 📂 Detailed Structure

### 1. **Root Level**
```
create-anything/
├── package.json              # Monorepo scripts (format, lint, test)
├── tsconfig.base.json        # Shared TypeScript config
├── .prettierrc.json         # Code formatting rules
├── .eslintrc.js             # Linting rules
├── nixpacks.toml            # Railway deployment config
├── railway.json             # Railway service config
├── build.sh / start.sh      # Deployment scripts
└── railway.env.template     # Environment variable template
```

**Purpose**: Monorepo management, shared configs, deployment orchestration

---

### 2. **API Service** (`/api`)
```
api/
├── src/                      # TypeScript source
│   ├── controllers/          # Request handlers
│   │   ├── accountController.ts
│   │   ├── adminController.ts
│   │   ├── authController.ts
│   │   └── verifyController.ts
│   ├── middleware/          # Auth, validation
│   │   └── auth.ts
│   ├── routes/              # Express routes
│   │   ├── account.ts
│   │   ├── admin.ts
│   │   ├── auth.ts
│   │   └── verify.ts
│   ├── services/            # External integrations
│   │   ├── cloudinary.ts    # Media storage
│   │   ├── ml.ts            # ML service client
│   │   └── upload.ts        # File upload handling
│   ├── store/               # Data layer
│   │   └── usersStore.ts
│   └── server.ts            # Express app entry
├── dist/                    # Compiled JavaScript
├── package.json
└── tsconfig.json
```

**Tech Stack**: Node.js, Express, TypeScript
**Purpose**: REST API for authentication, verification, admin operations
**Key Features**:
- User authentication (register, login, session management)
- Biometric verification workflows
- Document upload and processing
- Admin user management
- Integration with ML service and Cloudinary

---

### 3. **Mobile App** (`/apps/mobile`)
```
apps/mobile/
├── src/
│   ├── app/                 # Expo Router screens
│   │   ├── (tabs)/          # Tab navigation
│   │   │   ├── index.jsx
│   │   │   ├── profile.jsx
│   │   │   └── register/
│   │   ├── dashboard.jsx
│   │   ├── document-upload.jsx
│   │   ├── face-verification.jsx
│   │   ├── liveness-check.jsx
│   │   ├── login.jsx
│   │   ├── registration.jsx
│   │   ├── voice-enrollment.jsx
│   │   └── voice-verification.jsx
│   ├── components/          # Reusable UI
│   │   ├── DateInput.jsx           ✨ Enhanced
│   │   ├── PhoneNumberInput.jsx    ✨ New
│   │   └── KeyboardAvoidingAnimatedView.jsx
│   ├── screens/             # Screen components
│   │   ├── RegistrationScreen.jsx  ✨ Updated
│   │   ├── LoginScreen.jsx
│   │   ├── DashboardScreen.jsx
│   │   └── ...
│   ├── utils/               # Utilities
│   │   ├── auth/            # Auth helpers
│   │   ├── api.js           # API client
│   │   ├── theme/           # Theming
│   │   └── ...
│   ├── services/            # External services
│   │   └── api.js
│   └── i18n/                # Internationalization
│       ├── translations.js
│       └── useTranslation.js
├── assets/                  # Images, fonts
├── app.json                 # Expo config
├── eas.json                 # Expo build config
├── metro.config.js
├── package.json
└── tsconfig.json
```

**Tech Stack**: React Native 0.81, Expo SDK 54, TypeScript
**Purpose**: Mobile app for biometric enrollment and verification
**Key Features**:
- User registration with biometrics
- Face recognition (liveness detection)
- Voice enrollment and verification
- Document upload (ID, passport)
- Real-time camera processing
- Secure local storage

**Recent Enhancements**:
- ✨ DateInput with calendar picker and future date blocking
- ✨ PhoneNumberInput with country picker and validation
- ✨ Enhanced registration flow

---

### 4. **Web App** (`/apps/web`)
```
apps/web/
├── src/                     # React source
│   ├── components/          # UI components
│   ├── pages/              # Route pages
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Helpers
│   └── styles/             # CSS
├── public/                 # Static assets
├── plugins/                # Vite plugins
├── build/                  # Production build
├── vite.config.ts          # Vite config
├── tailwind.config.js      # Tailwind CSS
├── react-router.config.ts  # Routing
├── package.json
└── tsconfig.json
```

**Tech Stack**: React 19, Vite, Tailwind CSS, React Router
**Purpose**: Web interface for user access
**Key Features**:
- Responsive web UI
- Tailwind-based styling
- Modern build tooling

---

### 5. **ML Service** (`/ml-service`)
```
ml-service/
├── app/
│   └── main.py             # FastAPI entry
├── tests/                  # Test suite
│   ├── test_document.py
│   ├── test_health.py
│   ├── test_liveness.py
│   └── test_voice.py
├── pyproject.toml          # Python project config
├── requirements.txt        # Dependencies
├── nixpacks.toml
└── railway.json
```

**Tech Stack**: Python, FastAPI
**Purpose**: Machine learning inference service
**Key Features**:
- Document verification
- Face liveness detection
- Voice biometric analysis
- Health check endpoints
- Standalone microservice

---

### 6. **Admin Dashboard** (`/dashboard`)
```
dashboard/
├── src/
│   ├── App.tsx             # Main app
│   ├── components/         # UI components
│   │   ├── Sidebar.tsx
│   │   └── UserCard.tsx
│   ├── pages/              # Admin pages
│   │   ├── Dashboard.tsx
│   │   ├── Users.tsx
│   │   ├── Verifications.tsx
│   │   ├── Settings.tsx
│   │   └── Analytics.tsx
│   └── i18n/               # Translations
│       ├── en.json
│       ├── fr.json
│       ├── ar.json
│       ├── es.json
│       └── pt.json
├── dist/                   # Build output
├── package.json
└── tsconfig.json
```

**Tech Stack**: React, TypeScript, i18n
**Purpose**: Admin panel for user management
**Key Features**:
- User management (view, edit, delete)
- Verification review and approval
- Analytics and reporting
- Multi-language support (5 languages)
- Media preview (documents, photos, voice)

---

### 7. **Legacy Mobile App** (`/mobile-app`)
```
mobile-app/
├── src/                    # TypeScript source
│   ├── App.tsx
│   ├── components/
│   ├── screens/
│   ├── hooks/
│   ├── services/
│   └── i18n/
├── dist/                   # Compiled JS
├── app.json
├── package.json
└── tsconfig.json
```

**Status**: Legacy/Alternative implementation
**Purpose**: Older React Native codebase (may be deprecated or alternate version)

---

### 8. **Infrastructure** (`/infra`)
```
infra/
└── (currently empty)
```

**Purpose**: Placeholder for infrastructure-as-code (Terraform, Docker, K8s configs)

---

### 9. **Scripts** (`/scripts`)
```
scripts/
├── check-env.cjs           # Environment validation
└── db-health.cjs          # Database health checks
```

**Purpose**: Utility scripts for deployment and maintenance

---

### 10. **GitHub Workflows** (`/.github`)
```
.github/
└── workflows/              # CI/CD pipelines
```

**Purpose**: Automated testing, building, deployment

---

## 🔗 Service Communication

```
┌──────────────┐
│  Mobile App  │────┐
└──────────────┘    │
                    │
┌──────────────┐    │     ┌──────────────┐
│   Web App    │────┼────▶│   API Node   │
└──────────────┘    │     └──────────────┘
                    │            │
┌──────────────┐    │            ├─────▶ Cloudinary (Media)
│   Dashboard  │────┘            │
└──────────────┘                 └─────▶ ML Service (Python)
                                         └─────▶ Database
```

---

## 🗄️ Data Storage

- **User Data**: PostgreSQL (managed via API)
- **Media Files**: Cloudinary CDN
- **Session/Tokens**: Secure cookies, JWT
- **Local (Mobile)**: Expo SecureStore, AsyncStorage

---

## 🚀 Deployment

### Railway Platform
- API Service → Node.js runtime
- ML Service → Python runtime
- Web App → Static hosting
- Mobile App → Expo EAS Build

### Configuration Files
- `nixpacks.toml` → Build instructions
- `railway.json` → Service config
- `build.sh` / `start.sh` → Custom scripts

---

## 📦 Dependencies

### API
- Express (web framework)
- TypeScript
- JWT authentication
- Cloudinary SDK
- HTTP client (for ML service)

### Mobile App
- React Native 0.81
- Expo SDK 54
- React Navigation
- Expo Camera, FileSystem, SecureStore
- libphonenumber-js (phone validation)
- react-native-calendars (date picker)
- react-native-country-picker-modal

### Web App
- React 19
- Vite (build tool)
- Tailwind CSS
- React Router

### ML Service
- FastAPI
- Python ML libraries (face recognition, voice analysis)

---

## 🌍 Internationalization

Supported Languages:
- 🇬🇧 English (en)
- 🇫🇷 French (fr)
- 🇸🇦 Arabic (ar)
- 🇪🇸 Spanish (es)
- 🇵🇹 Portuguese (pt)

---

## 📝 Documentation

The project includes extensive documentation:

### Deployment Guides
- `RAILWAY_DEPLOYMENT.md`
- `COMPLETE_BEGINNER_RAILWAY_GUIDE.md`
- `MOBILE_APP_DEPLOYMENT.md`
- `RAILWAY_QUICKSTART.md`

### Troubleshooting
- `RAILWAY_502_TROUBLESHOOTING.md`
- `RAILWAY_502_FINAL_FIX.md`
- `FIX_502_RAILWAY.md`
- `DEBUG.md`

### Setup & Configuration
- `SETUP.md`
- `ENV_VARIABLES_REFERENCE.md`
- `RAILWAY_ENV_SETUP.md`
- `CLOUDINARY_SETUP.md`
- `CLOUDINARY_QUICKSTART.md`

### Implementation Guides
- `ARCHITECTURE.md`
- `BIOMETRIC_STORAGE_IMPLEMENTATION.md`
- `VOICE_AUDIO_STORAGE.md`
- `ADMIN_MEDIA_ENHANCEMENTS.md`
- `REGISTRATION_ENHANCEMENTS.md` ✨

### Testing & Production
- `TESTING_GUIDE.md`
- `PRODUCTION_READINESS.md`
- `ADMIN_USER_DETAILS_TESTING_CHECKLIST.md`

### Fix Logs
- `AUTH_FIX_SUMMARY.md`
- `MOBILE_SIGNIN_FIX.md`
- `UPLOAD_SERVICE_FIX.md`
- `VOICE_VERIFICATION_USER_NOT_FOUND_FIX.md`
- `DOCUMENT_UPLOAD_FIX.md`
- `MEDIA_PREVIEW_FIX_COMPLETE.md`

---

## 🔐 Security Features

- JWT-based authentication
- Secure credential storage (Expo SecureStore)
- Biometric enrollment and verification
- Document OCR and validation
- Face liveness detection (anti-spoofing)
- Voice biometric matching
- HTTPS communication
- CORS configuration

---

## 🧪 Testing

- Unit tests (Jest)
- Integration tests
- E2E tests
- ML service tests (Python)
- Manual testing guides

---

## 🎯 Key Workflows

### 1. User Registration
```
Register → Voice Enrollment → Document Upload → Face Capture → Review
```

### 2. User Authentication
```
Login (Email/Phone/Password) → Dashboard
OR
Voice Login → Dashboard
```

### 3. Verification Flow
```
Submit Request → ML Processing → Admin Review → Approval/Rejection
```

### 4. Admin Management
```
View Users → Review Submissions → Approve/Reject → Send Notifications
```

---

## 📊 Project Stats

- **Total Services**: 5 (API, ML, Web, Mobile, Dashboard)
- **Languages**: TypeScript, JavaScript, Python
- **Frameworks**: React, React Native, Express, FastAPI
- **Deployment**: Railway (PaaS)
- **Documentation**: 40+ markdown files
- **Supported Platforms**: iOS, Android, Web
- **Supported Languages**: 5 (i18n)

---

## 🚦 Current Status

✅ **Completed**:
- User authentication system
- Biometric enrollment (voice, face, document)
- Admin dashboard with media preview
- Mobile app (iOS/Android)
- ML service integration
- Cloudinary media storage
- Multi-language support
- Enhanced registration with date/phone inputs ✨

🔄 **In Progress**:
- Production deployment optimization
- Additional ML model training
- Performance improvements

---

## 🛠️ Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   cd api && npm install
   cd apps/mobile && npm install
   cd apps/web && npm install
   ```

2. **Configure environment**:
   ```bash
   cp railway.env.template .env
   # Fill in your environment variables
   ```

3. **Start services**:
   ```bash
   # API
   cd api && npm run dev
   
   # Mobile
   cd apps/mobile && npm start
   
   # Web
   cd apps/web && npm run dev
   
   # ML Service
   cd ml-service && python -m uvicorn app.main:app --reload
   ```

---

## 📞 Support & Contact

For questions or issues:
- Check documentation in root directory
- Review troubleshooting guides
- Check TESTING_GUIDE.md for manual test procedures

---

## 🎉 Recent Enhancements (Nov 2024)

### Mobile Registration Improvements
- ✨ **DateInput Component**: Calendar picker with future date blocking
- ✨ **PhoneNumberInput Component**: Country picker with real-time validation
- ✨ **Enhanced Validation**: Improved form validation with clear error messages
- ✨ **Better UX**: Visual feedback, auto-formatting, accessibility improvements

See `apps/mobile/REGISTRATION_ENHANCEMENTS.md` for details.

---

## 📈 Future Roadmap

- [ ] Additional biometric modalities (fingerprint, iris)
- [ ] Real-time notification system
- [ ] Advanced analytics dashboard
- [ ] API rate limiting and throttling
- [ ] Kubernetes deployment
- [ ] Mobile app OTA updates
- [ ] Offline mode support
- [ ] Progressive Web App (PWA)

---

## 📄 License

(Check project root for LICENSE file)

---

**Last Updated**: November 2024
**Version**: 1.0.0
**Maintained by**: Development Team

