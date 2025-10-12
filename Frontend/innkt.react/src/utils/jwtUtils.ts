// JWT utility functions for extracting claims from tokens

interface JWTClaims {
  sub: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  preferredLanguage?: string;
  [key: string]: any;
}

/**
 * Decode a JWT token without verification (client-side only)
 * Note: This is for extracting claims only, not for security validation
 */
export function decodeJWT(token: string): JWTClaims | null {
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.warn('Invalid JWT token format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    const claims = JSON.parse(decodedPayload);
    
    return claims;
  } catch (error) {
    console.error('Error decoding JWT token:', error);
    return null;
  }
}

/**
 * Extract preferred language from JWT token
 */
export function getPreferredLanguageFromToken(): string {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return 'en'; // Default language
    }

    const claims = decodeJWT(token);
    if (!claims) {
      return 'en'; // Default language
    }

    // Return preferred language from token, or default to 'en'
    return claims.preferredLanguage || 'en';
  } catch (error) {
    console.error('Error extracting preferred language from token:', error);
    return 'en'; // Default language
  }
}

/**
 * Set language preference in localStorage and update i18n
 */
export function setLanguagePreference(language: string): void {
  try {
    localStorage.setItem('innkt-language', language);
    
    // If i18n is available, change the language
    if (typeof window !== 'undefined' && (window as any).i18n) {
      (window as any).i18n.changeLanguage(language);
    }
  } catch (error) {
    console.error('Error setting language preference:', error);
  }
}

/**
 * Get current language preference from localStorage or JWT token
 */
export function getCurrentLanguagePreference(): string {
  try {
    // First check localStorage
    const storedLanguage = localStorage.getItem('innkt-language');
    if (storedLanguage) {
      return storedLanguage;
    }

    // If not in localStorage, try to get from JWT token
    const tokenLanguage = getPreferredLanguageFromToken();
    if (tokenLanguage && tokenLanguage !== 'en') {
      // Store it in localStorage for future use
      localStorage.setItem('innkt-language', tokenLanguage);
      return tokenLanguage;
    }

    // Fallback to browser language or default
    const browserLanguage = navigator.language.split('-')[0];
    return browserLanguage || 'en';
  } catch (error) {
    console.error('Error getting current language preference:', error);
    return 'en';
  }
}

/**
 * Update user's preferred language on the server
 */
export async function updateUserLanguagePreference(language: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/update-language', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      },
      body: JSON.stringify({ preferredLanguage: language })
    });

    if (response.ok) {
      // Update localStorage
      setLanguagePreference(language);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error updating user language preference:', error);
    return false;
  }
}
