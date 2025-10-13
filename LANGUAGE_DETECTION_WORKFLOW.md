# 🌍 Language Detection Workflow - INNKT Platform

**Status:** ✅ **IMPLEMENTED & DEPLOYED**  
**Date:** October 13, 2025

---

## 🎯 Overview

INNKT implements a sophisticated multi-source language detection system that prioritizes user preferences across different storage mechanisms. The system ensures users always see content in their preferred language.

---

## 📋 Detection Priority Workflow

### Example User Visit Workflow:

```
User Visits Site
       ↓
┌──────────────────────────────────────────────────┐
│  Step 1: Check for Language Cookie               │
│  ✅ Cookie: "innkt_language"                     │
│  If found → Use this language                    │
└──────────────────────────────────────────────────┘
       ↓ (if no cookie)
┌──────────────────────────────────────────────────┐
│  Step 2: Check Database Preference               │
│  ✅ Table: AspNetUsers.PreferredLanguage         │
│  If user authenticated & has preference → Use it │
└──────────────────────────────────────────────────┘
       ↓ (if no database preference)
┌──────────────────────────────────────────────────┐
│  Step 3: Check Accept-Language Header            │
│  ✅ Header: "Accept-Language"                    │
│  Parse browser language preference → Use it      │
└──────────────────────────────────────────────────┘
       ↓ (if header unavailable)
┌──────────────────────────────────────────────────┐
│  Step 4: Default to English                      │
│  ✅ Default: "en"                                │
│  Use platform default language                   │
└──────────────────────────────────────────────────┘
       ↓
   Apply Language to Response
   Set Cookie (if not already set)
   Add X-Content-Language header
   Store in HttpContext.Items["UserLanguage"]
```

---

## 🔧 Technical Implementation

### 1. **Database Column** ✅ FIXED

**Issue Resolved:**
```
ERROR: column a.PreferredLanguage does not exist
POSITION: 1246
```

**Solution:**
- Added `PreferredLanguage` column to `AspNetUsers` table
- Migration: `20251013142745_AddPreferredLanguageColumn`
- Column type: `VARCHAR(10)` with default value `'en'`

**ApplicationUser Model:**
```csharp
[MaxLength(10)]
public string Language { get; set; } = "en";

[MaxLength(10)]
public string? PreferredLanguage { get; set; } = "en";
```

**DbContext Configuration:**
```csharp
entity.Property(e => e.Language).HasMaxLength(10).HasDefaultValue("en");
entity.Property(e => e.PreferredLanguage).HasMaxLength(10).HasDefaultValue("en");
```

---

### 2. **LanguageDetectionService** 

**Location:** `Backend/innkt.Officer/Services/LanguageDetectionService.cs`

**Key Methods:**

#### `DetectLanguageAsync(string? userId)`
```csharp
// Priority order:
// 1. Cookie "innkt_language"
// 2. Database user.PreferredLanguage (if authenticated)
// 3. Accept-Language header
// 4. Default "en"
```

#### `SetLanguageCookie(string language)`
```csharp
// Sets persistent cookie:
// - Expires: 1 year
// - HttpOnly: false (accessible to JavaScript)
// - Secure: true (HTTPS only)
// - SameSite: Lax
```

#### `UpdateUserLanguagePreferenceAsync(string userId, string language)`
```csharp
// Updates database preference and sets cookie
// Returns: true if successful
```

#### `GetLanguageMetadata(string language)`
```csharp
// Returns:
// - Code (e.g., "en")
// - Name (e.g., "English")
// - NativeName (e.g., "English")
// - IsRtl (e.g., false)
```

**Supported Languages (19):**
```csharp
en, ro, he, ar, es, fr, de, it, pt, ru, 
zh, ja, ko, hi, tr, nl, pl, cs, hu
```

**RTL Languages:**
- `ar` - Arabic (العربية)
- `he` - Hebrew (עברית)

---

### 3. **LanguageDetectionMiddleware**

**Location:** `Backend/innkt.Officer/Middleware/LanguageDetectionMiddleware.cs`

**Execution Order:**
```
Request → Routing → IdentityServer → RequestLocalization 
→ LanguageDetection → Authentication → Authorization → Controllers
```

**Features:**
- Automatic language detection per request
- Sets cookie if not present
- Adds `X-Content-Language` header to response
- Stores language in `HttpContext.Items["UserLanguage"]`
- Skips detection for `/api/auth` and `/health` endpoints

**Usage in Program.cs:**
```csharp
app.UseRequestLocalization();
app.UseLanguageDetection(); // Our custom middleware
app.UseAuthentication();
app.UseAuthorization();
```

---

### 4. **LanguageController API**

**Location:** `Backend/innkt.Officer/Controllers/LanguageController.cs`

#### Endpoints:

**1. GET `/api/language/detect`**
- Detects current user's language
- Returns: `{ language, metadata, source }`
- Source: "cookie" | "database" | "header" | "default"

**2. GET `/api/language/supported`**
- Lists all supported languages
- Returns: Array of language metadata

**3. POST `/api/language/set`**
- Sets user's preferred language
- Body: `{ "language": "es" }`
- Updates: Cookie + Database (if authenticated)
- Returns: Success confirmation with metadata

**4. GET `/api/language/current`**
- Gets currently applied language from HttpContext
- Returns: `{ language, metadata, source }`

**5. GET `/api/language/metadata/{language}`**
- Gets metadata for specific language
- Example: `/api/language/metadata/he`
- Returns: `{ code: "he", name: "Hebrew", nativeName: "עברית", isRtl: true }`

**6. GET `/api/language/is-rtl/{language}`**
- Checks if language uses RTL
- Returns: `{ language: "ar", isRtl: true }`

---

## 🔄 Usage Examples

### Frontend - Detect Language on Load

```typescript
// On app initialization
const response = await fetch('/api/language/detect');
const { language, metadata, source } = await response.json();

console.log(`Language detected: ${language} from ${source}`);
// Language detected: es from cookie

i18n.changeLanguage(language);
document.dir = metadata.isRtl ? 'rtl' : 'ltr';
```

### Frontend - Set User Language Preference

```typescript
// When user selects language from dropdown
const setLanguage = async (language: string) => {
  const response = await fetch('/api/language/set', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language })
  });

  const result = await response.json();
  
  if (result.success) {
    i18n.changeLanguage(language);
    document.dir = result.metadata.isRtl ? 'rtl' : 'ltr';
    // Cookie is automatically set by backend
  }
};
```

### Frontend - Get All Supported Languages

```typescript
// For language selector dropdown
const response = await fetch('/api/language/supported');
const { languages } = await response.json();

languages.forEach(lang => {
  console.log(`${lang.nativeName} (${lang.code})`);
  // English (en)
  // Español (es)
  // עברית (he)
  // العربية (ar)
  // etc.
});
```

### Backend - Access Current Language in Controller

```csharp
[HttpGet("content")]
public IActionResult GetContent()
{
    // Language is automatically detected by middleware
    var language = HttpContext.Items["UserLanguage"]?.ToString() ?? "en";
    
    // Use language for content localization
    var content = _contentService.GetLocalizedContent(language);
    
    return Ok(content);
}
```

---

## 🎨 Frontend Integration

### React - Language Provider Setup

```typescript
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageProvider: React.FC = ({ children }) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Detect language on mount
    fetch('/api/language/detect')
      .then(res => res.json())
      .then(({ language, metadata }) => {
        i18n.changeLanguage(language);
        document.documentElement.lang = language;
        document.documentElement.dir = metadata.isRtl ? 'rtl' : 'ltr';
      });
  }, []);

  return <>{children}</>;
};
```

### React - Language Selector Component

```typescript
import { useState, useEffect } from 'react';

export const LanguageSelector: React.FC = () => {
  const [languages, setLanguages] = useState([]);
  const [current, setCurrent] = useState('en');

  useEffect(() => {
    // Load supported languages
    fetch('/api/language/supported')
      .then(res => res.json())
      .then(({ languages }) => setLanguages(languages));

    // Get current language
    fetch('/api/language/current')
      .then(res => res.json())
      .then(({ language }) => setCurrent(language));
  }, []);

  const handleChange = async (language: string) => {
    const response = await fetch('/api/language/set', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language })
    });

    if (response.ok) {
      window.location.reload(); // Reload to apply language
    }
  };

  return (
    <select value={current} onChange={(e) => handleChange(e.target.value)}>
      {languages.map(lang => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
};
```

---

## 🔐 Cookie Details

**Cookie Name:** `innkt_language`

**Attributes:**
- **Expires:** 1 year from set date
- **HttpOnly:** `false` (JavaScript can read it for i18n)
- **Secure:** `true` (HTTPS only)
- **SameSite:** `Lax` (CSRF protection)
- **Path:** `/` (site-wide)

**Example Cookie Value:**
```
innkt_language=es; Expires=Sun, 13 Oct 2026 14:27:45 GMT; Path=/; Secure; SameSite=Lax
```

---

## 📊 Accept-Language Header Parsing

**Example Header:**
```
Accept-Language: en-US,en;q=0.9,es;q=0.8,fr;q=0.7
```

**Parsing Logic:**
1. Split by comma: `["en-US", "en;q=0.9", "es;q=0.8", "fr;q=0.7"]`
2. Extract quality values (q parameter)
3. Sort by quality (higher q = higher priority)
4. Extract language code (ignore region: en-US → en)
5. Return first supported language

**Result:** `en` (highest quality, supported)

---

## 🚀 Deployment Checklist

### Database Migration ✅
- [x] Migration created: `20251013142745_AddPreferredLanguageColumn`
- [x] Migration applied to database
- [x] Column added: `AspNetUsers.PreferredLanguage`
- [x] Default value: `'en'`
- [x] Login error fixed

### Services ✅
- [x] LanguageDetectionService registered in DI
- [x] HttpContextAccessor registered
- [x] Middleware added to pipeline

### API Endpoints ✅
- [x] LanguageController created
- [x] 6 endpoints implemented
- [x] Swagger documentation auto-generated

### Frontend Integration 🔄
- [ ] Add language detection on app load
- [ ] Create language selector component
- [ ] Handle RTL languages (Hebrew, Arabic)
- [ ] Update i18n configuration

---

## 📈 Performance Considerations

### Caching Strategy

1. **Cookie Cache:**
   - Duration: 1 year
   - Read: Per request (fast, no DB hit)
   - Write: Only when user changes language

2. **Database Cache:**
   - Use EF Core query caching
   - AsNoTracking() for read-only queries
   - Only query if no cookie present

3. **Header Parsing:**
   - Cached in middleware per request
   - Fallback only (rarely used)

### Optimization Tips

- Cookie check is fastest (no DB query)
- Database query only for authenticated users without cookie
- Header parsing is last resort
- Middleware caches result in HttpContext.Items

---

## 🔍 Troubleshooting

### Issue: Language not applying
**Check:**
1. Cookie present? `document.cookie` in browser console
2. Database value correct? Query `AspNetUsers.PreferredLanguage`
3. Middleware running? Check logs for "Language detected and set to..."
4. Frontend applying? Check `i18n.language` value

### Issue: Login fails with "column does not exist"
**Solution:** ✅ FIXED
- Migration applied: `20251013142745_AddPreferredLanguageColumn`
- Column added to database
- Login now works correctly

### Issue: RTL not working
**Check:**
1. Language metadata has `isRtl: true`
2. Frontend sets `document.dir = "rtl"`
3. CSS supports RTL (use logical properties: `margin-inline-start` vs `margin-left`)

---

## 📚 References

### Code Files:
- Service: `Backend/innkt.Officer/Services/LanguageDetectionService.cs`
- Middleware: `Backend/innkt.Officer/Middleware/LanguageDetectionMiddleware.cs`
- Controller: `Backend/innkt.Officer/Controllers/LanguageController.cs`
- Model: `Backend/innkt.Officer/Models/ApplicationUser.cs`
- DbContext: `Backend/innkt.Officer/Data/ApplicationDbContext.cs`
- Migration: `Backend/innkt.Officer/Migrations/20251013142745_AddPreferredLanguageColumn.cs`

### Related Documentation:
- `MULTILINGUAL_IMPLEMENTATION_COMPLETE.md` - Full i18n implementation
- `TRANSLATION_COMPLETE_100_PERCENT.md` - React frontend translation status

---

## ✅ Testing

### Manual Testing Steps:

1. **Test Cookie Detection:**
   ```bash
   # Set cookie manually
   document.cookie = "innkt_language=es; path=/"
   
   # Refresh and check detection
   fetch('/api/language/detect').then(r => r.json()).then(console.log)
   # Expected: { language: "es", source: "cookie", ... }
   ```

2. **Test Database Preference:**
   ```bash
   # Login and set preference
   fetch('/api/language/set', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ language: 'fr' })
   })
   
   # Clear cookie and detect
   document.cookie = "innkt_language=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/"
   fetch('/api/language/detect').then(r => r.json()).then(console.log)
   # Expected: { language: "fr", source: "database", ... }
   ```

3. **Test Header Fallback:**
   ```bash
   # Clear cookie and logout
   # Set browser language to Spanish
   # Visit site
   fetch('/api/language/detect').then(r => r.json()).then(console.log)
   # Expected: { language: "es", source: "header", ... }
   ```

4. **Test RTL Languages:**
   ```bash
   # Set to Hebrew
   fetch('/api/language/set', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ language: 'he' })
   }).then(r => r.json()).then(console.log)
   
   # Check RTL
   fetch('/api/language/is-rtl/he').then(r => r.json()).then(console.log)
   # Expected: { language: "he", isRtl: true }
   ```

---

## 🎊 Summary

✅ **Database Issue Fixed:** PreferredLanguage column added  
✅ **Comprehensive Detection:** Cookie → Database → Header → Default  
✅ **API Endpoints:** 6 endpoints for language management  
✅ **19 Languages Supported:** Including RTL (Hebrew, Arabic)  
✅ **Frontend Ready:** Easy integration with React/i18next  
✅ **Production Deployed:** All changes pushed to repository  

**The INNKT platform now has a robust, multi-source language detection system!** 🌍

