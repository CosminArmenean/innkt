# 🌍 Translation Management Rules

## 📋 **RULE: Always Add Translations for New UI Text**

When adding **ANY** new text that is visible to users, you **MUST** follow this process:

### ✅ **Step 1: Add to English Translation File**
1. Add the new translation key to `Frontend/innkt.react/public/locales/en/translation.json`
2. Use descriptive, hierarchical keys (e.g., `nav.security`, `theme.lightMode`)
3. Follow the existing structure and naming conventions

### ✅ **Step 2: Run Translation Update Script**
```bash
cd Frontend/innkt.react
node scripts/update-translations.js
```

This script will:
- ✅ Add missing keys to all 19 language files
- ✅ Preserve existing translations
- ✅ Use English as fallback for missing translations
- ✅ Report which languages were updated

### ✅ **Step 3: Verify in UI**
1. Test the new text appears correctly
2. Switch languages to ensure translations work
3. Check that no raw translation keys are visible (e.g., `nav.security`)

---

## 🚫 **What NOT to Do**

- ❌ **Never** add hardcoded text directly in components
- ❌ **Never** add translations to only one language file
- ❌ **Never** skip running the update script
- ❌ **Never** leave translation keys showing as raw text in UI

---

## 📁 **Translation File Structure**

### **Supported Languages (19 total):**
- 🇬🇧 English (en) - Source of truth
- 🇪🇸 Spanish (es) - Español
- 🇫🇷 French (fr) - Français  
- 🇩🇪 German (de) - Deutsch
- 🇮🇹 Italian (it) - Italiano
- 🇵🇹 Portuguese (pt) - Português
- 🇳🇱 Dutch (nl) - Nederlands
- 🇵🇱 Polish (pl) - Polski
- 🇨🇿 Czech (cs) - Čeština
- 🇭🇺 Hungarian (hu) - Magyar
- 🇷🇴 Romanian (ro) - Română
- 🇮🇱 Hebrew (he) - עברית (RTL)
- 🇯🇵 Japanese (ja) - 日本語
- 🇰🇷 Korean (ko) - 한국어
- 🇮🇳 Hindi (hi) - हिन्दी
- 🇸🇦 Arabic (ar) - العربية (RTL)
- 🇷🇺 Russian (ru) - Русский
- 🇹🇷 Turkish (tr) - Türkçe
- 🇨🇳 Chinese (zh) - 中文

### **File Location:**
```
Frontend/innkt.react/public/locales/
├── en/translation.json     # Source of truth
├── es/translation.json     # Spanish
├── fr/translation.json     # French
└── ... (16 more languages)
```

---

## 🔧 **Translation Script Commands**

### **Update All Translations:**
```bash
node scripts/update-translations.js
```

### **Check for Missing Keys (Dry Run):**
```bash
node scripts/update-translations.js check
```

### **Script Features:**
- ✅ Compares all files against English (source of truth)
- ✅ Adds missing keys to all languages
- ✅ Preserves existing translations
- ✅ Provides detailed progress reporting
- ✅ Handles RTL languages (Hebrew, Arabic)

---

## 📝 **Translation Key Naming Convention**

### **Structure:**
```
category.subcategory.specificKey
```

### **Examples:**
```json
{
  "nav": {
    "security": "Security",
    "settings": "Settings"
  },
  "theme": {
    "lightMode": "Light Mode",
    "darkMode": "Dark Mode",
    "switchToLight": "Switch to Light Mode"
  },
  "settings": {
    "language": "Language",
    "appearance": "Appearance"
  }
}
```

### **Categories:**
- `nav.*` - Navigation items
- `theme.*` - Theme-related text
- `settings.*` - Settings page text
- `auth.*` - Authentication text
- `common.*` - Common UI elements
- `social.*` - Social features
- `groups.*` - Group management
- `messaging.*` - Chat features
- `notifications.*` - Notification text
- `errors.*` - Error messages

---

## 🎯 **Recent Fixes Applied**

### **Missing Keys Added:**
- ✅ `nav.security` → "Security"
- ✅ `theme.lightMode` → "Light Mode"
- ✅ `theme.darkMode` → "Dark Mode"
- ✅ `theme.switchToLight` → "Switch to Light Mode"
- ✅ `theme.switchToDark` → "Switch to Dark Mode"
- ✅ Plus 10+ additional theme-related keys

### **Languages Updated:**
- ✅ All 19 languages now have complete translations
- ✅ 880+ missing keys added across all files
- ✅ No more raw translation keys visible in UI

---

## 🔍 **How to Identify Missing Translations**

### **Signs of Missing Translations:**
1. Raw keys showing in UI (e.g., `nav.security`, `theme.lightMode`)
2. Text not changing when switching languages
3. Console errors about missing translation keys

### **Quick Check:**
```bash
# Check for missing keys
node scripts/update-translations.js check
```

---

## 📊 **Translation Statistics**

- **Total Languages:** 19
- **Total Translation Keys:** 1,016+
- **RTL Languages:** 2 (Hebrew, Arabic)
- **Coverage:** 100% (all languages have all keys)
- **Fallback:** English for missing translations

---

## 🚀 **Best Practices**

### **When Adding New Features:**
1. **Plan translations first** - Define all text strings before coding
2. **Use consistent naming** - Follow existing patterns
3. **Test in multiple languages** - Verify RTL support works
4. **Document new keys** - Add to this file if needed

### **For Developers:**
- Always use `t('key')` instead of hardcoded strings
- Test language switching during development
- Run translation script before committing changes
- Verify no raw keys appear in UI

### **For Translators:**
- English file is the source of truth
- Preserve formatting and placeholders ({{variable}})
- Maintain consistency with existing translations
- Test translations in the actual UI

---

## 🆘 **Troubleshooting**

### **Raw Keys Showing in UI:**
1. Check if key exists in English file
2. Run translation update script
3. Restart development server
4. Clear browser cache

### **Script Errors:**
1. Ensure you're in the correct directory
2. Check file permissions
3. Verify JSON syntax in translation files
4. Run `node scripts/update-translations.js check` first

### **Missing Languages:**
1. Add language to `LANGUAGES` object in script
2. Create language directory in `public/locales/`
3. Run update script to populate keys

---

**Remember: Every visible text string must have a translation key! 🌍**
