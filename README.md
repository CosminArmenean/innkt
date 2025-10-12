# Innkt - Social Application Platform

## Project Structure

```
innkt/
├── Frontend/
│   ├── innkt.react/            # React web application (Primary)
│   ├── innkt.Angular/          # Desktop Angular application
│   ├── innkt.Mobile/           # React Native mobile app (iOS/Android)
│   └── innkt.Shared/           # Shared UI components and styles
├── Backend/
│   ├── Services/
│   │   ├── innkt.Officer/      # Identity & Authentication
│   │   ├── innkt.Groups/       # Group Management & Collaboration
│   │   ├── innkt.Social/       # Social Feed & Content
│   │   ├── innkt.Messaging/    # Real-time Messaging
│   │   ├── innkt.Notifications/ # Notifications & Events
│   │   └── innkt.Seer/         # AI & Analytics
│   ├── Shared/
│   │   ├── innkt.Common/       # Shared utilities
│   │   ├── innkt.Domain/       # Domain models
│   │   └── innkt.KafkaCommunicationLibrary/ # Message broker
│   └── Gateway/
│       └── Ocelot.Gateway/     # API Gateway
├── Infrastructure/
│   ├── docker-compose.yml      # Docker configurations
│   ├── Database/               # Database scripts
│   └── Kafka/                  # Message broker setup
└── Mobile/
    ├── iOS/                    # iOS specific configurations
    └── Android/                # Android specific configurations
```

## Features

### 🎯 **Core Features**
- **Multi-language Support**: Hebrew, English, and RTL layout support
- **Theme System**: Light/Dark themes with customization
- **Joint Accounts**: Dual-password authentication system
- **GDPR Compliance**: Granular consent management
- **Microservices Architecture**: Scalable backend services
- **Cross-platform**: Web, iOS, and Android clients

### 👥 **Advanced Group Management System**
- **Educational Groups**: Specialized groups for schools and classrooms
- **Subgroup Hierarchy**: Nested organizational structure
- **Role-Based Access Control**: Custom roles with granular permissions
- **Parent-Kid Account Integration**: Shadow accounts for parental oversight
- **Topic-Based Discussions**: Organized conversation threads
- **File Sharing & Management**: Secure document and media sharing
- **Real-time Collaboration**: Live updates and notifications

### 🔐 **Enhanced Security & Permissions**
- **Microservice Authentication**: JWT-based auth across services
- **Permission Inheritance**: Hierarchical permission system
- **Content Moderation**: Role-based content management
- **Audit Logging**: Comprehensive activity tracking

## Technology Stack

- **Frontend**: React 18, TypeScript, TailwindCSS, React Router
- **Mobile**: React Native with TypeScript
- **Backend**: .NET 9, C#, Microservices Architecture
- **Databases**: PostgreSQL (Groups), MongoDB (Messaging), Redis (Caching)
- **Messaging**: Apache Kafka for inter-service communication
- **Real-time**: Socket.IO for WebSocket connections
- **File Storage**: Local file system with static file serving
- **Authentication**: JWT tokens with role-based access control

## 🏫 Group Management System

### Overview
The Group Management System is a comprehensive collaboration platform designed for educational institutions, organizations, and communities. It provides hierarchical organization, role-based permissions, and parent-kid account integration.

### Group Types
- **General Groups**: Standard community groups
- **Educational Groups**: Specialized for schools and classrooms
- **Family Groups**: For family communication and coordination

### Architecture

#### 📊 Database Schema
```
Groups
├── Basic Info (Name, Description, Type, Category)
├── Settings (Privacy, Permissions, Features)
├── Members (Users with roles and permissions)
├── Subgroups (Hierarchical organization)
├── Topics (Discussion threads)
├── Files (Documents and media)
└── Invitations (Member onboarding)
```

#### 🔐 Permission System
- **Owner**: Full administrative control
- **Admin**: Most administrative functions
- **Moderator**: Content and member management
- **Member**: Standard participation
- **Guest**: Limited access
- **Custom Roles**: Configurable with specific permissions

#### 👨‍👩‍👧‍👦 Parent-Kid Integration
- **Shadow Accounts**: Parent accounts linked to kid accounts
- **Permission Inheritance**: Parents can act on behalf of kids
- **Content Filtering**: Age-appropriate content controls
- **Activity Monitoring**: Parental oversight capabilities

### Key Features

#### 🎯 Group Creation & Management
- **Multi-step Creation**: Guided setup process
- **Template System**: Pre-configured group types
- **Custom Settings**: Flexible configuration options
- **Visual Branding**: Avatar and cover photo support

#### 📁 Subgroup Organization
- **Hierarchical Structure**: Nested organization levels
- **Role Assignment**: Subgroup-specific roles
- **Permission Inheritance**: Parent group permissions
- **Independent Settings**: Subgroup-specific configurations

#### 💬 Topic-Based Discussions
- **Threaded Conversations**: Organized discussion topics
- **Role-Based Posting**: Permission-controlled content creation
- **Content Moderation**: Automated and manual moderation
- **Global Audience**: Topics visible across subgroups

#### 📤 Invitation System
- **Multi-channel Invites**: Email, QR codes, direct links
- **Role-based Invitations**: Invite with specific roles
- **Expiration Management**: Time-limited invitations
- **Batch Operations**: Multiple user invitations

#### 📎 File Management
- **Secure Upload**: File type and size validation
- **Permission Controls**: Role-based access
- **Version History**: File change tracking
- **Download Analytics**: Usage monitoring

### API Endpoints

#### Group Management
```
GET    /api/groups                    # List groups
POST   /api/groups                    # Create group
GET    /api/groups/{id}               # Get group details
PUT    /api/groups/{id}               # Update group
DELETE /api/groups/{id}               # Delete group
```

#### Member Management
```
GET    /api/groups/{id}/members       # List members
POST   /api/groups/{id}/invite        # Invite user
PUT    /api/groups/{id}/members/{userId} # Update member role
DELETE /api/groups/{id}/members/{userId} # Remove member
```

#### File Operations
```
POST   /api/groups/{id}/upload-avatar # Upload group avatar
POST   /api/groups/{id}/upload-cover  # Upload cover photo
GET    /api/groups/{id}/files         # List files
POST   /api/groups/{id}/files         # Upload file
```

### Configuration

#### Environment Variables
```bash
# Groups Service
GROUPS_SERVICE_PORT=5002
GROUPS_DB_CONNECTION="Host=localhost;Database=innkt_groups;Username=admin_officer;Password=CAvp57rt26"
REDIS_CONNECTION="localhost:6379"
KAFKA_BOOTSTRAP_SERVERS="localhost:9092"

# File Upload
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_PATH=wwwroot/uploads/groups
```

#### Database Setup
```sql
-- Create groups database
CREATE DATABASE innkt_groups;

-- Run migrations
dotnet ef database update --project Backend/innkt.Groups
```

### Usage Examples

#### Creating an Educational Group
```typescript
const groupData = {
  name: "Class 5A - Mathematics",
  description: "Math class for 5th grade students",
  groupType: "educational",
  category: "classroom",
  institutionName: "Springfield Elementary",
  gradeLevel: "5th",
  isKidFriendly: true,
  allowParentParticipation: true,
  requireParentApproval: true
};

const group = await groupsService.createGroup(groupData);
```

#### Managing Subgroups
```typescript
const subgroupData = {
  name: "Advanced Math",
  description: "Advanced mathematics subgroup",
  parentSubgroupId: null,
  settings: {
    allowKidPosts: true,
    allowParentPosts: false,
    requireApproval: true
  }
};

const subgroup = await groupsService.createSubgroup(groupId, subgroupData);
```

#### Inviting Members
```typescript
const invitation = {
  invitedUserId: userId,
  message: "Welcome to our math class!",
  roleId: "teacher-role-id",
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
};

await groupsService.inviteUser(groupId, invitation);
```
