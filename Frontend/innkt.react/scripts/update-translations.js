#!/usr/bin/env node

/**
 * Translation Management Script
 * 
 * This script ensures all language files have the same translation keys.
 * When adding new text to the UI, run this script to add the missing keys
 * to all language files.
 * 
 * Usage:
 *   node scripts/update-translations.js
 * 
 * Features:
 * - Compares all language files against the English (en) file
 * - Adds missing keys to all language files
 * - Preserves existing translations
 * - Provides fallback to English for missing translations
 */

const fs = require('fs');
const path = require('path');

// Language configurations with proper names and RTL support
const LANGUAGES = {
  'en': { name: 'English', nativeName: 'English', rtl: false },
  'es': { name: 'Spanish', nativeName: 'Español', rtl: false },
  'fr': { name: 'French', nativeName: 'Français', rtl: false },
  'de': { name: 'German', nativeName: 'Deutsch', rtl: false },
  'it': { name: 'Italian', nativeName: 'Italiano', rtl: false },
  'pt': { name: 'Portuguese', nativeName: 'Português', rtl: false },
  'nl': { name: 'Dutch', nativeName: 'Nederlands', rtl: false },
  'pl': { name: 'Polish', nativeName: 'Polski', rtl: false },
  'cs': { name: 'Czech', nativeName: 'Čeština', rtl: false },
  'hu': { name: 'Hungarian', nativeName: 'Magyar', rtl: false },
  'ro': { name: 'Romanian', nativeName: 'Română', rtl: false },
  'he': { name: 'Hebrew', nativeName: 'עברית', rtl: true },
  'ja': { name: 'Japanese', nativeName: '日本語', rtl: false },
  'ko': { name: 'Korean', nativeName: '한국어', rtl: false },
  'hi': { name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  'ar': { name: 'Arabic', nativeName: 'العربية', rtl: true },
  'ru': { name: 'Russian', nativeName: 'Русский', rtl: false },
  'tr': { name: 'Turkish', nativeName: 'Türkçe', rtl: false },
  'zh': { name: 'Chinese', nativeName: '中文', rtl: false }
};

const LOCALES_DIR = path.join(__dirname, '../public/locales');

/**
 * Deep merge two objects, adding missing keys from source to target
 */
function deepMergeKeys(source, target) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        if (!result[key] || typeof result[key] !== 'object') {
          result[key] = {};
        }
        result[key] = deepMergeKeys(source[key], result[key]);
      } else if (!result.hasOwnProperty(key)) {
        // Add missing key with fallback to English
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Get all nested keys from an object
 */
function getAllKeys(obj, prefix = '') {
  let keys = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys = keys.concat(getAllKeys(obj[key], fullKey));
      } else {
        keys.push(fullKey);
      }
    }
  }
  
  return keys;
}

/**
 * Read translation file
 */
function readTranslationFile(lang) {
  const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Could not read ${lang} translation file: ${error.message}`);
    return {};
  }
}

/**
 * Write translation file
 */
function writeTranslationFile(lang, data) {
  const filePath = path.join(LOCALES_DIR, lang, 'translation.json');
  
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write with proper formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Could not write ${lang} translation file: ${error.message}`);
    return false;
  }
}

/**
 * Main function to update all translations
 */
function updateTranslations() {
  console.log('🌍 Starting translation update process...\n');
  
  // Read English file as the source of truth
  const englishTranslations = readTranslationFile('en');
  
  if (Object.keys(englishTranslations).length === 0) {
    console.error('❌ English translation file is empty or missing!');
    process.exit(1);
  }
  
  const englishKeys = getAllKeys(englishTranslations);
  console.log(`📝 Found ${englishKeys.length} translation keys in English file\n`);
  
  let updatedCount = 0;
  let errorCount = 0;
  
  // Process each language
  for (const [langCode, langInfo] of Object.entries(LANGUAGES)) {
    if (langCode === 'en') continue; // Skip English as it's our source
    
    console.log(`🔄 Processing ${langInfo.name} (${langCode})...`);
    
    const existingTranslations = readTranslationFile(langCode);
    const mergedTranslations = deepMergeKeys(englishTranslations, existingTranslations);
    const existingKeys = getAllKeys(existingTranslations);
    const mergedKeys = getAllKeys(mergedTranslations);
    
    const newKeys = mergedKeys.length - existingKeys.length;
    
    if (newKeys > 0) {
      console.log(`  ➕ Added ${newKeys} missing keys`);
      
      if (writeTranslationFile(langCode, mergedTranslations)) {
        updatedCount++;
        console.log(`  ✅ Updated successfully`);
      } else {
        errorCount++;
        console.log(`  ❌ Update failed`);
      }
    } else {
      console.log(`  ✓ All keys up to date`);
    }
    
    console.log(`  📊 Total keys: ${mergedKeys.length}\n`);
  }
  
  // Summary
  console.log('📋 Translation Update Summary:');
  console.log(`  ✅ Languages updated: ${updatedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  🌍 Total languages: ${Object.keys(LANGUAGES).length}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All translations updated successfully!');
  } else {
    console.log('\n⚠️  Some translations could not be updated. Check the errors above.');
  }
}

/**
 * Check for missing keys (dry run)
 */
function checkMissingKeys() {
  console.log('🔍 Checking for missing translation keys...\n');
  
  const englishTranslations = readTranslationFile('en');
  const englishKeys = getAllKeys(englishTranslations);
  
  let totalMissing = 0;
  
  for (const [langCode, langInfo] of Object.entries(LANGUAGES)) {
    if (langCode === 'en') continue;
    
    const existingTranslations = readTranslationFile(langCode);
    const existingKeys = getAllKeys(existingTranslations);
    const missingKeys = englishKeys.filter(key => !existingKeys.includes(key));
    
    if (missingKeys.length > 0) {
      console.log(`❌ ${langInfo.name} (${langCode}): ${missingKeys.length} missing keys`);
      missingKeys.slice(0, 5).forEach(key => console.log(`   - ${key}`));
      if (missingKeys.length > 5) {
        console.log(`   ... and ${missingKeys.length - 5} more`);
      }
      totalMissing += missingKeys.length;
    } else {
      console.log(`✅ ${langInfo.name} (${langCode}): All keys present`);
    }
  }
  
  console.log(`\n📊 Total missing keys across all languages: ${totalMissing}`);
  
  if (totalMissing > 0) {
    console.log('\n💡 Run "node scripts/update-translations.js" to fix missing keys');
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case 'check':
  case '--check':
    checkMissingKeys();
    break;
  case 'update':
  case '--update':
  default:
    updateTranslations();
    break;
}
