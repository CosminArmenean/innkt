# Innkt - Social Application Platform

## Project Structure

```
innkt/
├── Frontend/
│   ├── innkt.Angular/          # Desktop Angular application
│   ├── innkt.Mobile/           # React Native mobile app (iOS/Android)
│   └── innkt.Shared/           # Shared UI components and styles
├── Backend/
│   ├── Services/
│   │   ├── Officer.IdentityService/    # Identity & Authentication
│   │   ├── Frontier.AuthorizationService/ # Authorization & RBAC
│   │   ├── Content.ResourceService/    # User content & media
│   │   └── Notification.Service/       # Notifications & messaging
│   ├── Shared/
│   │   ├── Common/             # Shared utilities
│   │   ├── DataService/        # Data access layer
│   │   ├── Domain/             # Domain models
│   │   └── LanguageService/    # Multi-language support
│   └── Gateway/
│       └── Ocelot.Gateway/     # API Gateway
├── Infrastructure/
│   ├── Docker/                 # Docker configurations
│   ├── Database/               # Database scripts
│   └── Kafka/                  # Message broker setup
└── Mobile/
    ├── iOS/                    # iOS specific configurations
    └── Android/                # Android specific configurations
```

## Features

- **Multi-language Support**: Hebrew, English, and RTL layout support
- **Theme System**: Light/Dark themes with customization
- **Joint Accounts**: Dual-password authentication system
- **GDPR Compliance**: Granular consent management
- **Microservices Architecture**: Scalable backend services
- **Cross-platform**: Web, iOS, and Android clients

## Technology Stack

- **Frontend**: Angular 20, Angular Material, SCSS
- **Mobile**: React Native with TypeScript
- **Backend**: .NET 9, C#, Microservices
- **Databases**: MySQL (Identity), MongoDB (Content)
- **Messaging**: Apache Kafka
- **Gateway**: Ocelot
- **Identity**: Duende IdentityServer 7
