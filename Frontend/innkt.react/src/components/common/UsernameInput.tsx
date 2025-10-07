import React, { useState, useEffect, useCallback } from 'react';
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
  const [isValidating, setIsValidating] = useState(false);
  const [validation, setValidation] = useState<UsernameValidationResult | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Debounced validation
  const debouncedValidation = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (username: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          if (username.trim().length >= 3) {
            setIsValidating(true);
            try {
              const result = await usernameValidationService.checkUsername(username);
              setValidation(result);
              onValidationChange?.(result.isValid, result.errors);
              
              if (!result.isValid && showSuggestions) {
                const generatedSuggestions = usernameValidationService.generateSuggestions(username);
                setSuggestions(generatedSuggestions);
              } else {
                setSuggestions([]);
              }
            } catch (error) {
              console.error('Username validation error:', error);
            } finally {
              setIsValidating(false);
            }
          } else {
            setValidation(null);
            onValidationChange?.(false, []);
            setSuggestions([]);
          }
        }, debounceMs);
      };
    })(),
    [onValidationChange, showSuggestions, debounceMs]
  );

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
              Username is available!
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
          <div className="text-sm text-gray-600 mb-1">Try these suggestions:</div>
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
        <div>Username rules:</div>
        <ul className="list-disc list-inside ml-2 space-y-0.5">
          <li>3-30 characters long</li>
          <li>Lowercase letters, numbers, and dots (.) only</li>
          <li>Cannot start or end with a dot</li>
          <li>Cannot contain consecutive dots</li>
        </ul>
      </div>
    </div>
  );
};

export default UsernameInput;
