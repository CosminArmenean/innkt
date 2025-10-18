# 🏗️ API Gateway Architecture Migration Plan

## 📋 Executive Summary

This document outlines the complete migration from direct service-to-service calls to a centralized API Gateway architecture using Frontier (Ocelot). This migration will provide:

- **Centralized routing** through a single entry point (Port 51303)
- **CORS management** at the gateway level
- **JWT authentication** validation and forwarding
- **Load balancing** and rate limiting
- **WebSocket/SignalR proxy** support
- **Multi-device testing** capability

---

## 🎯 Target Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    React App (Port 3001)                  │
│                  Single Gateway Endpoint                  │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ ALL HTTP/WS Requests
                         │ http://localhost:51303 or http://<IP>:51303
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Frontier Gateway (Port 51303)                │
│  ✓ CORS Management    ✓ JWT Validation                   │
│  ✓ Rate Limiting      ✓ Load Balancing                   │
│  ✓ WebSocket Proxy    ✓ Request Routing                  │
└────────┬────────┬────────┬────────┬────────┬─────────┬───┘
         │        │        │        │        │         │
    /api/identity /api/social /api/seer /api/msg /api/kinder /api/notifications
         │        │        │        │        │         │
         ▼        ▼        ▼        ▼        ▼         ▼
    ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
    │Officer ││Social  ││ Seer   ││Messaging││Kinder  ││Notif.  │
    │ 5001   ││ 8081   ││ 5267   ││ 3000   ││ 5004   ││ 5006   │
    └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
    ┌────────┐┌────────┐
    │Neuro   ││Groups  │
    │ 5003   ││ 5002   │
    └────────┘└────────┘
```

---

## 📊 Service Mapping

| Service | Port | Gateway Path | Authentication |
|---------|------|--------------|----------------|
| **Officer** (Auth) | 5001 | `/api/identity/*` | Public + Protected |
| **Social** | 8081 | `/api/social/*` | Required |
| **Groups** | 5002 | `/api/groups/*` | Required |
| **NeuroSpark** (AI) | 5003 | `/api/neurospark/*` | Required |
| **Kinder** (Child Safety) | 5004 | `/api/kinder/*` | Required |
| **Notifications** | 5006 | `/api/notifications/*` | Required |
| **Seer** (Video Calls) | 5267 | `/api/seer/*` | Required |
| **Messaging** | 3000 | `/api/messaging/*` | Required |
| **Seer SignalR** | 5267 | `/hubs/signaling` | Required |
| **Notifications Hub** | 5006 | `/notificationHub` | Required |

---

## 🔧 PHASE 1: Frontier Gateway Configuration

**Estimated Time:** 30 minutes  
**Priority:** 🔥 Critical  
**Impact:** Foundation for entire architecture

### Task 1.1: Update Ocelot Routes

**File:** `Backend/innkt.Frontier/ocelot.json`

**Required Changes:**

1. **Add missing routes:**
   - NeuroSpark service (port 5003)
   - SignalR hubs for Seer and Notifications
   - Fix Groups port (should be 5002, not 8081)

2. **Update all routes to include OPTIONS method** for CORS preflight

3. **Complete route configuration:**

```json
{
  "Routes": [
    // ============================================
    // AUTHENTICATION (Officer) - PUBLIC
    // ============================================
    {
      "DownstreamPathTemplate": "/api/auth/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5001 }
      ],
      "UpstreamPathTemplate": "/api/identity/auth/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ]
    },
    
    // ============================================
    // AUTHENTICATION (Officer) - PROTECTED
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5001 }
      ],
      "UpstreamPathTemplate": "/api/identity/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // SOCIAL SERVICE
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 8081 }
      ],
      "UpstreamPathTemplate": "/api/social/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // GROUPS SERVICE
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5002 }
      ],
      "UpstreamPathTemplate": "/api/groups/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // NEUROSPARK SERVICE (AI, Search, Image Processing)
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5003 }
      ],
      "UpstreamPathTemplate": "/api/neurospark/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // KINDER SERVICE (Child Safety)
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5004 }
      ],
      "UpstreamPathTemplate": "/api/kinder/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // NOTIFICATIONS SERVICE
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5006 }
      ],
      "UpstreamPathTemplate": "/api/notifications/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // NOTIFICATIONS SERVICE - SIGNALR HUB
    // ============================================
    {
      "DownstreamPathTemplate": "/notificationHub",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5006 }
      ],
      "UpstreamPathTemplate": "/notificationHub",
      "UpstreamHttpMethod": [ "GET", "POST", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // SEER SERVICE - API
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5267 }
      ],
      "UpstreamPathTemplate": "/api/seer/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // SEER SERVICE - SIGNALR HUB (CRITICAL FOR VIDEO CALLS)
    // ============================================
    {
      "DownstreamPathTemplate": "/hubs/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5267 }
      ],
      "UpstreamPathTemplate": "/hubs/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // MESSAGING SERVICE
    // ============================================
    {
      "DownstreamPathTemplate": "/api/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 3000 }
      ],
      "UpstreamPathTemplate": "/api/messaging/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST", "PUT", "DELETE", "OPTIONS" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer"
      }
    },
    
    // ============================================
    // HEALTH CHECK ENDPOINTS (NO AUTH REQUIRED)
    // ============================================
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5001 }
      ],
      "UpstreamPathTemplate": "/health/officer",
      "UpstreamHttpMethod": [ "GET" ]
    },
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 8081 }
      ],
      "UpstreamPathTemplate": "/health/social",
      "UpstreamHttpMethod": [ "GET" ]
    },
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5002 }
      ],
      "UpstreamPathTemplate": "/health/groups",
      "UpstreamHttpMethod": [ "GET" ]
    },
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5003 }
      ],
      "UpstreamPathTemplate": "/health/neurospark",
      "UpstreamHttpMethod": [ "GET" ]
    },
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5004 }
      ],
      "UpstreamPathTemplate": "/health/kinder",
      "UpstreamHttpMethod": [ "GET" ]
    },
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5006 }
      ],
      "UpstreamPathTemplate": "/health/notifications",
      "UpstreamHttpMethod": [ "GET" ]
    },
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 5267 }
      ],
      "UpstreamPathTemplate": "/health/seer",
      "UpstreamHttpMethod": [ "GET" ]
    },
    {
      "DownstreamPathTemplate": "/health",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        { "Host": "localhost", "Port": 3000 }
      ],
      "UpstreamPathTemplate": "/health/messaging",
      "UpstreamHttpMethod": [ "GET" ]
    }
  ],
  "GlobalConfiguration": {
    "BaseUrl": "http://localhost:51303",
    "RateLimitOptions": {
      "DisableRateLimitHeaders": false,
      "QuotaExceededMessage": "Rate limit exceeded. Please try again later.",
      "HttpStatusCode": 429,
      "ClientIdHeader": "ClientId"
    },
    "LoadBalancerOptions": {
      "Type": "RoundRobin",
      "Key": "RoundRobin",
      "Expiry": 5000
    },
    "DownstreamScheme": "http",
    "HttpHandlerOptions": {
      "AllowAutoRedirect": false,
      "UseCookieContainer": false,
      "UseTracing": true,
      "UseProxy": false
    }
  }
}
```

---

### Task 1.2: Fix CORS Configuration

**File:** `Backend/innkt.Frontier/Program.cs` (Lines 94-102)

**Option A: Development (Recommended for testing):**

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("default", policy =>
    {
        policy.SetIsOriginAllowed(origin => 
        {
            // Allow localhost and local network IPs in development
            if (builder.Environment.IsDevelopment())
            {
                return origin.StartsWith("http://localhost") || 
                       origin.StartsWith("http://192.168.") ||
                       origin.StartsWith("http://10.0.") ||
                       origin.StartsWith("http://172.16.");
            }
            
            // Production: Use specific allowed origins from config
            var allowedOrigins = builder.Configuration
                .GetSection("AllowedOrigins")
                .Get<string[]>() ?? Array.Empty<string>();
            
            return allowedOrigins.Contains(origin);
        })
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});
```

**Option B: Configuration-based (Production):**

Update `appsettings.json`:

```json
"AllowedOrigins": [
  "http://localhost:3001",
  "http://localhost:3000",
  "https://yourdomain.com",
  "https://www.yourdomain.com"
]
```

---

### Task 1.3: Network Binding Configuration

**File:** `Backend/innkt.Frontier/appsettings.json`

**Add Kestrel configuration:**

```json
{
  "Kestrel": {
    "Endpoints": {
      "Http": {
        "Url": "http://0.0.0.0:51303"
      }
    }
  },
  "AllowedHosts": "*",
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Ocelot": "Information"
    }
  },
  "ConnectionStrings": {
    "Redis": "localhost:6379"
  },
  "AllowedOrigins": [
    "http://localhost:3001",
    "http://localhost:3000"
  ],
  "Jwt": {
    "Issuer": "http://localhost:5001",
    "Audience": "innkt.officer.api",
    "Key": "innkt.officer.jwt.secret.key.2025.very.long.and.secure.key"
  }
}
```

**Note:** `0.0.0.0` binds to all network interfaces, allowing external access.

---

## 🔧 PHASE 2: Frontend Migration

**Estimated Time:** 45 minutes  
**Priority:** 🔥 Critical  
**Impact:** All API calls will route through gateway

### Task 2.1: Update Environment Configuration

**File:** `Frontend/innkt.react/src/config/environment.ts`

**Replace current configuration with:**

```typescript
export const environment = {
  production: false,
  
  // API Endpoints - ALL route through gateway
  api: {
    // Primary gateway endpoint
    gateway: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    
    // Individual services (all point to gateway now)
    officer: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    social: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    groups: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    neurospark: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    messaging: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    notifications: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    frontier: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    seer: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
    kinder: process.env.REACT_APP_GATEWAY_URL || 'http://localhost:51303',
  },
  
  // Feature Flags
  features: {
    jointAccounts: true,
    kidAccounts: true,
    aiImageProcessing: true,
    qrCodes: true,
    blockchain: true,
    multiLanguage: true,
    rtlSupport: true,
  },
  
  // App Configuration
  app: {
    name: 'INNKT',
    version: '1.0.9',
    defaultLanguage: 'en',
    supportedLanguages: ['en', 'ro', 'he', 'ar', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko', 'hi', 'tr'],
    theme: {
      primaryColor: '#6E31A6',
      secondaryColor: '#8B5CF6',
      accentColor: '#A855F7',
    },
  },
  
  // Security
  security: {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },
  
  // File Upload
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFiles: 10,
  },
};
```

---

### Task 2.2: Create Environment File

**File:** `Frontend/innkt.react/.env` (CREATE NEW)

```env
# ============================================
# INNKT API Gateway Configuration
# ============================================

# Gateway URL - Single entry point for all services
REACT_APP_GATEWAY_URL=http://localhost:51303

# For multi-device testing on local network:
# Replace with your PC's IP address (find using 'ipconfig' or 'hostname -I')
# Example:
# REACT_APP_GATEWAY_URL=http://192.168.1.100:51303

# Port Configuration
PORT=3001

# ============================================
# Feature Flags
# ============================================
REACT_APP_ENABLE_GATEWAY=true
REACT_APP_ENABLE_DEBUG=true

# ============================================
# Notes:
# ============================================
# 1. All services now route through the Frontier Gateway (port 51303)
# 2. Individual service endpoints are NO LONGER used directly
# 3. The gateway handles:
#    - CORS
#    - Authentication
#    - Rate limiting
#    - Load balancing
#    - WebSocket proxying
# 4. To test on multiple devices:
#    - Find your local IP: ipconfig (Windows) or ifconfig (Mac/Linux)
#    - Update REACT_APP_GATEWAY_URL with your IP
#    - Ensure firewall allows port 51303 and 3001
```

---

### Task 2.3: Update API Service

**File:** `Frontend/innkt.react/src/services/api.service.ts`

**Add gateway path mapping:**

```typescript
import axios from 'axios';
import { environment } from '../config/environment';

// Gateway service path mapping
const API_PATHS = {
  identity: '/api/identity',
  social: '/api/social',
  groups: '/api/groups',
  neurospark: '/api/neurospark',
  messaging: '/api/messaging',
  notifications: '/api/notifications',
  seer: '/api/seer',
  kinder: '/api/kinder',
  hubs: '/hubs',
};

// Create axios instances for different services
export const createApiInstance = (baseURL: string, servicePath?: string) => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor
  instance.interceptors.request.use(
    (config) => {
      // Prepend service path if using gateway
      if (servicePath && config.url && !config.url.startsWith('http')) {
        // Don't prepend if URL already starts with the service path
        if (!config.url.startsWith(servicePath)) {
          config.url = `${servicePath}${config.url.startsWith('/') ? '' : '/'}${config.url}`;
        }
      }
      
      // Add auth token if available
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add Accept-Language header for translations
      const language = localStorage.getItem('innkt-language') || navigator.language.split('-')[0] || 'en';
      config.headers = config.headers || {};
      config.headers['Accept-Language'] = language;
      
      console.log('🌐 API Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        fullUrl: `${config.baseURL}${config.url}`
      });
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      if (error.response?.status === 401) {
        const token = localStorage.getItem('accessToken');
        const isPublicEndpoint = error.config?.url?.includes('/public') || 
                                error.config?.url?.includes('/login') || 
                                error.config?.url?.includes('/register');
        
        console.log('401 Error - Token exists:', !!token, 'Is public endpoint:', isPublicEndpoint, 'URL:', error.config?.url);
        
        const isCriticalEndpoint = error.config?.url?.includes('/api/auth/me') ||
                                  error.config?.url?.includes('/api/auth/refresh');
        
        if (isCriticalEndpoint && token) {
          console.log('Redirecting to login due to 401 on critical auth endpoint');
          localStorage.removeItem('accessToken');
          window.location.href = '/login';
        } else if (!token && !isPublicEndpoint) {
          console.log('Redirecting to login - no token and not public endpoint');
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

// API instances - ALL use gateway with service-specific paths
export const officerApi = createApiInstance(environment.api.gateway, API_PATHS.identity);
export const socialApi = createApiInstance(environment.api.gateway, API_PATHS.social);
export const groupsApi = createApiInstance(environment.api.gateway, API_PATHS.groups);
export const neurosparkApi = createApiInstance(environment.api.gateway, API_PATHS.neurospark);
export const messagingApi = createApiInstance(environment.api.gateway, API_PATHS.messaging);
export const notificationsApi = createApiInstance(environment.api.gateway, API_PATHS.notifications);
export const frontierApi = createApiInstance(environment.api.gateway);
export const seerApi = createApiInstance(environment.api.gateway, API_PATHS.seer);
export const kinderApi = createApiInstance(environment.api.gateway, API_PATHS.kinder);

// ... rest of the file remains the same
```

---

## 🔧 PHASE 3: WebSocket/SignalR Gateway Support

**Estimated Time:** 20 minutes  
**Priority:** ⚠️ High  
**Impact:** Critical for Seer (video calls) and Notifications

### Task 3.1: Update Call Service SignalR URL

**File:** `Frontend/innkt.react/src/services/call.service.ts`

**Find and replace:**

```typescript
// OLD
private readonly SEER_SERVICE_URL = 'http://localhost:5267';

// NEW
private readonly SEER_SERVICE_URL = process.env.REACT_APP_GATEWAY_URL || environment.api.gateway || 'http://localhost:51303';
```

**SignalR connection will now use:**
- `http://localhost:51303/hubs/signaling` (or with your IP for multi-device)

---

### Task 3.2: Update Notification Service SignalR URL

**File:** `Frontend/innkt.react/src/services/notification.service.ts`

**Find and replace:**

```typescript
// OLD
const NOTIFICATION_HUB_URL = 'http://localhost:5006/notificationHub';

// NEW
const NOTIFICATION_HUB_URL = `${process.env.REACT_APP_GATEWAY_URL || environment.api.gateway || 'http://localhost:51303'}/notificationHub`;
```

---

## ✅ PHASE 4: Testing & Validation

**Estimated Time:** 30 minutes  
**Priority:** ✅ Medium

### Task 4.1: Create Gateway Test Script

**File:** `test-gateway.ps1` (CREATE NEW)

```powershell
#!/usr/bin/env pwsh

# ============================================
# Frontier Gateway Test Script
# ============================================

$gateway = "http://localhost:51303"
$ErrorActionPreference = "Continue"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🧪 Testing Frontier Gateway" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Gateway is running
Write-Host "📡 Test 1: Gateway Availability" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $gateway -Method GET -ErrorAction Stop
    Write-Host "✅ Gateway is running on $gateway" -ForegroundColor Green
} catch {
    Write-Host "❌ Gateway is not accessible" -ForegroundColor Red
    Write-Host "   Make sure Frontier service is running" -ForegroundColor Red
    exit 1
}

# Test 2: Health endpoints
Write-Host "`n📡 Test 2: Health Endpoints" -ForegroundColor Yellow
$services = @("officer", "social", "groups", "neurospark", "kinder", "notifications", "seer", "messaging")

foreach ($service in $services) {
    try {
        $url = "$gateway/health/$service"
        $response = Invoke-RestMethod -Uri $url -Method GET -ErrorAction Stop
        Write-Host "✅ $service - OK" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  $service - Not responding" -ForegroundColor Yellow
    }
}

# Test 3: CORS
Write-Host "`n📡 Test 3: CORS Configuration" -ForegroundColor Yellow
$headers = @{
    "Origin" = "http://localhost:3001"
    "Access-Control-Request-Method" = "GET"
}

try {
    $response = Invoke-WebRequest -Uri "$gateway/health/officer" -Headers $headers -Method OPTIONS -ErrorAction Stop
    if ($response.Headers.'Access-Control-Allow-Origin') {
        Write-Host "✅ CORS is properly configured" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CORS headers not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ CORS test failed" -ForegroundColor Red
}

# Test 4: Authentication endpoint
Write-Host "`n📡 Test 4: Authentication Routing" -ForegroundColor Yellow
try {
    # This should return 401 or 400 (not 404), indicating the route exists
    $response = Invoke-WebRequest -Uri "$gateway/api/identity/auth/me" -Method GET -ErrorAction Stop
    Write-Host "✅ Auth endpoint is accessible" -ForegroundColor Green
} catch {
    if ($_.Exception.Response.StatusCode -eq 401 -or $_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ Auth endpoint is routing correctly (returned $($_.Exception.Response.StatusCode))" -ForegroundColor Green
    } elseif ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "❌ Auth endpoint not found - routing issue" -ForegroundColor Red
    } else {
        Write-Host "⚠️  Auth endpoint returned: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "✅ Gateway tests completed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
```

---

### Task 4.2: Create Network Configuration Script

**File:** `configure-network.ps1` (CREATE NEW)

```powershell
#!/usr/bin/env pwsh

# ============================================
# Multi-Device Network Configuration Script
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🌐 INNKT Multi-Device Configuration" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Get local IP address
Write-Host "🔍 Detecting local IP address..." -ForegroundColor Yellow
$ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Wi-Fi" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress

if (-not $ip) {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias "Ethernet" -ErrorAction SilentlyContinue | Select-Object -First 1).IPAddress
}

if (-not $ip) {
    Write-Host "❌ Could not detect IP address" -ForegroundColor Red
    Write-Host "   Please find your IP manually using 'ipconfig'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Your local IP address: $ip" -ForegroundColor Green
Write-Host ""

# Configuration instructions
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📝 Configuration Steps:" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1️⃣  Update Frontend .env file:" -ForegroundColor Cyan
Write-Host "   File: Frontend\innkt.react\.env" -ForegroundColor White
Write-Host "   Set: REACT_APP_GATEWAY_URL=http://$ip:51303" -ForegroundColor White
Write-Host ""

Write-Host "2️⃣  Restart React development server:" -ForegroundColor Cyan
Write-Host "   cd Frontend\innkt.react" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor White
Write-Host ""

Write-Host "3️⃣  On other devices, open browser and navigate to:" -ForegroundColor Cyan
Write-Host "   http://$ip:3001" -ForegroundColor White
Write-Host ""

Write-Host "4️⃣  Ensure Frontier Gateway is running:" -ForegroundColor Cyan
Write-Host "   Gateway should be accessible at: http://$ip:51303" -ForegroundColor White
Write-Host ""

# Firewall configuration
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "🔥 Configuring Windows Firewall..." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

try {
    # Check if rules already exist
    $frontierRule = Get-NetFirewallRule -DisplayName "innkt-frontier-gateway" -ErrorAction SilentlyContinue
    $frontendRule = Get-NetFirewallRule -DisplayName "innkt-frontend-dev" -ErrorAction SilentlyContinue
    
    if (-not $frontierRule) {
        New-NetFirewallRule -DisplayName "innkt-frontier-gateway" -Direction Inbound -LocalPort 51303 -Protocol TCP -Action Allow -ErrorAction Stop | Out-Null
        Write-Host "✅ Firewall rule added for Frontier Gateway (port 51303)" -ForegroundColor Green
    } else {
        Write-Host "✅ Firewall rule already exists for Frontier Gateway" -ForegroundColor Green
    }
    
    if (-not $frontendRule) {
        New-NetFirewallRule -DisplayName "innkt-frontend-dev" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow -ErrorAction Stop | Out-Null
        Write-Host "✅ Firewall rule added for Frontend (port 3001)" -ForegroundColor Green
    } else {
        Write-Host "✅ Firewall rule already exists for Frontend" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Could not configure firewall (may need admin rights)" -ForegroundColor Yellow
    Write-Host "   Run PowerShell as Administrator and try again" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Configuration complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Test on second device:" -ForegroundColor Cyan
Write-Host "   1. Connect second device to same WiFi network" -ForegroundColor White
Write-Host "   2. Open browser and go to: http://$ip:3001" -ForegroundColor White
Write-Host "   3. Login and test video call functionality" -ForegroundColor White
Write-Host ""
```

---

## 📊 Implementation Checklist

### Phase 1: Frontier Gateway ✅
- [ ] Backup current `ocelot.json`
- [ ] Update Ocelot routes with all services
- [ ] Add SignalR hub routes
- [ ] Fix Groups service port (5002)
- [ ] Add NeuroSpark routes (5003)
- [ ] Update CORS configuration in Program.cs
- [ ] Add network binding configuration
- [ ] Test Frontier startup
- [ ] Verify health endpoints work

### Phase 2: Frontend Migration ✅
- [ ] Backup current environment.ts
- [ ] Update environment configuration
- [ ] Create .env file
- [ ] Update api.service.ts with gateway paths
- [ ] Test API calls on localhost
- [ ] Verify authentication works
- [ ] Check all service integrations

### Phase 3: WebSocket Support ✅
- [ ] Update call.service.ts SignalR URL
- [ ] Update notification.service.ts SignalR URL
- [ ] Test WebSocket connections
- [ ] Verify video calls work through gateway
- [ ] Check notifications work

### Phase 4: Testing ✅
- [ ] Create test-gateway.ps1 script
- [ ] Run gateway tests
- [ ] Create configure-network.ps1 script
- [ ] Test on localhost
- [ ] Configure firewall rules
- [ ] Test on second device

---

## 🎯 Success Criteria

✅ **All API calls route through Frontier Gateway (port 51303)**  
✅ **CORS works from any device on local network**  
✅ **SignalR/WebSocket connections work through gateway**  
✅ **JWT authentication forwarding works correctly**  
✅ **Multi-device testing is functional**  
✅ **No direct service-to-service calls from frontend**  
✅ **Health checks accessible through gateway**  
✅ **Rate limiting configured and working**

---

## 🚀 Execution Timeline

| Phase | Tasks | Est. Time | Dependencies |
|-------|-------|-----------|--------------|
| **Phase 1** | Frontier Configuration | 30 min | None |
| **Phase 2** | Frontend Migration | 45 min | Phase 1 complete |
| **Phase 3** | WebSocket Support | 20 min | Phase 2 complete |
| **Phase 4** | Testing & Validation | 30 min | Phase 3 complete |
| **Total** | **All Phases** | **~2.5 hours** | - |

---

## 🔍 Rollback Plan

If migration fails, rollback steps:

1. **Restore environment.ts** from backup
2. **Restore api.service.ts** from backup
3. **Restart React app** with original configuration
4. **Services will work directly** without gateway
5. **Investigate issues** before retrying

---

## 📝 Notes

- This migration provides a **production-ready architecture**
- **Multi-device testing** will work seamlessly
- **CORS issues** are centralized and easier to manage
- **Rate limiting** and **load balancing** are available
- **Monitoring** and **logging** are centralized
- **Future scaling** is much easier with gateway

---

## 🆘 Troubleshooting

### Issue: Gateway returns 404
**Solution:** Check Ocelot route configuration, ensure service path matches

### Issue: CORS errors
**Solution:** Verify CORS policy in Program.cs allows your origin

### Issue: SignalR not connecting
**Solution:** Check WebSocket proxy support, ensure JWT in query string

### Issue: Authentication fails
**Solution:** Verify JWT forwarding handler, check token format

### Issue: Can't access from other devices
**Solution:** Check firewall rules, verify network binding (0.0.0.0)

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-18  
**Status:** Ready for Implementation  
**Estimated Implementation Time:** 2.5 hours

