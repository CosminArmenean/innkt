# 🌍 Multi-Language Translation Implementation Guide

## Overview
This document describes the **decentralized, JSON-based translation system** implemented across all innkt microservices, following industry best practices recommended by Grok AI.

---

## 🏗️ Architecture

### **Decentralized Approach**
- Each microservice **owns** its translations (no single point of failure)
- JSON resource files stored with each service (`/Resources` or `/locales`)
- Standard i18n libraries per technology stack
- Locale detected from `Accept-Language` header
- Translations cached in memory for performance

### **Supported Languages**
- 🇬🇧 English (`en`) - Default
- 🇪🇸 Spanish (`es`)
- 🇫🇷 French (`fr`)
- 🇩🇪 German (`de`)
- 🇮🇹 Italian (`it`)
- 🇵🇹 Portuguese (`pt`)
- 🇳🇱 Dutch (`nl`)
- 🇵🇱 Polish (`pl`)
- 🇨🇿 Czech (`cs`)
- 🇭🇺 Hungarian (`hu`)
- 🇷🇴 Romanian (`ro`)

---

## 📁 File Structure

### **.NET Microservices** (Officer, Groups, Social, Kinder, Notification, Neurospark, Seer)
```
Backend/innkt.{Service}/
├── Resources/
│   ├── en.json          # English translations
│   ├── es.json          # Spanish translations
│   ├── fr.json          # French translations
│   ├── de.json          # German translations
│   └── ...              # Other languages
├── Services/
│   ├── JsonStringLocalizer.cs
│   └── JsonStringLocalizerFactory.cs
└── Program.cs           # Localization setup
```

### **Node.js Messaging Service**
```
Backend/innkt.Messaging/
├── locales/
│   ├── en.json
│   ├── es.json
│   └── ...
└── server.js            # i18next configuration
```

### **React Frontend**
```
Frontend/innkt.react/
├── public/
│   └── locales/
│       ├── en/
│       │   └── translation.json
│       ├── es/
│       │   └── translation.json
│       └── ...
└── src/
    ├── i18n.ts          # i18next configuration
    └── components/      # Use useTranslation() hook
```

### **React Native Mobile**
```
Mobile/innkt.Mobile/
├── locales/
│   ├── en.json
│   ├── es.json
│   └── ...
└── i18n.ts              # i18next configuration
```

---

## 🔧 Implementation Details

### **.NET Services (C#)** ✅ **COMPLETED**

#### **Setup (Program.cs)**
```csharp
// Add JSON-based localization
var resourcesPath = Path.Combine(Directory.GetCurrentDirectory(), "Resources");
builder.Services.AddSingleton<IStringLocalizerFactory>(sp => 
    new JsonStringLocalizerFactory(resourcesPath, sp.GetRequiredService<ILoggerFactory>()));

builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    var supportedCultures = new[] { "en", "es", "fr", "de", "it", "pt", "nl", "pl", "cs", "hu", "ro" };
    options.SetDefaultCulture("en")
        .AddSupportedCultures(supportedCultures)
        .AddSupportedUICultures(supportedCultures);
    options.ApplyCurrentCultureToResponseHeaders = true;
});

// Use request localization middleware
app.UseRequestLocalization();
```

#### **Usage in Controllers**
```csharp
using Microsoft.Extensions.Localization;

public class AuthController : ControllerBase
{
    private readonly IStringLocalizer _localizer;

    public AuthController(IStringLocalizerFactory localizerFactory)
    {
        _localizer = localizerFactory.Create(typeof(AuthController));
    }

    [HttpPost("login")]
    public async Task<ActionResult> Login([FromBody] LoginDto dto)
    {
        try
        {
            // Business logic
            return Ok(new { message = _localizer["auth.login.success"].Value });
        }
        catch (Exception ex)
        {
            var errorMessage = _localizer["auth.login.failed"].Value;
            return StatusCode(500, new { error = errorMessage });
        }
    }
}
```

#### **JSON Translation Structure**
```json
{
  "auth": {
    "login": {
      "success": "Login successful",
      "failed": "Login failed",
      "invalid_credentials": "Invalid username or password"
    }
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete"
  }
}
```

Access via: `_localizer["auth.login.success"]`

---

### **Node.js Messaging Service** ⏳ **TODO**

#### **Setup**
```bash
npm install i18next i18next-http-middleware i18next-fs-backend
```

#### **Configuration (server.js)**
```javascript
const i18next = require('i18next');
const middleware = require('i18next-http-middleware');
const Backend = require('i18next-fs-backend');

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: './locales/{{lng}}.json'
    },
    fallbackLng: 'en',
    preload: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'cs', 'hu', 'ro'],
    detection: {
      order: ['header'], // Detect from Accept-Language header
      caches: false
    }
  });

app.use(middleware.handle(i18next));

// Usage in routes
app.post('/send-message', (req, res) => {
  try {
    // Business logic
    res.json({ message: req.t('message.sent') });
  } catch (error) {
    res.status(500).json({ error: req.t('message.failed') });
  }
});
```

---

### **React Frontend** ⏳ **TODO**

#### **Setup**
```bash
npm install i18next react-i18next i18next-http-backend i18next-browser-languagedetector
```

#### **Configuration (src/i18n.ts)**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'cs', 'hu', 'ro'],
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

#### **Usage in Components**
```typescript
import { useTranslation } from 'react-i18next';

function TopNavbar() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <nav>
      <button>{t('nav.social')}</button>
      <button>{t('nav.groups')}</button>
      <button>{t('nav.messaging')}</button>
      
      {/* Language switcher */}
      <select onChange={(e) => changeLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Español</option>
        <option value="fr">Français</option>
      </select>
    </nav>
  );
}
```

---

### **React Native Mobile** ⏳ **TODO**

#### **Setup**
```bash
npm install i18next react-i18next i18next-resources-to-backend
```

#### **Configuration (i18n.ts)**
```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';

const resources = {
  en: { translation: en },
  es: { translation: es }
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources,
    lng: Localization.locale.split('-')[0],
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

---

## 🔄 Locale Detection & Propagation

### **Client → Backend Flow**

1. **Frontend** sets `Accept-Language` header
   ```typescript
   axios.defaults.headers.common['Accept-Language'] = i18n.language;
   ```

2. **Backend** detects locale automatically
   - `.NET`: `UseRequestLocalization()` middleware
   - `Node.js`: `i18next-http-middleware.LanguageDetector`

3. **Backend** returns localized messages
   ```csharp
   return Ok(new { message = _localizer["success"].Value });
   ```

4. **Frontend** displays message (already translated by backend)

### **User Preference Storage**

**Option 1: LocalStorage (Frontend)**
```typescript
localStorage.setItem('preferred-language', 'es');
i18n.changeLanguage('es');
```

**Option 2: Database (Backend)**
```csharp
// Add to User model
public string PreferredLanguage { get; set; } = "en";

// Include in JWT claims
var claims = new List<Claim>
{
    new Claim("language", user.PreferredLanguage)
};

// Extract in API
var userLanguage = User.FindFirst("language")?.Value ?? "en";
CultureInfo.CurrentUICulture = new CultureInfo(userLanguage);
```

---

## ✅ Current Status

### **Completed**
- ✅ Created JSON translation files for all services
- ✅ Implemented `.NET` JSON localizer (`JsonStringLocalizer`, `JsonStringLocalizerFactory`)
- ✅ Setup Officer service localization
- ✅ Updated Officer `AuthController` to use localizer
- ✅ Created React translation files

### **TODO**
- ⏳ Apply localization to remaining .NET services (Groups, Social, Kinder, Notification, Neurospark, Seer)
- ⏳ Setup i18next for Node.js Messaging service
- ⏳ Setup react-i18next for React frontend
- ⏳ Setup i18next for React Native mobile
- ⏳ Add remaining language files (fr, de, it, pt, nl, pl, cs, hu, ro)
- ⏳ Test locale detection and switching
- ⏳ Add language selector UI component

---

## 🚀 Quick Start

### **Testing Localization**

**1. Test with cURL (Spanish)**
```bash
curl -H "Accept-Language: es" http://localhost:5001/api/auth/test
# Returns: Spanish translations
```

**2. Test with Postman**
```
Headers:
  Accept-Language: fr
```

**3. Test in React**
```typescript
import { useTranslation } from 'react-i18next';

function TestComponent() {
  const { t, i18n } = useTranslation();
  
  console.log(i18n.language); // Current language
  console.log(t('common.save')); // "Save" or "Guardar"
  
  i18n.changeLanguage('es'); // Switch to Spanish
}
```

---

## 📊 Performance Considerations

1. **Caching**: Translations loaded once and cached in memory
2. **Lazy Loading**: Only load required language on demand
3. **CDN**: Serve static translation files via CDN in production
4. **Bundle Size**: Split translations per route (code splitting)

---

## 🔐 Best Practices

1. **Consistent Keys**: Use dot notation (`auth.login.success`)
2. **Fallback**: Always have English (`en`) as fallback
3. **Context**: Provide context in comments for translators
4. **Placeholders**: Use `{param}` for dynamic values
   ```json
   {
     "welcome": "Welcome, {name}!"
   }
   ```
   ```typescript
   t('welcome', { name: 'John' }) // "Welcome, John!"
   ```
5. **No Hardcoded Strings**: All user-facing text must use translations
6. **Versioning**: Version translation files with code (Git)

---

## 🐛 Troubleshooting

### **Translations not loading**
- Check file path in configuration
- Verify JSON syntax (use JSON validator)
- Check console for errors

### **Wrong language displaying**
- Verify `Accept-Language` header
- Check browser language settings
- Clear localStorage/cache

### **Missing translations**
- Check fallback language (en)
- Verify key spelling
- Add missing keys to JSON file

---

## 📚 Resources

- **i18next Documentation**: https://www.i18next.com/
- **react-i18next**: https://react.i18next.com/
- **ASP.NET Localization**: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/localization

---

## 🎯 Next Steps

1. Complete remaining service integrations
2. Add all European language files
3. Create language selector UI component
4. Test end-to-end language switching
5. Document API responses with localized messages
6. Setup CI/CD for translation updates

---

**Last Updated**: 2025-01-12  
**Status**: 🟡 In Progress (40% complete)
