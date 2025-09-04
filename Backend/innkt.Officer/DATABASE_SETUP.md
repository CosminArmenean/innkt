# Database Setup Guide

## 🗄️ **MySQL Database Setup for INNKT Officer Service**

This guide will help you set up the MySQL databases required for the INNKT Officer Service.

## 📋 **Prerequisites**

- ✅ MySQL Server running on `127.0.0.1:3306`
- ✅ User `admin_officer` with password `@CAvp57rt26`
- ✅ MySQL client tools (mysql command line or MySQL Workbench)

## 🚀 **Step-by-Step Setup**

### **Step 1: Create the Databases**

#### **Option A: Using MySQL Command Line**
```bash
# Connect to MySQL as root or a user with CREATE DATABASE privileges
mysql -h 127.0.0.1 -P 3306 -u root -p

# Run the initialization script
source C:\Users\cosmi\source\repos\innkt\Backend\innkt.Officer\init-database.sql
```

#### **Option B: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open the `init-database.sql` file
4. Execute the script

#### **Option C: Manual Database Creation**
```sql
-- Create the main officer database
CREATE DATABASE IF NOT EXISTS `innkt_officer` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create the configuration database
CREATE DATABASE IF NOT EXISTS `innkt_configuration` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create the persisted grant database
CREATE DATABASE IF NOT EXISTS `innkt_persisted_grant` 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant privileges to admin_officer user
GRANT ALL PRIVILEGES ON `innkt_officer`.* TO 'admin_officer'@'localhost';
GRANT ALL PRIVILEGES ON `innkt_configuration`.* TO 'admin_officer'@'localhost';
GRANT ALL PRIVILEGES ON `innkt_persisted_grant`.* TO 'admin_officer'@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
```

### **Step 2: Verify Database Creation**
```sql
-- Show created databases
SHOW DATABASES LIKE 'innkt_%';

-- Verify user privileges
SHOW GRANTS FOR 'admin_officer'@'localhost';
```

### **Step 3: Apply Entity Framework Migrations**

Navigate to the project directory and run:
```bash
cd C:\Users\cosmi\source\repos\innkt\Backend\innkt.Officer

# Apply the migrations
dotnet ef database update --context ApplicationDbContext
```

### **Step 4: Verify Migration Results**
```sql
-- Connect to the innkt_officer database
USE innkt_officer;

-- Show all tables
SHOW TABLES;

-- Verify the enhanced AspNetUsers table structure
DESCRIBE AspNetUsers;

-- Check for new columns
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'innkt_officer' 
AND TABLE_NAME = 'AspNetUsers'
ORDER BY ORDINAL_POSITION;
```

## 🔍 **Expected Database Structure**

After successful migration, you should see:

### **Tables Created**
- `AspNetUsers` (enhanced with all new fields)
- `AspNetRoles`
- `AspNetUserClaims`
- `AspNetUserLogins`
- `AspNetUserRoles`
- `AspNetUserTokens`

### **Key New Columns in AspNetUsers**
- `RegisteredAt` - User registration timestamp
- `LastLogin` - Last login timestamp
- `Country`, `Address`, `City`, `State`, `PostalCode` - Profile fields
- `IsProfilePicturePng`, `ProfilePicturePngUrl`, `ProfilePictureCroppedUrl` - Image storage
- `IsMfaEnabled`, `MfaSecretKey`, `MfaEnabledAt`, `LastMfaVerification` - MFA fields
- `IsIdentityVerified`, `VerificationStatus`, `CreditCardLastFour`, `DriverLicensePhotoUrl` - Verification fields
- `IsKidAccount`, `ParentUserId`, `KidQrCode`, `KidPairingCode` - Kid account fields

### **Indexes Created**
- Performance indexes on all major fields
- Foreign key relationships for kid accounts and joint accounts
- Unique constraints on email addresses

## 🧪 **Testing the Setup**

### **Test Database Connection**
```bash
# Test the connection from the application
dotnet run

# Check the logs for any database connection errors
```

### **Verify API Endpoints**
Once the application is running, test these endpoints:
- `GET /api/auth/profile` - Should return user profile
- `GET /api/mfa/status` - Should return MFA status
- `GET /api/verification/status` - Should return verification status

## 🚨 **Troubleshooting**

### **Common Issues**

#### **1. Connection Refused**
```
Error: Unable to connect to any of the specified MySQL hosts.
```
**Solution**: Ensure MySQL service is running and accessible on port 3306.

#### **2. Access Denied**
```
Error: Access denied for user 'admin_officer'@'localhost' to database 'innkt_officer'
```
**Solution**: 
- Verify the user exists: `SELECT User, Host FROM mysql.user WHERE User = 'admin_officer';`
- Check privileges: `SHOW GRANTS FOR 'admin_officer'@'localhost';`
- Recreate user if needed:
```sql
CREATE USER 'admin_officer'@'localhost' IDENTIFIED BY '@CAvp57rt26';
GRANT ALL PRIVILEGES ON `innkt_officer`.* TO 'admin_officer'@'localhost';
FLUSH PRIVILEGES;
```

#### **3. Migration Errors**
```
Error: There is already an object named 'AspNetUsers' in the database.
```
**Solution**: 
- Drop existing tables: `DROP TABLE IF EXISTS AspNetUsers;`
- Re-run migration: `dotnet ef database update`

#### **4. Port Issues**
```
Error: Connection refused on port 3306
```
**Solution**: 
- Check MySQL configuration file (my.ini/my.cnf)
- Verify port setting: `SHOW VARIABLES LIKE 'port';`
- Restart MySQL service

### **Useful MySQL Commands**
```sql
-- Check MySQL version
SELECT VERSION();

-- Check current user
SELECT USER();

-- Check current database
SELECT DATABASE();

-- Show all databases
SHOW DATABASES;

-- Show all users
SELECT User, Host FROM mysql.user;

-- Check MySQL status
SHOW STATUS LIKE 'Uptime';
```

## ✅ **Verification Checklist**

- [ ] MySQL server is running on `127.0.0.1:3306`
- [ ] User `admin_officer` exists with correct password
- [ ] Databases `innkt_officer`, `innkt_configuration`, `innkt_persisted_grant` are created
- [ ] User has privileges on all databases
- [ ] Entity Framework migrations are applied successfully
- [ ] All tables are created with correct structure
- [ ] Application starts without database errors
- [ ] API endpoints respond correctly

## 🎯 **Next Steps After Setup**

1. **Test the Application**: Run `dotnet run` and verify no database errors
2. **Create Test Users**: Use the API to create test accounts
3. **Test MFA**: Enable and test multi-factor authentication
4. **Test Verification**: Submit and process verification requests
5. **Test Kid Accounts**: Create and manage kid accounts
6. **Performance Testing**: Verify database query performance
7. **Security Testing**: Validate authentication and authorization

## 📞 **Support**

If you encounter issues during setup:
1. Check the troubleshooting section above
2. Review the application logs for detailed error messages
3. Verify MySQL server configuration and permissions
4. Ensure all prerequisites are met

---

*Database Setup Guide - INNKT Officer Service*
*Last Updated: August 29, 2024*



