# Database Setup Guide - Preventing Confusion Between Docker and Local PostgreSQL

## Problem Summary
During development, there was confusion between:
- **Local PostgreSQL** (port 5432) - Contains the real production data
- **Docker PostgreSQL** (port 5432/5433) - Used for development/testing

This led to incorrect assumptions about database schema and data.

## Current Setup

### Local PostgreSQL (Primary Database)
- **Port**: 5432
- **User**: admin_officer
- **Password**: @CAvp57rt26
- **Databases**: innkt_officer, innkt_social, innkt_groups
- **Owner**: admin_officer (for innkt_social, innkt_groups) and CosminArmenean (for innkt_officer)

### Docker PostgreSQL (Development)
- **Port**: 5432 (when local PostgreSQL is stopped) or 5433 (when both are running)
- **User**: admin_officer
- **Password**: @CAvp57rt26
- **Purpose**: Development and testing

## How to Connect to Each Database

### Connect to Local PostgreSQL (Real Data)
```powershell
# Set password environment variable
$env:PGPASSWORD="@CAvp57rt26"

# Connect to local PostgreSQL
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U admin_officer -h localhost -p 5432 -d innkt_social
```

### Connect to Docker PostgreSQL
```powershell
# Connect to Docker PostgreSQL (when running on port 5432)
docker exec -it innkt-postgres psql -U admin_officer -d innkt_social

# Or connect from host (when running on port 5433)
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U admin_officer -h localhost -p 5433 -d innkt_social
```

## Service Configuration

### Social Service Connection String
The Social service should connect to the **local PostgreSQL** (real data):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=innkt_social;Username=admin_officer;Password=@CAvp57rt26;TrustServerCertificate=true;"
  }
}
```

## When to Use the Sync Script

Use `.\sync-databases.ps1` when:
- 🔄 **After schema changes** to your real database
- 🔄 **After data updates** in your real database  
- 🔄 **Before starting development** to ensure Docker has latest data
- 🔄 **When Docker database seems outdated** or inconsistent
- 🔄 **After resolving database issues** to reset Docker state

## Best Practices

### 1. Always Verify Which Database You're Querying
Before making assumptions about database schema or data:
```sql
-- Check which database you're connected to
SELECT current_database();

-- Check table count
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Check specific table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'Posts' ORDER BY ordinal_position;
```

### 2. Use Consistent Database for Development
- **For production data access**: Use local PostgreSQL (port 5432)
- **For testing new features**: Use Docker PostgreSQL
- **Never mix the two** during the same development session

### 3. Service Startup Order
1. Start infrastructure: `docker-compose-infrastructure-secure.yml`
2. Start services: `.\start-services.ps1`
3. Verify service health endpoints
4. Test database connectivity

### 4. Port Management
- If local PostgreSQL is running on 5432, Docker PostgreSQL will fail to start
- Either stop local PostgreSQL or change Docker port to 5433
- Update service connection strings accordingly

## Troubleshooting

### Issue: "Database shows different data than expected"
**Solution**: Verify which database you're connected to using the commands above.

### Issue: "Port already in use"
**Solution**: 
- Check what's using port 5432: `netstat -ano | findstr :5432`
- Stop conflicting service or change Docker port

### Issue: "Authentication failed"
**Solution**: 
- Verify user credentials
- Check if connecting to correct database instance
- Use environment variable: `$env:PGPASSWORD="@CAvp57rt26"`

## Schema Updates

When updating database schema:
1. **Always backup first**: `pg_dump -U admin_officer -h localhost -p 5432 innkt_social > backup.sql`
2. **Update local PostgreSQL** (real data)
3. **Test with Social service**
4. **Update Docker PostgreSQL** if needed for development

## Quick Sync Script

Use the provided PowerShell script to easily sync your real database to Docker:

```powershell
# Sync real database to Docker (simple version)
.\sync-databases-simple.ps1

# Or with custom parameters
.\sync-databases-simple.ps1 -Database "innkt_social" -User "admin_officer" -Password "@CAvp57rt26"
```

The script will:
1. ✅ Check Docker container status
2. ✅ Verify local PostgreSQL connection
3. ✅ Create database backup
4. ✅ Restore to Docker container
5. ✅ Basic verification (may show warnings - this is normal)
6. ✅ Clean up temporary files

**Note**: If verification shows warnings, you can manually verify by running:
```powershell
# Check row counts manually
$env:PGPASSWORD="@CAvp57rt26"; & "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U admin_officer -h localhost -p 5432 -d innkt_social -c "SELECT COUNT(*) FROM \"Posts\";"
docker exec innkt-postgres psql -U admin_officer -d innkt_social -c "SELECT COUNT(*) FROM \"Posts\";"
```

## File Locations
- Local PostgreSQL data: `C:\Program Files\PostgreSQL\17\data`
- Docker PostgreSQL data: Docker volume `postgres_data`
- Service connection strings: `Backend/innkt.Social/appsettings.json`
- **Sync script**: `sync-databases-simple.ps1`
