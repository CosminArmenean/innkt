import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usernameValidationService, UsernameValidationResult } from '../../services/usernameValidation.service';

interface UsernameInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean, errors: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showSuggestions?: boolean;
  debounceMs?: number;
}

const UsernameInput: React.FC<UsernameInputProps> = ({
  value,
  onChange,
  onValidationChange,
  placeholder = "Enter username",
  disabled = false,
  className = "",
  showSuggestions = true,
  debounceMs = 500
}) => {
  const { t } = useTranslation();
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<UsernameValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Refs for cleanup and request management
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastValidatedUsername = useRef<string>('');
  const validationCache = useRef<Map<string, UsernameValidationResult>>(new Map());

  // Debounced validation with proper cleanup
  const debouncedValidation = useCallback((username: string) => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Cancel existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    timeoutRef.current = setTimeout(async () => {
      const trimmedUsername = username.trim();
      
      // Don't validate if username is too short or same as last validated
      if (trimmedUsername.length < 3) {
        setValidation(null);
        onValidationChange?.(false, []);
        setSuggestions([]);
        lastValidatedUsername.current = '';
        return;
      }

      // Check cache first
      if (validationCache.current.has(trimmedUsername)) {
        const cachedResult = validationCache.current.get(trimmedUsername)!;
        setValidation(cachedResult);
        onValidationChange?.(cachedResult.isValid, cachedResult.errors);
        
        if (!cachedResult.isValid && showSuggestions) {
          const generatedSuggestions = usernameValidationService.generateSuggestions(trimmedUsername);
          setSuggestions(generatedSuggestions);
        } else {
          setSuggestions([]);
        }
        lastValidatedUsername.current = trimmedUsername;
        return;
      }

      // Don't validate if it's the same username we just validated
      if (lastValidatedUsername.current === trimmedUsername) {
        return;
      }

      setIsValidating(true);
      
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      try {
        const result = await usernameValidationService.checkUsername(trimmedUsername, abortControllerRef.current.signal);
        
        // Only update if this is still the current username
        if (value === trimmedUsername) {
          setValidation(result);
          onValidationChange?.(result.isValid, result.errors);
          
          // Cache the result
          validationCache.current.set(trimmedUsername, result);
          
          if (!result.isValid && showSuggestions) {
            const generatedSuggestions = usernameValidationService.generateSuggestions(trimmedUsername);
            setSuggestions(generatedSuggestions);
          } else {
            setSuggestions([]);
          }
          
          lastValidatedUsername.current = trimmedUsername;
        }
      } catch (error: any) {
        // Only handle error if it's not an abort error
        if (error.name !== 'AbortError' && value === trimmedUsername) {
          console.error('Username validation error:', error);
          const errorResult: UsernameValidationResult = {
            isValid: false,
            isAvailable: false,
            username: trimmedUsername,
            errors: [t('auth.validation.errorCheckingUsername')],
            suggestions: []
          };
          setValidation(errorResult);
          onValidationChange?.(false, errorResult.errors);
        }
      } finally {
        if (value === trimmedUsername) {
          setIsValidating(false);
        }
      }
    }, debounceMs);
  }, [onValidationChange, showSuggestions, debounceMs, value]);

  // Client-side format validation
  const formatValidation = usernameValidationService.validateUsernameFormat(value);

  useEffect(() => {
    if (value.trim().length > 0) {
      setShowValidation(true);
      debouncedValidation(value);
    } else {
      setShowValidation(false);
      setValidation(null);
      setSuggestions([]);
    }
  }, [value, debouncedValidation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toLowerCase(); // Convert to lowercase
    onChange(newValue);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setSuggestions([]);
  };

  const getInputClassName = () => {
    let baseClass = `w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${className}`;
    
    if (disabled) {
      baseClass += ' bg-gray-100 cursor-not-allowed';
    } else if (showValidation && validation) {
      if (validation.isValid) {
        baseClass += ' border-green-300 bg-green-50';
      } else {
        baseClass += ' border-red-300 bg-red-50';
      }
    } else if (showValidation && !validation && value.trim().length >= 3) {
      baseClass += ' border-yellow-300 bg-yellow-50';
    } else {
      baseClass += ' border-gray-300';
    }

    return baseClass;
  };

  const getStatusIcon = () => {
    if (isValidating) {
      return (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
        </div>
      );
    }

    if (showValidation && validation) {
      if (validation.isValid) {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        );
      } else {
        return (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      }
    }

    return null;
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClassName()}
          maxLength={30}
        />
        {getStatusIcon()}
      </div>

      {/* Format validation errors */}
      {showValidation && !formatValidation.isValid && (
        <div className="mt-1 text-sm text-red-600">
          {formatValidation.errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}

      {/* Server validation results */}
      {showValidation && validation && (
        <div className="mt-2">
          {validation.isValid ? (
            <div className="text-sm text-green-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {t('auth.validation.usernameIsAvailable')}
            </div>
          ) : (
            <div className="text-sm text-red-600">
              {validation.errors.map((error, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="mt-2">
          <div className="text-sm text-gray-600 mb-1">{t('auth.validation.trySuggestions')}</div>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200 transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Username rules */}
      <div className="mt-2 text-xs text-gray-500">
        <div>{t('auth.validation.usernameRules')}</div>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li>{t('auth.validation.rule3to30chars')}</li>
          <li>{t('auth.validation.ruleLowercaseOnly')}</li>
          <li>{t('auth.validation.ruleNoDotStartEnd')}</li>
          <li>{t('auth.validation.ruleNoConsecutiveDots')}</li>
        </ul>
      </div>
    </div>
  );
};

export default UsernameInput;
