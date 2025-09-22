# 🚀 INNKT Services Port Reference

*Last Updated: September 22, 2025*

## 📋 **Official Service Port Configuration**

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **Officer** | 5001 | ✅ Active | Authentication, User Management, JWT Token Service |
| **Groups** | 5002 | ✅ Active | Group Management, Group Chats |
| **NeuroSpark** | 5003 | ✅ Active | AI Processing, Grok AI Integration |
| **Kinder** | 5004 | ✅ Active | Kid Safety, Parental Controls |
| **Notifications** | 5006 | ✅ Active | Push Notifications, Real-time Alerts |
| **Social** | 8081 | ✅ Active | Posts, Comments, Social Feed, Grok Integration |
| **Messaging** | 3000 | ✅ Active | Direct Messages, Group Chats |
| **Seer** | 5267 | ✅ Active | Analytics, Monitoring, Insights |
| **Frontier** | 51303 | ✅ Active | API Gateway, Ocelot Routing |
| **React** | 3001 | ✅ Active | Frontend Application |

## 🔧 **Service Dependencies**

### **Frontend (React - Port 3001)**
- Calls Officer (5001) for authentication
- Calls Social (8081) for posts and comments
- Calls Groups (5002) for group management
- Calls Messaging (3000) for direct messages
- Calls NeuroSpark (5003) for AI features
- Calls Notifications (5006) for real-time alerts

### **Social Service (Port 8081)**
- Calls Officer (5001) for user profile data
- Calls NeuroSpark (5003) for Grok AI processing
- Calls Messaging (3000) for notifications
- Calls Notifications (5006) for user alerts
- Stores data in MongoDB

### **NeuroSpark Service (Port 5003)**
- Calls X.AI API for Grok AI responses
- Returns AI responses to Social Service
- Processes AI requests asynchronously

### **Frontier Gateway (Port 51303)**
- Routes all API requests
- Handles CORS and authentication
- Load balances between services

## ⚠️ **Important Notes**

1. **DO NOT CHANGE PORTS** without explicit permission
2. **Port 5004** is reserved for **Kinder Service** (Kid Safety)
3. **Port 3000** is reserved for **Messaging Service**
4. **Port 8081** is reserved for **Social Service**
5. All services must be running for full functionality

## 🔍 **Troubleshooting**

### **Service Not Responding**
```bash
# Check if service is running
netstat -ano | findstr :PORT_NUMBER

# Check service logs
# Look for startup errors in console output
```

### **Port Conflicts**
```bash
# Find process using port
netstat -ano | findstr :PORT_NUMBER

# Kill process if needed
taskkill /PID PROCESS_ID /F
```

### **CORS Issues**
- Ensure Frontier Gateway (51303) is running
- Check CORS configuration in each service
- Verify frontend is calling correct ports

## 📝 **Configuration Files**

### **Backend Services**
- `Backend/innkt.Social/appsettings.json` - Social Service ports
- `Backend/innkt.Frontier/ocelot.json` - Gateway routing
- `Backend/innkt.Frontier/Properties/launchSettings.json` - Gateway ports

### **Frontend**
- `Frontend/innkt.react/src/config/environment.ts` - API endpoints
- `Frontend/innkt.react/src/services/grok.service.ts` - Grok AI service

## 🚨 **Current Issues**

1. **Kinder Service (5004)**: JWT token validation errors
   - Issue: Token signature validation failing
   - Solution: Check JWT key configuration

2. **Grok AI Integration**: Working correctly
   - Frontend → Social (8081) → NeuroSpark (5003) → X.AI
   - All ports correctly configured

## 📞 **Support**

For port-related issues or changes, contact the development team before making modifications.
