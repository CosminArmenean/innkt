# Innkt Project Setup Guide

## Overview
This guide will help you set up the complete Innkt social application project, including the Angular frontend, .NET microservices backend, and React Native mobile applications.

## Prerequisites

### Required Software
- **Node.js** 20.x or later
- **npm** 10.x or later
- **.NET 9 SDK**
- **Docker Desktop** with Docker Compose
- **Visual Studio 2022** or **Visual Studio Code**
- **Android Studio** (for mobile development)
- **Xcode** (for iOS development, macOS only)
- **Git**

### System Requirements
- **Windows 10/11** or **macOS 12+** or **Ubuntu 20.04+**
- **8GB RAM** minimum (16GB recommended)
- **10GB** free disk space
- **Docker** with at least 4GB memory allocation

## Project Structure
```
innkt/
├── Frontend/
│   ├── innkt.Angular/          # Desktop Angular application
│   ├── innkt.Mobile/           # React Native mobile app
│   └── innkt.Shared/           # Shared UI components
├── Backend/
│   ├── Services/               # Microservices
│   ├── Shared/                 # Shared libraries
│   └── Gateway/                # API Gateway
├── Infrastructure/             # Docker and deployment
├── Mobile/                     # Mobile-specific configs
└── docs/                       # Documentation
```

## Setup Instructions

### 1. Clone and Setup Project

```bash
# Clone the repository
git clone <repository-url>
cd innkt

# Create necessary directories
mkdir -p Frontend/innkt.Shared
mkdir -p Infrastructure/Database/init
mkdir -p Infrastructure/Database/mongo-init
mkdir -p docs
```

### 2. Frontend Setup (Angular)

```bash
cd Frontend/innkt.Angular

# Install dependencies
npm install

# Build the application
npm run build

# Start development server
npm start
```

**Features Implemented:**
- ✅ Multi-language support (English, Hebrew, Arabic)
- ✅ RTL layout support for Hebrew/Arabic
- ✅ Light/Dark theme system
- ✅ Responsive design
- ✅ Angular Material components
- ✅ Internationalization (i18n)
- ✅ Server-side rendering (SSR)

**Access the application:**
- Development: http://localhost:4200
- Production: http://localhost:4200 (Docker)

### 3. Backend Setup (.NET Microservices)

#### 3.1 Build Solution
```bash
cd Backend
dotnet restore
dotnet build
```

#### 3.2 Individual Service Setup

**Identity Service (Officer.IdentityService)**
```bash
cd Services/Officer.IdentityService
dotnet run
# Runs on http://localhost:5001
```

**Authorization Service (Frontier.AuthorizationService)**
```bash
cd Services/Frontier.AuthorizationService
dotnet run
# Runs on http://localhost:5002
```

**Content Service (Content.ResourceService)**
```bash
cd Services/Content.ResourceService
dotnet run
# Runs on http://localhost:5003
```

**Notification Service (Notification.Service)**
```bash
cd Services/Notification.Service
dotnet run
# Runs on http://localhost:5004
```

**API Gateway (Ocelot.Gateway)**
```bash
cd Gateway/Ocelot.Gateway
dotnet run
# Runs on http://localhost:5000
```

### 4. Database Setup

#### 4.1 MySQL (Identity Data)
```bash
# Using Docker
docker run --name innkt-mysql \
  -e MYSQL_ROOT_PASSWORD=root_password \
  -e MYSQL_DATABASE=innkt_identity \
  -e MYSQL_USER=innkt_user \
  -e MYSQL_PASSWORD=innkt_password \
  -p 3306:3306 \
  -d mysql:8.0
```

#### 4.2 MongoDB (Content Data)
```bash
# Using Docker
docker run --name innkt-mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=innkt_admin \
  -e MONGO_INITDB_ROOT_PASSWORD=innkt_password \
  -e MONGO_INITDB_DATABASE=innkt_content \
  -p 27017:27017 \
  -d mongo:6.0
```

#### 4.3 Redis (Caching)
```bash
# Using Docker
docker run --name innkt-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

#### 4.4 Apache Kafka (Messaging)
```bash
# Using Docker Compose
cd Infrastructure
docker-compose up -d innkt-zookeeper innkt-kafka
```

### 5. Docker Setup

#### 5.1 Build and Run All Services
```bash
# From project root
docker-compose up --build

# Or run specific services
docker-compose up innkt-frontend innkt-gateway
```

#### 5.2 Access Points
- **Frontend**: http://localhost:4200
- **API Gateway**: http://localhost:5000
- **Identity Service**: http://localhost:5001
- **Authorization Service**: http://localhost:5002
- **Content Service**: http://localhost:5003
- **Notification Service**: http://localhost:5004
- **MySQL Admin**: http://localhost:8080
- **MongoDB Admin**: http://localhost:8081

### 6. Mobile App Setup

#### 6.1 React Native Setup
```bash
cd Mobile/innkt.Mobile

# Install dependencies
npm install

# iOS (macOS only)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

#### 6.2 Mobile Features
- ✅ Cross-platform (iOS/Android)
- ✅ Biometric authentication
- ✅ Push notifications
- ✅ Offline support
- ✅ Multi-language support
- ✅ Theme switching
- ✅ Camera integration
- ✅ File handling

### 7. Environment Configuration

#### 7.1 Create Environment Files
```bash
# Frontend
cp Frontend/innkt.Angular/src/environments/environment.example.ts \
   Frontend/innkt.Angular/src/environments/environment.ts

# Backend
cp Backend/Services/*/appsettings.example.json \
   Backend/Services/*/appsettings.Development.json
```

#### 7.2 Configure Connection Strings
Update the connection strings in each service's `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=innkt_identity;Uid=innkt_user;Pwd=innkt_password;",
    "MongoDB": "mongodb://innkt_admin:innkt_password@localhost:27017/innkt_content",
    "Redis": "localhost:6379"
  },
  "Kafka": {
    "BootstrapServers": "localhost:9092"
  }
}
```

### 8. Testing

#### 8.1 Frontend Tests
```bash
cd Frontend/innkt.Angular
npm test
npm run e2e
```

#### 8.2 Backend Tests
```bash
cd Backend
dotnet test
```

#### 8.3 Mobile Tests
```bash
cd Mobile/innkt.Mobile
npm test
```

### 9. Development Workflow

#### 9.1 Frontend Development
```bash
cd Frontend/innkt.Angular
npm start          # Start dev server
npm run build      # Build for production
npm run serve-ssr  # Start SSR server
```

#### 9.2 Backend Development
```bash
cd Backend
dotnet watch run  # Hot reload for development
```

#### 9.3 Mobile Development
```bash
cd Mobile/innkt.Mobile
npm start         # Start Metro bundler
npm run ios       # Run on iOS simulator
npm run android   # Run on Android emulator
```

### 10. Deployment

#### 10.1 Production Build
```bash
# Frontend
cd Frontend/innkt.Angular
npm run build:prod

# Backend
cd Backend
dotnet publish -c Release

# Mobile
cd Mobile/innkt.Mobile
npm run build:android
npm run build:ios
```

#### 10.2 Docker Production
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
If ports are already in use, update the port mappings in `docker-compose.yml` or stop conflicting services.

#### 2. Database Connection Issues
- Verify Docker containers are running
- Check connection strings
- Ensure database credentials are correct

#### 3. Angular Build Issues
- Clear node_modules: `rm -rf node_modules && npm install`
- Update Angular CLI: `npm install -g @angular/cli@latest`

#### 4. .NET Build Issues
- Restore packages: `dotnet restore`
- Clean solution: `dotnet clean`
- Update .NET SDK

#### 5. Mobile Build Issues
- Clear Metro cache: `npx react-native start --reset-cache`
- Clean Android build: `cd android && ./gradlew clean`
- Clean iOS build: `cd ios && xcodebuild clean`

### Performance Optimization

#### Frontend
- Enable production mode
- Use Angular Universal for SSR
- Implement lazy loading
- Optimize bundle size

#### Backend
- Enable response caching
- Use async/await patterns
- Implement connection pooling
- Monitor performance metrics

#### Mobile
- Enable Hermes engine
- Use Fast Image for images
- Implement lazy loading
- Optimize bundle size

## Security Considerations

### Frontend
- HTTPS in production
- Content Security Policy
- XSS protection
- CSRF tokens

### Backend
- JWT token validation
- Input validation
- SQL injection prevention
- Rate limiting

### Mobile
- Certificate pinning
- Secure storage
- Biometric authentication
- App signing

## Monitoring and Logging

### Application Insights
- Performance monitoring
- Error tracking
- User analytics
- Custom metrics

### Logging
- Structured logging with Serilog
- Log aggregation
- Error reporting
- Audit trails

## Support and Documentation

### Additional Resources
- [Angular Documentation](https://angular.dev/)
- [.NET Documentation](https://docs.microsoft.com/dotnet/)
- [React Native Documentation](https://reactnative.dev/)
- [Docker Documentation](https://docs.docker.com/)

### Getting Help
- Check the troubleshooting section
- Review logs and error messages
- Consult the documentation
- Create an issue in the repository

## Next Steps

After completing the setup:

1. **Explore the codebase** to understand the architecture
2. **Run the tests** to ensure everything works correctly
3. **Customize the configuration** for your environment
4. **Add your business logic** to the services
5. **Deploy to your preferred hosting platform**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

---

**Happy coding with Innkt! 🚀**
