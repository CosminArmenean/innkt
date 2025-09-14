# MongoDB Security Configuration Guide

## Current Security Status

### Development Environment
- **Authentication**: Basic username/password (admin/admin123)
- **Network**: Exposed on localhost:27017
- **Encryption**: Not enabled
- **Access Control**: Basic role-based access

### Security Issues Identified
1. ❌ Weak default passwords
2. ❌ No encryption in transit
3. ❌ No network restrictions
4. ❌ No audit logging
5. ❌ No backup encryption

## Secure Configuration

### 1. Enhanced Authentication
```yaml
# docker-compose-infrastructure-secure.yml
environment:
  MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME:-innkt_admin}
  MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD:-SecurePassword123!@#}
  MONGO_INITDB_AUTH_DATABASE: admin
```

### 2. Application User with Limited Privileges
- **Username**: innkt_messaging_user
- **Password**: MessagingUser123!@#
- **Role**: readWrite on innkt_messaging database only
- **No admin privileges**

### 3. Security Features Implemented
- ✅ Strong password requirements
- ✅ Role-based access control
- ✅ Database-specific permissions
- ✅ Index optimization for performance
- ✅ Monitoring user with read-only access

## Production Security Checklist

### Immediate Actions Required
- [ ] Change all default passwords
- [ ] Use environment variables for credentials
- [ ] Enable SSL/TLS encryption
- [ ] Implement network policies
- [ ] Enable audit logging
- [ ] Set up backup encryption
- [ ] Configure firewall rules
- [ ] Enable MongoDB Enterprise Security (if available)

### Network Security
```yaml
# Restrict MongoDB to internal network only
networks:
  innkt-network:
    driver: bridge
    internal: true  # No external access
```

### SSL/TLS Configuration
```yaml
# Add to MongoDB service
volumes:
  - ./mongodb-ssl:/etc/ssl/mongodb
environment:
  MONGO_SSL_MODE: requireSSL
  MONGO_SSL_PEM_KEY_FILE: /etc/ssl/mongodb/server.pem
```

### Environment Variables
```bash
# Use strong, unique passwords
MONGO_ROOT_USERNAME=your_secure_admin_username
MONGO_ROOT_PASSWORD=your_very_strong_password_here
MONGO_APP_USERNAME=your_app_username
MONGO_APP_PASSWORD=your_app_strong_password
```

## Monitoring and Auditing

### Enable Audit Logging
```javascript
// Add to MongoDB configuration
auditLog:
  destination: file
  path: /var/log/mongodb/audit.json
  format: JSON
  filter: '{ atype: { $in: ["authCheck", "authenticate", "logout"] } }'
```

### Health Checks
```yaml
healthcheck:
  test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')", "--username", "${MONGO_ROOT_USERNAME}", "--password", "${MONGO_ROOT_PASSWORD}", "--authenticationDatabase", "admin"]
  interval: 10s
  timeout: 5s
  retries: 5
```

## Backup Security

### Encrypted Backups
```bash
# Create encrypted backup
mongodump --uri="mongodb://username:password@localhost:27017/innkt_messaging" --gzip --archive=backup.gz --ssl
```

### Backup Rotation
- Daily backups for 30 days
- Weekly backups for 12 weeks
- Monthly backups for 12 months
- Encrypt all backup files

## Compliance Considerations

### GDPR Compliance
- Data encryption at rest and in transit
- Access logging and monitoring
- Data retention policies
- Right to be forgotten implementation

### SOC 2 Compliance
- Access controls and authentication
- Audit logging
- Data integrity monitoring
- Incident response procedures

## Quick Start Secure Setup

1. **Copy secure configuration**:
   ```bash
   cp docker-compose-infrastructure-secure.yml docker-compose-infrastructure.yml
   ```

2. **Set environment variables**:
   ```bash
   cp mongodb-secure.env .env
   # Edit .env with your secure passwords
   ```

3. **Start secure infrastructure**:
   ```bash
   docker-compose -f docker-compose-infrastructure.yml up -d
   ```

4. **Verify security**:
   ```bash
   # Test authentication
   mongosh --username innkt_admin --password SecurePassword123!@# --authenticationDatabase admin
   ```

## Security Monitoring

### Regular Security Tasks
- [ ] Weekly password rotation
- [ ] Monthly security audits
- [ ] Quarterly penetration testing
- [ ] Annual security training

### Monitoring Alerts
- Failed authentication attempts
- Unusual access patterns
- Database performance anomalies
- Backup failures

## Emergency Response

### Security Incident Response
1. Immediately change all passwords
2. Review access logs
3. Isolate affected systems
4. Notify security team
5. Document incident
6. Implement additional security measures

### Contact Information
- Security Team: security@innkt.com
- Database Admin: dba@innkt.com
- Emergency: +1-XXX-XXX-XXXX
