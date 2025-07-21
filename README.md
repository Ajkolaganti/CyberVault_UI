# CyberVault - Secure Access Management Platform

A modern, production-ready credential management and privileged access management (PAM) application built with React, TypeScript, and Express.js.

## 🌟 Features

### 🔐 Authentication & Authorization
- **JWT-based authentication** with secure token management
- **Role-based access control** (User, Manager, Admin)
- **Strong password validation** (8+ chars, uppercase, lowercase, number, symbol)
- **Persistent login sessions** with automatic token refresh

### 🗄️ Credential Management
- **Secure credential vault** with encrypted storage
- **CRUD operations** for credentials (Create, Read, Update, Delete)
- **Credential categorization** (Database, API, Server, Application)
- **Environment-specific credentials** (Production, Staging, Development)
- **Real-time credential status** monitoring

### ⚡ Just-In-Time (JIT) Access
- **Temporary access requests** with approval workflows
- **Time-limited credential access** with automatic expiration
- **Access request tracking** and audit trails
- **Emergency access procedures**

### 📊 Monitoring & Analytics
- **Real-time session monitoring** with live activity tracking
- **Comprehensive dashboard** with statistics and alerts
- **Access audit logs** with detailed activity history
- **Security alerts** and compliance reporting

## 🛠 Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Zustand for state management
- React Router for navigation
- React Hot Toast for notifications
- Lucide React for icons

### Backend
- Node.js with Express
- JWT for authentication
- bcryptjs for password hashing
- Helmet for security headers
- Express Rate Limiting
- CORS support

## 📋 Prerequisites

- Node.js (version 16 or higher)
- npm or yarn package manager

## 🔧 Installation & Setup

### 1. Clone the repository
\`\`\`bash
git clone <repository-url>
cd CybervaultByKT
\`\`\`

### 2. Install Frontend Dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Install Backend Dependencies
\`\`\`bash
cd backend
npm install
\`\`\`

### 4. Environment Configuration

#### Frontend (.env)
\`\`\`bash
cp .env.example .env
\`\`\`

Edit the \`.env\` file with your configuration:
\`\`\`bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:3001
VITE_JWT_SECRET=your_jwt_secret_key_here
\`\`\`

#### Backend (backend/.env)
\`\`\`bash
cd backend
cp .env.example .env
\`\`\`

Edit the \`backend/.env\` file:
\`\`\`bash
NODE_ENV=development
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
FRONTEND_URL=http://localhost:5173
\`\`\`

## 🚀 Running the Application

### 1. Start the Backend Server
\`\`\`bash
cd backend
npm run dev
\`\`\`

The backend API will be available at \`http://localhost:3001\`

### 2. Start the Frontend Development Server
\`\`\`bash
# In the root directory
npm run dev
\`\`\`

The frontend will be available at \`http://localhost:5173\`

## 🔐 Authentication Flow

The application supports dual authentication:

1. **Backend JWT Authentication**: Primary authentication using custom JWT tokens
2. **Supabase Authentication**: Optional secondary authentication for additional security

### Authentication Process:
1. User enters credentials on the auth page
2. Credentials are sent to the backend API
3. Backend validates credentials and returns a JWT token
4. Token is stored in localStorage and used for subsequent API calls
5. Protected routes verify the token before granting access

## 📡 API Endpoints

### Authentication
- \`POST /api/v1/auth/register\` - User registration
- \`POST /api/v1/auth/login\` - User login
- \`POST /api/v1/auth/logout\` - User logout
- \`GET /api/v1/auth/me\` - Get current user info
- \`POST /api/v1/auth/reset-password\` - Password reset

### Credentials
- \`POST /api/v1/credentials\` - Create new credential
- \`GET /api/v1/credentials\` - List user credentials

### Health Check
- \`GET /api/v1/health\` - API health status
- \`GET /api/v1\` - API documentation

## 🎨 UI Components

The application includes a comprehensive set of UI components:

- **AuthPage**: Unified login/signup page with modern design
- **Dashboard**: Main application dashboard
- **CredentialVault**: Secure credential management
- **SessionMonitoring**: Real-time session tracking
- **JITAccess**: Just-in-time access management

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **CORS Configuration**: Secure cross-origin requests
- **Helmet Security**: Security headers for Express
- **Input Validation**: Server-side validation for all inputs

## 🧪 Testing

### Test Credentials
For development testing, you can create a new account using the signup form, or use these test credentials if you set them up:

- Email: \`admin@cybervault.com\`
- Password: \`SecurePassword123!\`

## 📝 Development Notes

### Authentication Store
The \`useAuthStore\` (Zustand) manages:
- User authentication state
- JWT token storage
- Authentication methods (signIn, signUp, signOut)
- Automatic token validation

### Protected Routes
All dashboard routes are protected and redirect to \`/auth\` if the user is not authenticated.

### API Integration
The frontend uses the \`getAuthHeaders()\` helper function to automatically include JWT tokens in API requests.

## 🚀 Deployment

### Frontend Deployment
\`\`\`bash
npm run build
\`\`\`

Deploy the \`dist\` folder to your preferred hosting service (Vercel, Netlify, etc.)

### Backend Deployment
1. Set production environment variables
2. Use a process manager like PM2
3. Set up a reverse proxy (Nginx)
4. Enable HTTPS

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Known Issues

- In-memory user storage (replace with database in production)
- Password reset functionality is a placeholder
- Credential encryption needs implementation for production

## 🔮 Future Enhancements

- Database integration (PostgreSQL)
- Advanced role-based permissions
- Multi-factor authentication
- Audit logging
- Real-time notifications
- API rate limiting per user
- Credential auto-rotation
- Integration with external identity providers
