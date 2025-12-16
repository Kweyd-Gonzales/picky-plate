// src/hooks/usePreferenceConflicts.js
// Hook for managing food preference conflicts with smart mutual exclusion

import { useState, useCallback, useMemo } from 'react';
import {
  DIET_HIERARCHY,
  RELIGIOUS_RULES,
  ALLERGEN_HIERARCHY,
  checkDietConflicts,
  checkReligiousCuisineConflicts,
  checkAllergenCuisineConflicts,
  getAllergenWithIncludes,
  validateAllSelections,
} from '../utils/preferenceRules';

/**
 * Hook for managing food preferences with conflict detection
 * Implements smart mutual exclusion and warning systems
 */
export function usePreferenceConflicts(initialSelections = {}) {
  // Main selections state
  const [selections, setSelections] = useState({
    restrictions: initialSelections.restrictions || [],      // Allergens + medical + religious
    allergens: initialSelections.allergens || [],            // Specific allergens
    diet: initialSelections.diet || null,                    // Single diet selection
    dislikes: initialSelections.dislikes || [],              // Food dislikes
    cuisines: initialSelections.cuisines || [],              // Preferred cuisines
    strictnessLevels: initialSelections.strictnessLevels || {}, // { halal: "strict", kosher: "moderate" }
  });

  // Calculate disabled options based on current selections
  const disabledOptions = useMemo(() => {
    const disabled = {
      diets: [],
      dislikes: [],
      cuisines: [],
    };

    // If a diet is selected, disable conflicting diets
    if (selections.diet) {
      const dietRules = DIET_HIERARCHY[selections.diet];
      if (dietRules?.disables) {
        disabled.diets = [...dietRules.disables];
      }
    }

    // If pescatarian and seafood is disliked, show as disabled option
    if (selections.diet === 'pescatarian') {
      // Seafood should show warning, not be disabled
    }

    return disabled;
  }, [selections.diet]);

  // Calculate warnings based on current selections
  const warnings = useMemo(() => {
    const allWarnings = [];

    // Diet + dislike warnings
    if (selections.diet && selections.dislikes.length > 0) {
      const conflicts = checkDietConflicts(
        selections.diet,
        selections.dislikes,
        selections.cuisines
      );
      allWarnings.push(...conflicts.warnings);
    }

    // Diet + cuisine warnings (keto + italian, etc.)
    if (selections.diet && selections.cuisines.length > 0) {
      const dietRules = DIET_HIERARCHY[selections.diet];
      if (dietRules?.warns) {
        const conflictingCuisines = selections.cuisines.filter(c => dietRules.warns.includes(c));
        if (conflictingCuisines.length > 0) {
          allWarnings.push({
            type: 'diet-cuisine',
            message: dietRules.warnMessage || `${dietRules.label} may have limited options in ${conflictingCuisines.join(', ')} cuisine.`,
            diet: selections.diet,
            cuisines: conflictingCuisines,
          });
        }
      }
    }

    // Religious + cuisine warnings
    const religiousRestrictions = selections.restrictions
      .filter(r => RELIGIOUS_RULES[r])
      .map(r => ({
        id: r,
        strictness: selections.strictnessLevels[r] || 'moderate'
      }));

    if (religiousRestrictions.length > 0 && selections.cuisines.length > 0) {
      const religiousWarnings = checkReligiousCuisineConflicts(
        religiousRestrictions,
        selections.cuisines
      );
      allWarnings.push(...religiousWarnings);
    }

    // Allergen + cuisine warnings
    if (selections.allergens.length > 0 && selections.cuisines.length > 0) {
      const allergenWarnings = checkAllergenCuisineConflicts(
        selections.allergens,
        selections.cuisines
      );
      allWarnings.push(...allergenWarnings);
    }

    return allWarnings;
  }, [selections]);

  // Calculate errors (blocking conflicts)
  const errors = useMemo(() => {
    const allErrors = [];

    // Pescatarian + dislikes seafood = error
    if (selections.diet === 'pescatarian' && selections.dislikes.includes('seafood')) {
      allErrors.push({
        type: 'diet-dislike',
        message: 'Pescatarian diet requires seafood. Please choose a different diet or remove seafood from dislikes.',
        diet: 'pescatarian',
        dislike: 'seafood',
      });
    }

    return allErrors;
  }, [selections.diet, selections.dislikes]);

  // Check if a specific option has a warning
  const getWarningForOption = useCallback((category, optionId) => {
    return warnings.find(w => {
      if (category === 'cuisines' && w.cuisines?.includes(optionId)) return true;
      if (category === 'diet' && w.diet === optionId) return true;
      if (category === 'allergen' && w.allergen === optionId) return true;
      return false;
    });
  }, [warnings]);

  // Check if an option is disabled
  const isOptionDisabled = useCallback((category, optionId) => {
    if (category === 'diets') {
      return disabledOptions.diets.includes(optionId);
    }
    return false;
  }, [disabledOptions]);

  // Update a single-select field (diet)
  const updateDiet = useCallback((dietId) => {
    setSelections(prev => {
      // If clicking same diet, deselect
      if (prev.diet === dietId) {
        return { ...prev, diet: null };
      }
      return { ...prev, diet: dietId };
    });
  }, []);

  // Update multi-select fields (toggle)
  const toggleSelection = useCallback((category, optionId) => {
    setSelections(prev => {
      const current = prev[category] || [];
      const isSelected = current.includes(optionId);

      if (isSelected) {
        // Remove
        return {
          ...prev,
          [category]: current.filter(id => id !== optionId)
        };
      } else {
        // Add
        let newSelections = [...current, optionId];

        // If adding an allergen, also add sub-allergens
        if (category === 'allergens') {
          const allergenWithIncludes = getAllergenWithIncludes(optionId);
          newSelections = [...new Set([...current, ...allergenWithIncludes])];
        }

        return {
          ...prev,
          [category]: newSelections
        };
      }
    });
  }, []);

  // Update strictness level for religious restrictions
  const updateStrictness = useCallback((restrictionId, level) => {
    setSelections(prev => ({
      ...prev,
      strictnessLevels: {
        ...prev.strictnessLevels,
        [restrictionId]: level
      }
    }));
  }, []);

  // Add a restriction (allergen, medical, or religious)
  const addRestriction = useCallback((restrictionId) => {
    setSelections(prev => {
      if (prev.restrictions.includes(restrictionId)) return prev;

      // If it's a religious restriction with strictness, set default
      if (RELIGIOUS_RULES[restrictionId]) {
        return {
          ...prev,
          restrictions: [...prev.restrictions, restrictionId],
          strictnessLevels: {
            ...prev.strictnessLevels,
            [restrictionId]: 'moderate' // Default strictness
          }
        };
      }

      // If it's an allergen, also add to allergens array
      if (ALLERGEN_HIERARCHY[restrictionId]) {
        const allergenWithIncludes = getAllergenWithIncludes(restrictionId);
        return {
          ...prev,
          restrictions: [...prev.restrictions, restrictionId],
          allergens: [...new Set([...prev.allergens, ...allergenWithIncludes])]
        };
      }

      return {
        ...prev,
        restrictions: [...prev.restrictions, restrictionId]
      };
    });
  }, []);

  // Remove a restriction
  const removeRestriction = useCallback((restrictionId) => {
    setSelections(prev => {
      const newStrictnessLevels = { ...prev.strictnessLevels };
      delete newStrictnessLevels[restrictionId];

      // If it's an allergen, also remove from allergens array
      let newAllergens = prev.allergens;
      if (ALLERGEN_HIERARCHY[restrictionId]) {
        const allergenWithIncludes = getAllergenWithIncludes(restrictionId);
        newAllergens = prev.allergens.filter(a => !allergenWithIncludes.includes(a));
      }

      return {
        ...prev,
        restrictions: prev.restrictions.filter(r => r !== restrictionId),
        allergens: newAllergens,
        strictnessLevels: newStrictnessLevels
      };
    });
  }, []);

  // Toggle restriction (for simple toggle behavior)
  const toggleRestriction = useCallback((restrictionId) => {
    if (selections.restrictions.includes(restrictionId)) {
      removeRestriction(restrictionId);
    } else {
      addRestriction(restrictionId);
    }
  }, [selections.restrictions, addRestriction, removeRestriction]);

  // Reset all selections
  const resetSelections = useCallback(() => {
    setSelections({
      restrictions: [],
      allergens: [],
      diet: null,
      dislikes: [],
      cuisines: [],
      strictnessLevels: {},
    });
  }, []);

  // Get cuisine warning message if any
  const getCuisineWarning = useCallback((cuisineId) => {
    // Check diet warnings
    if (selections.diet) {
      const dietRules = DIET_HIERARCHY[selections.diet];
      if (dietRules?.warns?.includes(cuisineId)) {
        return {
          type: 'diet',
          message: dietRules.warnMessage || `${dietRules.label} may have limited options in this cuisine.`
        };
      }
    }

    // Check religious warnings
    for (const restrictionId of selections.restrictions) {
      const rules = RELIGIOUS_RULES[restrictionId];
      if (!rules) continue;

      const strictness = selections.strictnessLevels[restrictionId] || 'moderate';
      const strictRules = rules.strictLevels?.[strictness];

      if (strictRules?.cuisineWarnings?.[cuisineId]) {
        return {
          type: 'religious',
          restriction: restrictionId,
          message: strictRules.cuisineWarnings[cuisineId]
        };
      }
    }

    // Check allergen warnings
    for (const allergenId of selections.allergens) {
      const allergen = ALLERGEN_HIERARCHY[allergenId];
      if (allergen?.cuisineWarnings?.[cuisineId]) {
        return {
          type: 'allergen',
          allergen: allergenId,
          message: allergen.cuisineWarnings[cuisineId]
        };
      }
    }

    return null;
  }, [selections]);

  // Get full validation result
  const validation = useMemo(() => {
    return validateAllSelections(selections);
  }, [selections]);

  return {
    // State
    selections,
    disabledOptions,
    warnings,
    errors,
    isValid: errors.length === 0,
    validation,

    // Actions
    updateDiet,
    toggleSelection,
    toggleRestriction,
    addRestriction,
    removeRestriction,
    updateStrictness,
    resetSelections,

    // Helpers
    isOptionDisabled,
    getWarningForOption,
    getCuisineWarning,

    // Direct state setter for complex updates
    setSelections,
  };
}

export default usePreferenceConflicts;
