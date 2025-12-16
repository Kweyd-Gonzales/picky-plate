// src/components/StrictnessSelector.jsx
// Strictness level selector for religious dietary restrictions

import React from 'react';
import { Check } from 'lucide-react';
import { RELIGIOUS_RULES } from '../utils/preferenceRules';

/**
 * StrictnessSelector - Allows users to select their observance level
 * for religious dietary restrictions (Halal, Kosher, Hindu Vegetarian)
 *
 * @param {string} restriction - The restriction ID ('halal', 'kosher', 'hindu-veg')
 * @param {string} value - Current strictness level ('strict', 'moderate', 'flexible')
 * @param {Function} onChange - Callback: (restrictionId, level) => void
 */
export function StrictnessSelector({ restriction, value = 'moderate', onChange }) {
  const rules = RELIGIOUS_RULES[restriction];
  if (!rules || !rules.hasStrictness) return null;

  const levels = rules.strictLevels;
  const levelKeys = Object.keys(levels);

  return (
    <div className="strictness-selector">
      <p className="strictness-label">Select your observance level:</p>
      <div className="strictness-options">
        {levelKeys.map(levelKey => {
          const level = levels[levelKey];
          const isSelected = value === levelKey;

          return (
            <button
              key={levelKey}
              type="button"
              onClick={() => onChange(restriction, levelKey)}
              className={`strictness-option ${isSelected ? 'strictness-option-selected' : ''}`}
            >
              <div className="strictness-option-header">
                <span className="strictness-option-label">{level.label}</span>
                {isSelected && (
                  <div className="strictness-option-check">
                    <Check size={16} />
                  </div>
                )}
              </div>
              <span className="strictness-option-description">{level.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * RestrictionCard - Card showing a selected restriction with strictness selector
 */
export function RestrictionCard({ restriction, strictness, onStrictnessChange, onRemove }) {
  const rules = RELIGIOUS_RULES[restriction];

  if (!rules) {
    // Not a religious restriction, just show simple card
    return (
      <div className="restriction-card">
        <div className="restriction-card-header">
          <span className="restriction-card-name">{restriction}</span>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(restriction)}
              className="restriction-card-remove"
            >
              &times;
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="restriction-card restriction-card-religious">
      <div className="restriction-card-header">
        <span className="restriction-card-icon">{rules.icon}</span>
        <span className="restriction-card-name">{rules.label}</span>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(restriction)}
            className="restriction-card-remove"
          >
            &times;
          </button>
        )}
      </div>

      {rules.hasStrictness && (
        <StrictnessSelector
          restriction={restriction}
          value={strictness || 'moderate'}
          onChange={onStrictnessChange}
        />
      )}
    </div>
  );
}

/**
 * RestrictionSummary - Shows selected restrictions in a compact format
 */
export function RestrictionSummary({ restrictions = [], strictnessLevels = {} }) {
  if (restrictions.length === 0) return null;

  return (
    <div className="restriction-summary">
      {restrictions.map(restrictionId => {
        const rules = RELIGIOUS_RULES[restrictionId];
        const strictness = strictnessLevels[restrictionId];
        const strictnessLabel = rules?.strictLevels?.[strictness]?.label;

        return (
          <div key={restrictionId} className="restriction-summary-item">
            {rules?.icon && <span className="restriction-summary-icon">{rules.icon}</span>}
            <span className="restriction-summary-name">
              {rules?.label || restrictionId}
            </span>
            {strictnessLabel && (
              <span className="restriction-summary-strictness">({strictnessLabel})</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default StrictnessSelector;
