# INNKT React Client

A modern, feature-rich React application for the INNKT social networking platform, built with TypeScript and Tailwind CSS.

## 🚀 Features

### Core Features
- **Joint Accounts**: Create shared accounts with your partner, family, or friends
- **Person Selection**: Choose who's using the device after login
- **Advanced Security**: Built-in threat detection and monitoring
- **AI-Powered**: Image processing, QR codes, and intelligent features
- **Multi-Language**: Support for English, Hebrew, and Arabic with RTL support
- **Blockchain Integration**: Verified accounts and blockchain posts

### Technical Features
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Responsive Design** for all devices
- **Accessibility** focused

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Build Tool**: Create React App
- **Package Manager**: npm

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard components
│   ├── layout/         # Layout components (Header, Footer)
│   ├── pages/          # Page components
│   ├── profile/        # Profile management
│   └── security/       # Security features
├── config/             # Configuration files
├── services/           # API services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.tsx             # Main App component
├── index.tsx           # Entry point
└── index.css           # Global styles
```

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm 8+

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd innkt/Frontend/innkt.React
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_OFFICER_API_URL=http://localhost:5000
REACT_APP_NEUROSPARK_API_URL=http://localhost:5001
```

### Tailwind CSS

The project uses Tailwind CSS with custom INNKT colors:

- **Primary**: `#6E31A6` (Main header color)
- **Secondary**: `#8B5CF6`
- **Accent**: `#A855F7`
- **Dark**: `#4C1D95`
- **Light**: `#C4B5FD`

## 🌐 API Integration

### Microservices

The React client integrates with two main microservices:

1. **Officer Service** (`:5000`)
   - User authentication
   - Account management
   - Profile management

2. **NeuroSpark Service** (`:5001`)
   - AI image processing
   - QR code generation
   - Security monitoring
   - Threat detection

### API Services

- `BaseApiService` - Abstract base class for API calls
- `officerApi` - Instance for Officer service
- `neurosparkApi` - Instance for NeuroSpark service

## 🎨 UI Components

### Design System

- **Cards**: Consistent card layouts with shadows and borders
- **Buttons**: Primary and secondary button styles
- **Forms**: Styled form inputs with validation
- **Navigation**: Responsive header with mobile menu
- **Layout**: Flexible grid system for different screen sizes

### Component Library

- `Header` - Main navigation with INNKT branding
- `Footer` - Site footer with links and information
- `Dashboard` - Main dashboard with person selection
- `Login/Register` - Authentication forms
- `SecurityDashboard` - Security monitoring interface

## 🔐 Security Features

- **Authentication**: JWT-based authentication
- **Authorization**: Role-based access control
- **Input Validation**: Client-side and server-side validation
- **HTTPS**: Secure communication with APIs
- **Session Management**: Automatic token refresh and logout

## 📱 Responsive Design

The application is fully responsive and works on:

- **Desktop**: 1024px and above
- **Tablet**: 768px to 1023px
- **Mobile**: 320px to 767px

## 🌍 Internationalization

### Supported Languages
- **English** (en) - Default
- **Hebrew** (he) - With RTL support
- **Arabic** (ar) - With RTL support

### RTL Support
- Right-to-left text direction
- Mirrored layouts for RTL languages
- Cultural adaptations

## 🚀 Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

```bash
# Build Docker image
docker build -t innkt-react .

# Run container
docker run -p 80:80 innkt-react
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔮 Roadmap

### Phase 1: Core Setup & Authentication ✅
- [x] Project initialization
- [x] Basic routing
- [x] Header and footer
- [x] Authentication forms
- [x] Dashboard layout

### Phase 2: AI & Image Processing 🚧
- [ ] Image upload interface
- [ ] AI processing options
- [ ] Background removal (optional)
- [ ] Processing history

### Phase 3: Advanced Security Features 📋
- [ ] MFA management
- [ ] API key management
- [ ] Encryption tools
- [ ] Security monitoring

### Phase 4: Enhanced Monitoring 📋
- [ ] Service health dashboard
- [ ] Performance analytics
- [ ] System administration

### Phase 5: Social & Communication 📋
- [ ] Posts and feeds
- [ ] Messaging system
- [ ] Group management
- [ ] Notifications

---

**Built with ❤️ for families and communities**
