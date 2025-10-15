#!/usr/bin/env node

/**
 * Translation Verification Script
 * 
 * This script verifies that all translation files are properly formatted
 * and contain the expected keys.
 * 
 * Usage:
 *   node scripts/verify-translations.js
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '../public/locales');

// Languages to check
const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'cs', 'hu', 'ro', 'he', 'ja', 'ko', 'hi', 'ar', 'ru', 'tr', 'zh'];

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
    return null;
  }
}

/**
 * Main verification function
 */
function verifyTranslations() {
  console.log('🔍 Verifying translation files...\n');
  
  // Read English file as reference
  const englishTranslations = readTranslationFile('en');
  
  if (!englishTranslations) {
    console.error('❌ English translation file not found or invalid!');
    process.exit(1);
  }
  
  const englishKeys = getAllKeys(englishTranslations);
  console.log(`📝 English file has ${englishKeys.length} translation keys\n`);
  
  let allValid = true;
  let totalFiles = 0;
  let validFiles = 0;
  
  // Check each language
  for (const lang of LANGUAGES) {
    totalFiles++;
    
    const translations = readTranslationFile(lang);
    
    if (!translations) {
      console.log(`❌ ${lang}: File not found or invalid JSON`);
      allValid = false;
      continue;
    }
    
    const keys = getAllKeys(translations);
    const missingKeys = englishKeys.filter(key => !keys.includes(key));
    const extraKeys = keys.filter(key => !englishKeys.includes(key));
    
    if (missingKeys.length === 0 && extraKeys.length === 0) {
      console.log(`✅ ${lang}: All ${keys.length} keys match English`);
      validFiles++;
    } else {
      console.log(`⚠️  ${lang}: ${keys.length} keys (${missingKeys.length} missing, ${extraKeys.length} extra)`);
      if (missingKeys.length > 0) {
        console.log(`   Missing: ${missingKeys.slice(0, 3).join(', ')}${missingKeys.length > 3 ? '...' : ''}`);
      }
      if (extraKeys.length > 0) {
        console.log(`   Extra: ${extraKeys.slice(0, 3).join(', ')}${extraKeys.length > 3 ? '...' : ''}`);
      }
      allValid = false;
    }
  }
  
  console.log(`\n📊 Verification Summary:`);
  console.log(`  ✅ Valid files: ${validFiles}/${totalFiles}`);
  console.log(`  📝 Total keys in English: ${englishKeys.length}`);
  
  // Check for specific problematic keys
  console.log(`\n🔍 Checking for specific keys that were causing issues...`);
  
  const problematicKeys = ['nav.security', 'theme.lightMode', 'theme.darkMode'];
  let allProblematicKeysFound = true;
  
  for (const lang of LANGUAGES) {
    const translations = readTranslationFile(lang);
    if (!translations) continue;
    
    for (const key of problematicKeys) {
      const keys = getAllKeys(translations);
      if (!keys.includes(key)) {
        console.log(`❌ ${lang}: Missing key "${key}"`);
        allValid = false;
        allProblematicKeysFound = false;
      }
    }
  }
  
  if (allProblematicKeysFound) {
    console.log(`✅ All problematic keys found in all languages`);
  }
  
  if (allValid) {
    console.log(`\n🎉 All translation files are valid and complete!`);
  } else {
    console.log(`\n⚠️  Some translation files have issues. Run "npm run translations:update" to fix them.`);
  }
  
  return allValid;
}

// Run verification
const isValid = verifyTranslations();
process.exit(isValid ? 0 : 1);
