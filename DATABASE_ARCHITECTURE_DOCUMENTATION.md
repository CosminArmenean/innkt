# 🗄️ DATABASE ARCHITECTURE DOCUMENTATION

## 📋 **OVERVIEW**

The INNKT platform uses a **microservices architecture** with **multiple PostgreSQL databases**. Each service has its own dedicated database for data isolation and scalability.

---

## 🎯 **DATABASE INSTANCES**

### **PostgreSQL Container: `innkt-postgres`**
- **User**: `admin_officer`
- **Password**: `CAvp57rt26`
- **Port**: `5432`
- **Host**: `localhost` (via Docker)

---

## 📊 **DATABASES**

### **1. innkt_officer** (Identity & Authentication)
**Purpose**: User authentication, identity management, JWT tokens, kid accounts, joint accounts

**Schema Type**: **DUAL SCHEMA** ⚠️
- **ASP.NET Identity Schema** (created by EF Core Migrations)
- **Custom SQL Schema** (created by init.sql scripts)

#### **ASP.NET Identity Tables** (Primary - Used by Application)
Created by Entity Framework Core migrations. These are the ACTUAL tables used by the Officer service.

| Table Name | Purpose | Key Columns |
|------------|---------|-------------|
| `AspNetUsers` | User accounts and authentication | `Id` (string/guid), `UserName`, `Email`, `PasswordHash`, `FirstName`, `LastName`, `IsIdentityVerified`, `IsEmailVerified`, `IsKidAccount`, `ParentUserId`, `IsJointAccount` |
| `AspNetRoles` | User roles (Admin, User, etc.) | `Id`, `Name`, `NormalizedName` |
| `AspNetUserRoles` | User-to-role mappings | `UserId`, `RoleId` |
| `AspNetUserClaims` | Additional user claims | `UserId`, `ClaimType`, `ClaimValue` |
| `AspNetUserLogins` | External login providers | `LoginProvider`, `ProviderKey`, `UserId` |
| `AspNetUserTokens` | Authentication tokens | `UserId`, `LoginProvider`, `Name`, `Value` |
| `AspNetRoleClaims` | Role-based claims | `RoleId`, `ClaimType`, `ClaimValue` |

#### **Custom Tables** (Legacy - NOT USED by Officer Service)
Created by init.sql scripts. These exist but are NOT used by the Officer service in production.

| Table Name | Status | Notes |
|------------|--------|-------|
| `users` | ⚠️ LEGACY/UNUSED | Contains `is_verified`, `email_verified` columns instead of ASP.NET Identity columns |
| `user_profiles` | ✅ ACTIVE | Extended user profile information |
| `kid_accounts` | ✅ ACTIVE | Kid account management and parental controls |
| `joint_accounts` | ✅ ACTIVE | Joint account management |
| `joint_account_members` | ✅ ACTIVE | Members of joint accounts |
| `user_sessions` | ✅ ACTIVE | Active user sessions |
| `user_login_attempts` | ✅ ACTIVE | Login attempt tracking for security |
| `user_security_events` | ✅ ACTIVE | Security audit log |
| `user_verifications` | ✅ ACTIVE | Identity verification records |

#### **Key Column Mapping**
| ASP.NET Identity Column | Custom Schema Column | Purpose |
|-------------------------|----------------------|---------|
| `IsIdentityVerified` | `is_verified` | User verification status |
| `IsEmailVerified` | `email_verified` | Email verification status |
| `IdentityVerifiedAt` | N/A | Verification timestamp |
| `VerificationMethod` | N/A | Verification method used |
| `VerificationStatus` | N/A | Current verification status |

---

### **2. innkt_social** (Social Features)
**Purpose**: Posts, comments, likes, follows, groups

**Tables**:
| Table Name | Purpose |
|------------|---------|
| `Posts` | User posts and content |
| `Comments` | Comments on posts |
| `Likes` | Post and comment likes |
| `Follows` | User follow relationships |
| `Groups` | Social groups |
| `GroupMembers` | Group membership |
| `GroupPosts` | Posts within groups |
| `PollVotes` | Poll voting records |
| `__EFMigrationsHistory` | EF Core migration tracking |

---

### **3. innkt_groups** (Groups & Educational Features)
**Purpose**: Educational groups, subgroups, topics, roles

**Tables**:
| Table Name | Purpose |
|------------|---------|
| `Groups` | Group definitions |
| `Subgroups` | Hierarchical subgroups |
| `Topics` | Discussion topics within groups |
| `GroupRoles` | Custom roles for groups |
| `GroupMembers` | Group membership and roles |
| `__EFMigrationsHistory` | EF Core migration tracking |

---

### **4. innkt_kinder** (Kid Safety & Parental Controls)
**Purpose**: Kid account safety features, maturity tracking, content filtering

**Tables**:
| Table Name | Purpose |
|------------|---------|
| `MaturityScores` | Kid maturity assessment |
| `BehavioralMetrics` | Kid behavioral tracking |
| `TimeRestrictions` | Usage time restrictions |
| `ContentFilters` | Content filtering rules |
| `LoginCodes` | QR/PIN codes for kid login |
| `__EFMigrationsHistory` | EF Core migration tracking |

---

### **5. innkt_follow** (Follow Relationships)
**Purpose**: User follow/follower relationships (may be consolidated with social)

---

## 🔧 **HOW TO VERIFY A USER (lisbon.teresa)**

### **Option 1: Using SQL (Recommended)**

```sql
-- Connect to the correct database
\c innkt_officer;

-- Update user verification status in AspNetUsers table
UPDATE "AspNetUsers"
SET 
    "IsIdentityVerified" = true,
    "IdentityVerifiedAt" = CURRENT_TIMESTAMP,
    "VerificationMethod" = 'manual_testing',
    "VerificationStatus" = 'verified',
    "IsEmailVerified" = true,
    "EmailVerifiedAt" = CURRENT_TIMESTAMP
WHERE 
    "Email" = 'lisbon@innkt.com' 
    OR "UserName" = 'lisbon.teresa';

-- Verify the update
SELECT 
    "Id",
    "UserName",
    "Email",
    "FirstName",
    "LastName",
    "IsIdentityVerified",
    "IsEmailVerified",
    "VerificationStatus"
FROM "AspNetUsers"
WHERE 
    "Email" = 'lisbon@innkt.com' 
    OR "UserName" = 'lisbon.teresa';
```

### **Option 2: Using Docker Command**

```bash
# Create SQL file
cat > verify-user.sql << 'EOF'
UPDATE "AspNetUsers"
SET 
    "IsIdentityVerified" = true,
    "IdentityVerifiedAt" = CURRENT_TIMESTAMP,
    "VerificationMethod" = 'manual_testing',
    "VerificationStatus" = 'verified',
    "IsEmailVerified" = true,
    "EmailVerifiedAt" = CURRENT_TIMESTAMP
WHERE 
    "Email" = 'lisbon@innkt.com';
EOF

# Run the SQL file
cat verify-user.sql | docker exec -i innkt-postgres psql -U admin_officer -d innkt_officer
```

---

## ⚠️ **IMPORTANT NOTES**

### **1. Dual Schema Issue**
The `innkt_officer` database has TWO different schemas:
- **ASP.NET Identity tables** (`AspNetUsers`, etc.) - **ACTIVELY USED**
- **Custom tables** (`users`, etc.) - **LEGACY/UNUSED**

**Action Required**: Remove or clearly document the custom `users` table to avoid confusion.

### **2. Column Name Conventions**
- **ASP.NET Identity**: Uses PascalCase (e.g., `IsIdentityVerified`, `FirstName`)
- **Custom Schema**: Uses snake_case (e.g., `is_verified`, `first_name`)

### **3. Migration Status**
- The Officer service uses **EF Core Migrations** to manage the database schema
- Always run migrations after updating the code:
  ```bash
  dotnet ef database update
  ```

---

## 🛠️ **DATABASE MAINTENANCE COMMANDS**

### **Connect to PostgreSQL Container**
```bash
docker exec -it innkt-postgres psql -U admin_officer -d innkt_officer
```

### **List All Databases**
```sql
\l
```

### **List All Tables in Current Database**
```sql
\dt
```

### **Describe Table Structure**
```sql
\d "AspNetUsers"
```

### **Switch Database**
```sql
\c innkt_social
```

---

## 📝 **RECOMMENDED NEXT STEPS**

1. **Clean Up Dual Schema**: Remove the legacy `users` table or clearly document it
2. **Run Pending Migrations**: Ensure all EF Core migrations are applied
3. **Update Documentation**: Keep this document updated as schema changes
4. **Add Database Diagram**: Create visual database schema diagrams
5. **Implement Backup Strategy**: Set up automated database backups

---

**Last Updated**: January 8, 2025  
**Maintained By**: Development Team  
**Version**: 1.0
