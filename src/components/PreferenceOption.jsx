// src/components/PreferenceOption.jsx
// Preference option card with disabled/warning states for onboarding

import React from 'react';
import { Check, X, AlertTriangle, Info } from 'lucide-react';

/**
 * PreferenceOption - A selectable option card for food preferences
 *
 * @param {Object} option - The option data { id, name, image, icon, description }
 * @param {boolean} isSelected - Whether this option is currently selected
 * @param {boolean} isDisabled - Whether this option is disabled due to conflicts
 * @param {Object|null} warning - Warning object { message } if there's a warning
 * @param {Function} onSelect - Callback when option is clicked
 * @param {'positive'|'negative'} selectionType - Type of selection (yellow check or red X)
 * @param {string} disabledReason - Reason why option is disabled
 */
export function PreferenceOption({
  option,
  isSelected = false,
  isDisabled = false,
  warning = null,
  onSelect,
  selectionType = 'positive',
  disabledReason = 'Conflicts with your selections',
}) {
  const handleClick = () => {
    if (!isDisabled && onSelect) {
      onSelect(option.id);
    }
  };

  // Determine border/background colors based on state
  const getStateStyles = () => {
    if (isDisabled) {
      return 'preference-option-disabled';
    }
    if (isSelected) {
      return selectionType === 'positive'
        ? 'preference-option-selected-yellow'
        : 'preference-option-selected-red';
    }
    if (warning) {
      return 'preference-option-warning-state';
    }
    return '';
  };

  return (
    <div
      onClick={handleClick}
      className={`preference-option ${getStateStyles()}`}
      title={isDisabled ? disabledReason : warning?.message || ''}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-disabled={isDisabled}
      aria-selected={isSelected}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {/* Image or Icon */}
      {option.image ? (
        <img
          src={option.image}
          alt={option.name}
          className={`preference-option-image ${isDisabled ? 'preference-option-image-disabled' : ''}`}
          loading="lazy"
        />
      ) : option.icon ? (
        <div className={`preference-option-icon-container ${isDisabled ? 'preference-option-icon-disabled' : ''}`}>
          <span className="preference-option-emoji">{option.icon}</span>
        </div>
      ) : null}

      {/* Overlay with name and description */}
      <div className="preference-option-overlay">
        <span className="preference-option-name">{option.name}</span>
        {option.description && (
          <span className="preference-option-description">{option.description}</span>
        )}
      </div>

      {/* Selection indicator */}
      {isSelected && !isDisabled && (
        <div className={`preference-option-check ${selectionType === 'positive' ? 'preference-option-check-yellow' : 'preference-option-check-red'}`}>
          {selectionType === 'positive' ? (
            <svg className="preference-option-check-icon" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <X className="preference-option-check-icon" />
          )}
        </div>
      )}

      {/* Disabled overlay */}
      {isDisabled && (
        <div className="preference-option-disabled-overlay">
          <AlertTriangle className="preference-option-disabled-icon" />
          <span className="preference-option-disabled-text">Conflict</span>
        </div>
      )}

      {/* Warning indicator (shows only when not selected and not disabled) */}
      {warning && !isDisabled && !isSelected && (
        <div className="preference-option-warning-badge" title={warning.message}>
          <Info className="preference-option-warning-icon" />
        </div>
      )}

      {/* Warning indicator when selected */}
      {warning && isSelected && !isDisabled && (
        <div className="preference-option-warning-selected" title={warning.message}>
          <AlertTriangle className="preference-option-warning-selected-icon" />
        </div>
      )}
    </div>
  );
}

/**
 * PreferenceOptionGrid - Grid container for preference options
 */
export function PreferenceOptionGrid({ children, columns = 4 }) {
  return (
    <div
      className="preference-option-grid"
      style={{
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * WarningBanner - Displays warnings about current selections
 */
export function WarningBanner({ warnings = [] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="preference-warning-banner">
      {warnings.map((warning, index) => (
        <div key={index} className="preference-warning-item">
          <AlertTriangle className="preference-warning-item-icon" />
          <span className="preference-warning-item-text">{warning.message}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * ErrorBanner - Displays errors that must be resolved
 */
export function ErrorBanner({ errors = [] }) {
  if (errors.length === 0) return null;

  return (
    <div className="preference-error-banner">
      {errors.map((error, index) => (
        <div key={index} className="preference-error-item">
          <X className="preference-error-item-icon" />
          <span className="preference-error-item-text">{error.message}</span>
        </div>
      ))}
    </div>
  );
}

export default PreferenceOption;
