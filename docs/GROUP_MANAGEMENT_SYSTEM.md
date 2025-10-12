# Group Management System - Technical Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Permission System](#permission-system)
5. [Parent-Kid Integration](#parent-kid-integration)
6. [API Documentation](#api-documentation)
7. [File Management](#file-management)
8. [Invitation System](#invitation-system)
9. [Topic Management](#topic-management)
10. [Frontend Components](#frontend-components)
11. [Configuration](#configuration)
12. [Troubleshooting](#troubleshooting)

## Overview

The Group Management System is a comprehensive collaboration platform designed for educational institutions, organizations, and communities. It provides hierarchical organization, role-based permissions, and parent-kid account integration.

### Key Features
- **Educational Groups**: Specialized for schools and classrooms
- **Hierarchical Subgroups**: Multi-level organizational structure
- **Role-Based Access Control**: Custom roles with granular permissions
- **Parent-Kid Integration**: Shadow accounts for parental oversight
- **Topic-Based Discussions**: Organized conversation threads
- **File Sharing**: Secure document and media sharing
- **Real-time Collaboration**: Live updates and notifications

## Architecture

### Microservice Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │  Groups Service │    │ Officer Service │
│                 │◄──►│   (Port 5002)   │◄──►│   (Port 5001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Messaging      │    │   PostgreSQL    │    │   PostgreSQL    │
│  Service        │    │   (Groups DB)   │    │  (Identity DB)  │
│  (Port 5000)    │    └─────────────────┘    └─────────────────┘
└─────────────────┘
         │
         ▼
┌─────────────────┐
│    MongoDB      │
│ (Messaging DB)  │
└─────────────────┘
```

### Service Communication
- **HTTP APIs**: RESTful APIs for CRUD operations
- **Kafka Events**: Asynchronous event-driven communication
- **WebSocket**: Real-time updates for live collaboration
- **File Serving**: Static file serving for uploaded assets

## Database Schema

### Core Tables

#### Groups Table
```sql
CREATE TABLE "Groups" (
    "Id" uuid PRIMARY KEY,
    "Name" varchar(100) NOT NULL,
    "Description" varchar(1000),
    "AvatarUrl" varchar(500),
    "CoverImageUrl" varchar(500),
    "OwnerId" uuid NOT NULL,
    "IsPublic" boolean DEFAULT true,
    "IsVerified" boolean DEFAULT false,
    "MembersCount" integer DEFAULT 0,
    "PostsCount" integer DEFAULT 0,
    "GroupType" varchar(20) NOT NULL DEFAULT 'general',
    "Category" varchar(50),
    "InstitutionName" varchar(100),
    "GradeLevel" varchar(20),
    "IsKidFriendly" boolean DEFAULT false,
    "AllowParentParticipation" boolean DEFAULT true,
    "RequireParentApproval" boolean DEFAULT false,
    "Tags" text[] DEFAULT '{}',
    "CreatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

#### GroupMembers Table
```sql
CREATE TABLE "GroupMembers" (
    "Id" uuid PRIMARY KEY,
    "GroupId" uuid NOT NULL REFERENCES "Groups"("Id"),
    "UserId" uuid NOT NULL,
    "KidId" uuid,
    "ParentId" uuid,
    "Role" varchar(20) NOT NULL DEFAULT 'member',
    "AssignedRoleId" uuid REFERENCES "GroupRoles"("Id"),
    "IsParentActingForKid" boolean DEFAULT false,
    "CanPost" boolean DEFAULT true,
    "CanVote" boolean DEFAULT true,
    "CanComment" boolean DEFAULT true,
    "CanInvite" boolean DEFAULT false,
    "JoinedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "LastSeenAt" timestamp with time zone,
    "IsActive" boolean DEFAULT true,
    "SubgroupId" uuid,
    "RoleId" uuid,
    "IsParentAccount" boolean DEFAULT false,
    "KidAccountId" uuid,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

#### Subgroups Table
```sql
CREATE TABLE "Subgroups" (
    "Id" uuid PRIMARY KEY,
    "GroupId" uuid NOT NULL REFERENCES "Groups"("Id"),
    "Name" varchar(100) NOT NULL,
    "Description" varchar(500),
    "ParentSubgroupId" uuid REFERENCES "Subgroups"("Id"),
    "Level" integer DEFAULT 1,
    "MembersCount" integer DEFAULT 0,
    "IsActive" boolean DEFAULT true,
    "Settings" text DEFAULT '{}',
    "CreatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

#### GroupRoles Table
```sql
CREATE TABLE "GroupRoles" (
    "Id" uuid PRIMARY KEY,
    "GroupId" uuid NOT NULL REFERENCES "Groups"("Id"),
    "Name" varchar(50) NOT NULL,
    "Alias" varchar(100),
    "Description" varchar(500),
    "ShowRealUsername" boolean DEFAULT false,
    "CanCreateTopics" boolean DEFAULT false,
    "CanManageMembers" boolean DEFAULT false,
    "CanManageRoles" boolean DEFAULT false,
    "CanManageSubgroups" boolean DEFAULT false,
    "CanModerateContent" boolean DEFAULT false,
    "CanAccessAllSubgroups" boolean DEFAULT false,
    "CanUseGrokAI" boolean DEFAULT true,
    "CanUsePerpetualPhotos" boolean DEFAULT false,
    "CanUsePaperScanning" boolean DEFAULT false,
    "CanManageFunds" boolean DEFAULT false,
    "CanPostText" boolean DEFAULT true,
    "CanPostImages" boolean DEFAULT true,
    "CanPostPolls" boolean DEFAULT false,
    "CanPostVideos" boolean DEFAULT false,
    "CanPostAnnouncements" boolean DEFAULT false,
    "Permissions" text DEFAULT '{}',
    "CanSeeRealUsername" boolean DEFAULT false,
    "CreatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
```

#### Topics Table
```sql
CREATE TABLE "Topics" (
    "Id" uuid PRIMARY KEY,
    "GroupId" uuid NOT NULL REFERENCES "Groups"("Id"),
    "SubgroupId" uuid REFERENCES "Subgroups"("Id"),
    "Name" varchar(100) NOT NULL,
    "Description" varchar(1000),
    "Status" varchar(20) DEFAULT 'active',
    "IsAnnouncementOnly" boolean DEFAULT false,
    "AllowMemberPosts" boolean DEFAULT true,
    "AllowKidPosts" boolean DEFAULT false,
    "AllowParentPosts" boolean DEFAULT true,
    "AllowRolePosts" boolean DEFAULT true,
    "IsGlobalAudience" boolean DEFAULT false,
    "AllowComments" boolean DEFAULT true,
    "AllowReactions" boolean DEFAULT true,
    "AllowPolls" boolean DEFAULT true,
    "AllowMedia" boolean DEFAULT true,
    "RequireApproval" boolean DEFAULT false,
    "IsPinned" boolean DEFAULT false,
    "IsLocked" boolean DEFAULT false,
    "AllowAnonymous" boolean DEFAULT false,
    "AutoArchive" boolean DEFAULT false,
    "AllowScheduling" boolean DEFAULT false,
    "TimeRestricted" boolean DEFAULT false,
    "MuteNotifications" boolean DEFAULT false,
    "DocumentationMode" boolean DEFAULT false,
    "PostsCount" integer DEFAULT 0,
    "CreatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    "PausedAt" timestamp with time zone,
    "ArchivedAt" timestamp with time zone
);
```

### Relationships
- **Groups** → **GroupMembers** (One-to-Many)
- **Groups** → **Subgroups** (One-to-Many)
- **Groups** → **GroupRoles** (One-to-Many)
- **Groups** → **Topics** (One-to-Many)
- **Subgroups** → **Subgroups** (Self-referencing for hierarchy)
- **GroupMembers** → **GroupRoles** (Many-to-One via AssignedRoleId)

## Permission System

### Default Roles

#### Owner
- Full administrative control
- Can modify all group settings
- Can manage all members and roles
- Can delete the group
- Cannot be removed by other members

#### Admin
- Most administrative functions
- Can manage members and roles
- Can create and manage subgroups
- Can moderate content
- Cannot delete the group or remove owners

#### Moderator
- Content and member management
- Can moderate posts and comments
- Can manage member roles (limited)
- Can create topics
- Cannot manage group settings

#### Member
- Standard participation
- Can post and comment (based on topic settings)
- Can view group content
- Can invite other members (if enabled)

#### Guest
- Limited access
- Can view public content only
- Cannot post or comment
- Cannot invite members

### Custom Roles
Custom roles can be created with specific permission combinations:
- **Permission Granularity**: Each permission can be enabled/disabled independently
- **Role Aliases**: Display names different from internal role names
- **Username Visibility**: Control whether real usernames are shown
- **Posting Permissions**: Control what types of content can be posted
- **Management Permissions**: Control administrative capabilities

### Permission Inheritance
- **Group Level**: Permissions defined at the group level
- **Subgroup Level**: Permissions can be overridden at subgroup level
- **Topic Level**: Additional restrictions can be applied per topic
- **Member Level**: Individual member permissions can be customized

## Parent-Kid Integration

### Shadow Accounts
Parent accounts can be linked to kid accounts to provide oversight and management capabilities.

#### Features
- **Account Linking**: Parent and kid accounts are linked in the database
- **Permission Inheritance**: Parents can act on behalf of kids
- **Content Filtering**: Age-appropriate content controls
- **Activity Monitoring**: Parents can monitor kid account activity

#### Implementation
```typescript
interface GroupMember {
  id: string;
  userId: string;
  role: string;
  isParentAccount: boolean;
  parentId?: string;
  kidId?: string;
  kidAccountId?: string;
  isParentActingForKid: boolean;
}
```

### Parent Permissions
- **Voting on Behalf**: Parents can vote in polls for their kids
- **Posting on Behalf**: Parents can create posts for their kids
- **Content Management**: Parents can manage content created by their kids
- **Activity Monitoring**: Parents can view their kids' activity

### Kid Permissions
- **Independent Actions**: Kids can act independently when allowed
- **Content Creation**: Kids can create content based on group settings
- **Participation**: Kids can participate in discussions and polls
- **Privacy Controls**: Kid accounts have additional privacy protections

## API Documentation

### Base URL
```
http://localhost:5002/api
```

### Authentication
All API endpoints require JWT authentication:
```
Authorization: Bearer <jwt_token>
```

### Group Management Endpoints

#### List Groups
```http
GET /groups
Query Parameters:
  - page: number (default: 1)
  - pageSize: number (default: 20)
  - type: string (optional)
  - category: string (optional)
  - search: string (optional)
```

#### Create Group
```http
POST /groups
Content-Type: application/json

{
  "name": "Class 5A - Mathematics",
  "description": "Math class for 5th grade students",
  "groupType": "educational",
  "category": "classroom",
  "institutionName": "Springfield Elementary",
  "gradeLevel": "5th",
  "isKidFriendly": true,
  "allowParentParticipation": true,
  "requireParentApproval": true,
  "tags": ["education", "mathematics", "5th-grade"]
}
```

#### Get Group Details
```http
GET /groups/{groupId}
```

#### Update Group
```http
PUT /groups/{groupId}
Content-Type: application/json

{
  "name": "Updated Group Name",
  "description": "Updated description",
  "isPublic": true
}
```

#### Delete Group
```http
DELETE /groups/{groupId}
```

### Member Management Endpoints

#### List Members
```http
GET /groups/{groupId}/members
Query Parameters:
  - page: number (default: 1)
  - pageSize: number (default: 20)
  - role: string (optional)
```

#### Invite User
```http
POST /groups/{groupId}/invite
Content-Type: application/json

{
  "invitedUserId": "user-uuid",
  "message": "Welcome to our group!",
  "roleId": "role-uuid",
  "expiresAt": "2025-10-19T15:30:00Z"
}
```

#### Update Member Role
```http
PUT /groups/{groupId}/members/{userId}
Content-Type: application/json

{
  "role": "admin",
  "assignedRoleId": "role-uuid"
}
```

#### Remove Member
```http
DELETE /groups/{groupId}/members/{userId}
```

### File Management Endpoints

#### Upload Group Avatar
```http
POST /groups/{groupId}/upload-avatar
Content-Type: multipart/form-data

Form Data:
  - file: image file (JPEG, PNG, GIF, WebP, max 5MB)
```

#### Upload Cover Photo
```http
POST /groups/{groupId}/upload-cover
Content-Type: multipart/form-data

Form Data:
  - file: image file (JPEG, PNG, GIF, WebP, max 10MB)
```

#### List Files
```http
GET /groups/{groupId}/files
Query Parameters:
  - page: number (default: 1)
  - pageSize: number (default: 20)
  - category: string (optional)
```

#### Upload File
```http
POST /groups/{groupId}/files
Content-Type: multipart/form-data

Form Data:
  - file: document or media file
  - description: string (optional)
  - category: string (optional)
```

### Subgroup Management Endpoints

#### List Subgroups
```http
GET /groups/{groupId}/subgroups
```

#### Create Subgroup
```http
POST /groups/{groupId}/subgroups
Content-Type: application/json

{
  "name": "Advanced Math",
  "description": "Advanced mathematics subgroup",
  "parentSubgroupId": "parent-uuid",
  "settings": {
    "allowKidPosts": true,
    "allowParentPosts": false,
    "requireApproval": true
  }
}
```

#### Update Subgroup
```http
PUT /groups/{groupId}/subgroups/{subgroupId}
Content-Type: application/json

{
  "name": "Updated Subgroup Name",
  "description": "Updated description",
  "settings": {
    "allowKidPosts": false
  }
}
```

#### Delete Subgroup
```http
DELETE /groups/{groupId}/subgroups/{subgroupId}
```

### Topic Management Endpoints

#### List Topics
```http
GET /groups/{groupId}/topics
Query Parameters:
  - subgroupId: string (optional)
  - status: string (optional)
```

#### Create Topic
```http
POST /groups/{groupId}/topics
Content-Type: application/json

{
  "name": "Homework Discussion",
  "description": "Discuss homework assignments",
  "subgroupId": "subgroup-uuid",
  "allowMemberPosts": true,
  "allowKidPosts": true,
  "allowParentPosts": false,
  "isGlobalAudience": false
}
```

#### Update Topic
```http
PUT /groups/{groupId}/topics/{topicId}
Content-Type: application/json

{
  "name": "Updated Topic Name",
  "allowMemberPosts": false
}
```

#### Delete Topic
```http
DELETE /groups/{groupId}/topics/{topicId}
```

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation completed successfully"
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "name",
      "message": "Name is required"
    }
  }
}
```

## File Management

### File Upload Process
1. **Validation**: File type, size, and content validation
2. **Storage**: Files stored in organized directory structure
3. **Database Record**: File metadata stored in database
4. **Permission Check**: Access permissions applied
5. **URL Generation**: Accessible URLs generated

### File Types Supported
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX, TXT
- **Media**: MP4, MP3, WAV
- **Archives**: ZIP, RAR

### File Storage Structure
```
wwwroot/uploads/groups/
├── {groupId}/
│   ├── avatar_*.jpg
│   ├── cover_*.jpg
│   ├── files/
│   │   ├── documents/
│   │   ├── images/
│   │   └── media/
│   └── topics/
│       └── {topicId}/
```

### File Permissions
- **Upload**: Based on user role and group settings
- **View**: Based on file permissions and user role
- **Download**: Based on file permissions and user role
- **Delete**: Based on file ownership and user role

## Invitation System

### Invitation Types
- **Direct Invitation**: Invite specific users by ID
- **Email Invitation**: Send invitation via email
- **QR Code**: Generate QR code for easy joining
- **Public Link**: Generate shareable invitation link

### Invitation Flow
1. **Create Invitation**: Admin creates invitation with specific role
2. **Send Notification**: User receives invitation notification
3. **Accept/Decline**: User can accept or decline invitation
4. **Auto-expiry**: Invitations expire after specified time
5. **Role Assignment**: User gets assigned role upon acceptance

### Invitation Management
- **Track Status**: Monitor invitation status (pending, accepted, declined, expired)
- **Resend Invitations**: Resend expired or declined invitations
- **Bulk Operations**: Send multiple invitations at once
- **Template Messages**: Use predefined invitation messages

## Topic Management

### Topic Types
- **Discussion Topics**: Open discussion threads
- **Announcement Topics**: Admin-only posting
- **Homework Topics**: Assignment and homework discussions
- **Q&A Topics**: Question and answer format
- **Documentation Topics**: Knowledge base and documentation

### Topic Settings
- **Posting Permissions**: Control who can post
- **Comment Permissions**: Control commenting access
- **Media Permissions**: Control media sharing
- **Poll Permissions**: Control poll creation
- **Anonymous Posting**: Allow anonymous posts
- **Approval Required**: Require post approval
- **Time Restrictions**: Limit posting to specific times

### Topic Features
- **Pinning**: Pin important topics to top
- **Locking**: Lock topics to prevent new posts
- **Archiving**: Archive old topics
- **Scheduling**: Schedule topic visibility
- **Notifications**: Control notification settings

## Frontend Components

### Core Components

#### GroupDetailPage
Main group management interface with:
- Group information display
- Member management
- Subgroup navigation
- Topic management
- File sharing
- Settings panel

#### GroupManagementPanel
Administrative panel with:
- Member role management
- Invitation management
- Subgroup creation
- Settings configuration
- Analytics dashboard

#### EnhancedInviteUserModal
Advanced invitation system with:
- User search and selection
- Role assignment
- Custom messages
- Expiration settings
- Batch invitations

#### TopicManagementPanel
Discussion management with:
- Topic creation and editing
- Permission settings
- Content moderation
- User management per topic

### Component Architecture
```
GroupDetailPage
├── GroupManagementPanel
│   ├── MemberManagement
│   ├── InvitationManagement
│   ├── SubgroupManagement
│   └── SettingsManagement
├── TopicManagementPanel
│   ├── TopicList
│   ├── TopicCreation
│   └── TopicSettings
├── FileManagement
│   ├── FileUpload
│   ├── FileList
│   └── FilePermissions
└── EnhancedInviteUserModal
    ├── UserSearch
    ├── RoleSelection
    └── MessageComposer
```

### State Management
- **React Context**: Global state management
- **Local State**: Component-specific state
- **API Integration**: Service layer for data fetching
- **Real-time Updates**: WebSocket integration for live updates

## Configuration

### Environment Variables

#### Groups Service
```bash
# Service Configuration
GROUPS_SERVICE_PORT=5002
GROUPS_SERVICE_URL=http://localhost:5002

# Database Configuration
GROUPS_DB_CONNECTION="Host=localhost;Port=5433;Database=innkt_groups;Username=admin_officer;Password=CAvp57rt26"

# Redis Configuration
REDIS_CONNECTION="localhost:6379"
REDIS_INSTANCE_NAME="InNKT:Groups:"

# Kafka Configuration
KAFKA_BOOTSTRAP_SERVERS="localhost:9092"
KAFKA_CLIENT_ID="groups-service"

# File Upload Configuration
MAX_FILE_SIZE=10485760  # 10MB
MAX_AVATAR_SIZE=5242880  # 5MB
MAX_COVER_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
UPLOAD_PATH=wwwroot/uploads/groups

# Security Configuration
JWT_SECRET_KEY="innkt.officer.jwt.secret.key.2025.very.long.and.secure.key"
JWT_ISSUER="http://localhost:5001"
JWT_AUDIENCE="innkt.officer.api"
```

#### Frontend Configuration
```bash
# API Configuration
REACT_APP_GROUPS_API_URL=http://localhost:5002
REACT_APP_OFFICER_API_URL=http://localhost:5001
REACT_APP_MESSAGING_API_URL=http://localhost:5000

# WebSocket Configuration
REACT_APP_WEBSOCKET_URL=ws://localhost:5000

# File Upload Configuration
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,image/webp
```

### Database Configuration

#### PostgreSQL Setup
```sql
-- Create database
CREATE DATABASE innkt_groups;

-- Create user
CREATE USER admin_officer WITH PASSWORD 'CAvp57rt26';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE innkt_groups TO admin_officer;
```

#### Redis Setup
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
sudo systemctl start redis-server

# Enable Redis on startup
sudo systemctl enable redis-server
```

### Docker Configuration

#### docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: innkt-postgres
    environment:
      POSTGRES_DB: innkt_officer
      POSTGRES_USER: admin_officer
      POSTGRES_PASSWORD: "CAvp57rt26"
      POSTGRES_MULTIPLE_DATABASES: innkt_social,innkt_groups,innkt_follow
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - innkt-network

  redis:
    image: redis:7-alpine
    container_name: innkt-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - innkt-network

volumes:
  postgres_data:
  redis_data:

networks:
  innkt-network:
    driver: bridge
```

## Troubleshooting

### Common Issues

#### File Upload Issues
**Problem**: Files not uploading or displaying
**Solutions**:
1. Check file size limits
2. Verify file type permissions
3. Check static file serving configuration
4. Verify file path permissions

#### Permission Issues
**Problem**: Users cannot access certain features
**Solutions**:
1. Check user role assignments
2. Verify group permissions
3. Check subgroup permission inheritance
4. Verify API authentication

#### Database Connection Issues
**Problem**: Database connection failures
**Solutions**:
1. Check database server status
2. Verify connection string
3. Check network connectivity
4. Verify user permissions

#### Real-time Update Issues
**Problem**: Live updates not working
**Solutions**:
1. Check WebSocket connection
2. Verify Kafka configuration
3. Check event publishing
4. Verify frontend event handling

### Debugging Tools

#### Backend Debugging
```bash
# Enable detailed logging
export Logging__LogLevel__Default=Debug

# Check service status
dotnet run --project Backend/innkt.Groups

# Database debugging
psql -h localhost -U admin_officer -d innkt_groups
```

#### Frontend Debugging
```bash
# Enable React development tools
npm start

# Check network requests
# Open browser dev tools -> Network tab

# Check console errors
# Open browser dev tools -> Console tab
```

### Performance Monitoring

#### Database Performance
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Application Performance
```bash
# Monitor memory usage
dotnet-counters monitor --process-id <pid>

# Profile application
dotnet-trace collect --process-id <pid>
```

### Logging Configuration

#### Backend Logging
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore": "Warning"
    }
  },
  "Serilog": {
    "MinimumLevel": "Information",
    "WriteTo": [
      {
        "Name": "Console",
        "Args": {
          "outputTemplate": "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}"
        }
      },
      {
        "Name": "File",
        "Args": {
          "path": "logs/groups-service-.log",
          "rollingInterval": "Day",
          "retainedFileCountLimit": 7
        }
      }
    ]
  }
}
```

#### Frontend Logging
```typescript
// Enable debug logging
localStorage.setItem('debug', 'innkt:*');

// Console logging
console.log('Group data:', groupData);
console.error('API Error:', error);
```

---

## Support

For technical support or questions about the Group Management System:

1. **Documentation**: Check this documentation first
2. **Issues**: Create an issue in the repository
3. **Discussions**: Use GitHub Discussions for questions
4. **Email**: Contact the development team

---

*Last updated: October 12, 2025*
