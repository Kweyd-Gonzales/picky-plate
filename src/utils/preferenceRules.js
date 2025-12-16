// src/utils/preferenceRules.js
// Food Preference & Dietary Restriction Rules with Conflict Detection

/**
 * Priority Hierarchy (higher = more important):
 * 1. LIFE-THREATENING ALLERGIES (absolute block, zero tolerance)
 * 2. MEDICAL CONDITIONS (celiac, PKU - block with no override)
 * 3. RELIGIOUS RESTRICTIONS (halal, kosher - strong filter)
 * 4. INTOLERANCES (warning with possible override)
 * 5. LIFESTYLE DIETS (vegan, keto - soft filter)
 * 6. PREFERENCES/DISLIKES (affect ranking only)
 * 7. CUISINE PREFERENCES (lowest priority, flexible)
 */

// Diet Mutual Exclusion Rules - Only ONE primary diet allowed
export const DIET_HIERARCHY = {
  vegan: {
    label: "Vegan",
    description: "No animal products",
    includes: ["vegetarian-benefits"],
    excludes: ["omnivore", "flexitarian", "pescatarian", "vegetarian", "keto", "paleo"],
    disables: ["omnivore", "flexitarian", "pescatarian", "vegetarian", "keto", "paleo"],
    warns: [],
    // WARNING when combined with "dislikes vegetables"
    warnsWith: {
      dislike: "vegetables",
      action: "warning",
      message: "Vegan diet is entirely plant-based. Disliking all vegetables may leave you with very limited options. Consider specifying which vegetables you dislike instead."
    },
  },
  vegetarian: {
    label: "Vegetarian",
    description: "No meat or fish",
    includes: [],
    excludes: ["vegan", "omnivore", "flexitarian", "pescatarian", "paleo"],
    disables: ["vegan", "omnivore", "flexitarian", "pescatarian", "paleo"],
    warns: [],
    // WARNING when combined with "dislikes vegetables"
    warnsWith: {
      dislike: "vegetables",
      action: "warning",
      message: "Vegetarian diet relies heavily on vegetables. Disliking all vegetables may leave you with limited options. Consider specifying which vegetables you dislike instead."
    },
  },
  pescatarian: {
    label: "Pescatarian",
    description: "Vegetarian + seafood",
    includes: [],
    excludes: ["vegan", "vegetarian", "omnivore", "flexitarian", "paleo"],
    disables: ["vegan", "vegetarian", "omnivore", "flexitarian", "paleo"],
    // ERROR when combined with "dislikes seafood" - logical impossibility
    conflictsWith: { dislike: "seafood", action: "error", message: "Pescatarian diet requires seafood. Please choose a different diet or remove seafood from dislikes." },
    warns: [],
  },
  flexitarian: {
    label: "Flexitarian",
    description: "Mostly plant-based, occasional meat",
    includes: [],
    excludes: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    disables: ["vegan", "vegetarian", "pescatarian", "omnivore"],
    warns: [],
  },
  omnivore: {
    label: "Omnivore",
    description: "I eat everything",
    includes: [],
    excludes: ["vegan", "vegetarian", "pescatarian", "flexitarian"],
    disables: ["vegan", "vegetarian", "pescatarian", "flexitarian"],
    warns: [],
  },
  keto: {
    label: "Keto",
    description: "Low carb, high fat",
    includes: [],
    excludes: ["vegan", "low-carb"], // Can combine with meat-based diets
    disables: ["vegan"],
    warns: ["italian", "japanese", "chinese", "mexican", "filipino", "korean"], // Carb-heavy cuisines
    warnMessage: "This cuisine is typically high in carbs. We'll find keto-friendly options, but variety may be limited.",
  },
  "low-carb": {
    label: "Low Carb",
    description: "Reduced carbohydrates",
    includes: [],
    excludes: ["keto"],
    disables: ["keto"],
    warns: ["italian", "japanese", "chinese", "mexican"],
    warnMessage: "This cuisine is typically high in carbs.",
  },
  paleo: {
    label: "Paleo",
    description: "No grains, dairy, processed foods",
    includes: [],
    excludes: ["vegan", "vegetarian", "pescatarian"],
    disables: ["vegan", "vegetarian", "pescatarian"],
    warns: ["italian"], // Heavy on grains/dairy
  },
};

// Religious Dietary Rules with Strictness Levels
export const RELIGIOUS_RULES = {
  halal: {
    label: "Halal",
    icon: "☪️",
    hasStrictness: true,
    strictLevels: {
      strict: {
        id: "strict",
        label: "Strict Halal (Zabiha)",
        description: "Requires halal certification, no alcohol in any form",
        excludeIngredients: [
          "pork", "bacon", "ham", "lard", "gelatin-pork",
          "alcohol", "wine", "beer", "rum", "mirin", "vanilla-extract-alcohol",
          "non-halal-meat", "blood", "carrion"
        ],
        seafoodRule: "fish-only", // Hanafi school
        requiresCertification: true,
        cuisineWarnings: {
          chinese: "Many Chinese dishes use pork or alcohol in cooking. Look for halal-certified restaurants.",
          filipino: "Filipino cuisine is pork-heavy. Limited halal options available.",
          japanese: "Mirin (alcohol) is common in Japanese cooking. Request dishes without mirin.",
          italian: "Wine is often used in sauces. Verify preparation method.",
          korean: "Some dishes contain pork. Look for halal Korean restaurants.",
          thai: "Fish sauce is halal, but verify meat sources.",
        }
      },
      moderate: {
        id: "moderate",
        label: "Moderate Halal",
        description: "People of the Book meat acceptable, avoids obvious pork/alcohol",
        excludeIngredients: ["pork", "bacon", "ham", "lard", "alcohol-visible"],
        seafoodRule: "all-seafood", // Non-Hanafi schools
        requiresCertification: false,
        cuisineWarnings: {
          chinese: "Avoid dishes with obvious pork.",
          filipino: "Many dishes contain pork. Choose carefully.",
        }
      },
      flexible: {
        id: "flexible",
        label: "Halal-Preferring",
        description: "Prefers halal when available, not strictly required",
        excludeIngredients: ["pork"],
        isPreference: true,
        requiresCertification: false,
        cuisineWarnings: {}
      }
    }
  },

  kosher: {
    label: "Kosher",
    icon: "✡️",
    hasStrictness: true,
    strictLevels: {
      strict: {
        id: "strict",
        label: "Glatt Kosher / Mehadrin",
        description: "Strictest standards, 6hr meat-dairy separation",
        excludeIngredients: [
          "pork", "shellfish", "non-kosher-fish",
          "meat-dairy-combo", "non-kosher-gelatin"
        ],
        separateMeatDairy: true,
        waitTimeMeatToDairy: 6,
        requiresCertification: "glatt",
        cuisineWarnings: {
          italian: "Many dishes combine meat and cheese. Kosher Italian options are limited.",
          mexican: "Cheese and meat combos are common. Request separate.",
          american: "Cheeseburgers and similar combos not permitted.",
        }
      },
      moderate: {
        id: "moderate",
        label: "Standard Kosher",
        description: "OU/OK certification accepted, 3hr wait",
        excludeIngredients: ["pork", "shellfish"],
        separateMeatDairy: true,
        waitTimeMeatToDairy: 3,
        requiresCertification: "standard",
        cuisineWarnings: {
          italian: "Verify meat-dairy separation.",
        }
      },
      flexible: {
        id: "flexible",
        label: "Kosher-Style",
        description: "Avoids pork and shellfish, no certification needed",
        excludeIngredients: ["pork", "shellfish"],
        separateMeatDairy: false,
        requiresCertification: false,
        cuisineWarnings: {}
      }
    }
  },

  "hindu-veg": {
    label: "Hindu Vegetarian",
    icon: "🕉️",
    hasStrictness: true,
    strictLevels: {
      strict: {
        id: "strict",
        label: "Sattvic (Pure Vegetarian)",
        description: "No meat, eggs, onion, or garlic",
        excludeIngredients: [
          "beef", "meat", "chicken", "fish", "eggs",
          "onion", "garlic", "leeks", "shallots"
        ],
        isVegetarian: true,
        cuisineWarnings: {
          indian: "Request sattvic preparation (no onion/garlic).",
          chinese: "Most dishes contain onion/garlic.",
          korean: "Kimchi and many dishes contain garlic.",
        }
      },
      moderate: {
        id: "moderate",
        label: "Hindu Vegetarian",
        description: "No beef or meat, eggs may be okay",
        excludeIngredients: ["beef", "meat", "pork"],
        cuisineWarnings: {}
      }
    }
  }
};

// Allergen Hierarchy with Auto-Selection
export const ALLERGEN_HIERARCHY = {
  "tree-nuts": {
    label: "Tree Nut Allergy",
    icon: "🌰",
    severity: "critical",
    includes: ["almonds", "cashews", "walnuts", "pecans", "pistachios", "macadamia", "brazil-nuts", "hazelnuts"],
    crossReactive: ["peanuts"],
    crossReactiveWarning: "Many people allergic to tree nuts are also allergic to peanuts.",
  },
  peanuts: {
    label: "Peanut Allergy",
    icon: "🥜",
    severity: "critical",
    includes: [],
    crossReactive: ["tree-nuts"],
    crossReactiveWarning: "Many people allergic to peanuts are also allergic to tree nuts.",
    cuisineWarnings: {
      thai: "Thai cuisine frequently uses peanuts. Inform restaurant of allergy.",
      vietnamese: "Peanuts common in many dishes.",
      chinese: "Many dishes contain peanuts or peanut oil.",
    }
  },
  dairy: {
    label: "Dairy Allergy",
    icon: "🥛",
    severity: "critical",
    includes: ["milk", "cheese", "butter", "cream", "whey", "casein"],
    cuisineWarnings: {
      italian: "Dairy is central to Italian cuisine (cheese, cream sauces).",
      indian: "Many dishes use ghee, paneer, or cream.",
      american: "Cheese and butter are very common.",
    }
  },
  eggs: {
    label: "Egg Allergy",
    icon: "🥚",
    severity: "critical",
    includes: [],
    cuisineWarnings: {
      japanese: "Eggs common in many dishes (tamago, ramen, etc.).",
      american: "Many baked goods and breakfast items contain eggs.",
    }
  },
  shellfish: {
    label: "Shellfish Allergy",
    icon: "🦐",
    severity: "critical",
    includes: ["shrimp", "crab", "lobster", "crawfish", "prawns", "scallops", "oysters", "clams", "mussels"],
    separateFrom: ["fish"],
    cuisineWarnings: {
      chinese: "Shellfish is common. Inform restaurant of allergy.",
      thai: "Shrimp paste used in many dishes.",
      japanese: "Many dishes contain shellfish.",
    }
  },
  fish: {
    label: "Fish Allergy",
    icon: "🐟",
    severity: "critical",
    includes: ["salmon", "tuna", "cod", "tilapia", "anchovies", "sardines"],
    separateFrom: ["shellfish"],
    cuisineWarnings: {
      japanese: "Fish is central to Japanese cuisine.",
      thai: "Fish sauce is used in almost everything.",
      vietnamese: "Fish sauce is a key ingredient.",
    }
  },
  wheat: {
    label: "Wheat Allergy",
    icon: "🌾",
    severity: "critical",
    includes: ["bread", "pasta", "flour", "couscous"],
    note: "Different from gluten intolerance/celiac.",
  },
  soy: {
    label: "Soy Allergy",
    icon: "🫘",
    severity: "critical",
    includes: ["tofu", "soy-sauce", "edamame", "miso", "tempeh"],
    cuisineWarnings: {
      japanese: "Soy sauce is in almost everything.",
      chinese: "Soy sauce and tofu are very common.",
      korean: "Soy sauce and soybean paste are staples.",
    }
  },
  sesame: {
    label: "Sesame Allergy",
    icon: "⚪",
    severity: "critical",
    includes: ["sesame-oil", "tahini", "sesame-seeds"],
    cuisineWarnings: {
      "middle-eastern": "Tahini and sesame are very common.",
      japanese: "Sesame oil and seeds used frequently.",
      korean: "Sesame oil is a staple.",
    }
  },
  gluten: {
    label: "Gluten Intolerance",
    icon: "🌾❌",
    severity: "high",
    includes: ["wheat", "barley", "rye", "malt", "semolina", "spelt"],
    cuisineWarnings: {
      italian: "Pasta and bread are central. Look for gluten-free options.",
      japanese: "Soy sauce contains gluten. Request tamari instead.",
      chinese: "Many sauces contain gluten.",
    }
  },
  lactose: {
    label: "Lactose Intolerance",
    icon: "🥛❌",
    severity: "medium",
    toleranceGrams: 12,
    safeVariants: ["hard-cheese", "aged-cheese", "greek-yogurt", "lactose-free-milk"],
    note: "Most people can tolerate up to 12g per serving. Hard/aged cheeses have less lactose.",
  }
};

// Medical Conditions (Non-negotiable)
export const MEDICAL_CONDITIONS = {
  celiac: {
    label: "Celiac Disease",
    icon: "🚫🌾",
    severity: "critical",
    excludeIngredients: ["wheat", "barley", "rye", "malt", "brewer's-yeast", "semolina", "spelt", "triticale"],
    excludeTraces: true,
    neverOverride: true,
    note: "Even trace amounts can cause damage. Cross-contamination is a concern.",
  },
  diabetes: {
    label: "Diabetic",
    icon: "💉",
    severity: "high",
    watchFor: ["sugar", "high-carb"],
    preferLowGI: true,
    note: "Monitor carbohydrate and sugar intake.",
  },
  pku: {
    label: "Phenylketonuria (PKU)",
    icon: "⚕️",
    severity: "critical",
    excludeIngredients: ["phenylalanine", "aspartame", "high-protein"],
    neverOverride: true,
  }
};

// Dislike vs Diet Conflict Rules
export const DISLIKE_DIET_CONFLICTS = [
  {
    diet: "pescatarian",
    dislike: "seafood",
    action: "error",
    message: "Pescatarian diet relies on seafood. Please choose a different diet or remove seafood from dislikes."
  },
  {
    diet: "vegetarian",
    dislike: "vegetables",
    action: "warning",
    message: "Vegetarian diet is primarily plant-based. Consider if this diet fits your preferences."
  },
  {
    diet: "vegan",
    dislike: "vegetables",
    action: "warning",
    message: "Vegan diet is entirely plant-based. This combination may be very limiting."
  },
  {
    diet: "keto",
    cuisines: ["italian", "japanese", "mexican", "chinese", "filipino"],
    action: "warning",
    message: "These cuisines are typically high-carb. We'll find keto-friendly options, but variety may be limited."
  }
];

// Cuisine Tags for Conflict Detection
export const CUISINE_TAGS = {
  filipino: {
    tags: ["pork-heavy", "rice-based"],
    warnings: { halal: "high", kosher: "medium" }
  },
  japanese: {
    tags: ["rice-based", "seafood", "uses-mirin", "soy-heavy"],
    warnings: { halal: "medium", soy: "high", gluten: "high" }
  },
  korean: {
    tags: ["fermented", "spicy", "rice-based", "soy-heavy"],
    warnings: { soy: "high", gluten: "medium" }
  },
  chinese: {
    tags: ["pork-common", "soy-heavy", "rice-based"],
    warnings: { halal: "high", soy: "high", peanuts: "medium" }
  },
  italian: {
    tags: ["pasta", "dairy-heavy", "wine-in-cooking", "gluten-heavy"],
    warnings: { dairy: "high", gluten: "high", halal: "medium", keto: "high" }
  },
  mexican: {
    tags: ["corn-based", "cheese-heavy", "spicy"],
    warnings: { dairy: "medium" }
  },
  thai: {
    tags: ["peanut-common", "spicy", "fish-sauce"],
    warnings: { peanuts: "high", fish: "high", shellfish: "medium" }
  },
  indian: {
    tags: ["spicy", "dairy-common", "vegetarian-friendly"],
    warnings: { dairy: "medium" }
  },
  american: {
    tags: ["meat-heavy", "dairy-common"],
    warnings: { dairy: "medium" }
  },
  mediterranean: {
    tags: ["olive-oil", "seafood", "vegetable-rich"],
    warnings: {}
  },
  "middle-eastern": {
    tags: ["halal-friendly", "vegetarian-options", "sesame-common"],
    warnings: { sesame: "high" }
  },
  vietnamese: {
    tags: ["fresh", "fish-sauce", "rice-noodles"],
    warnings: { fish: "high" }
  },
};

// Helper function to check diet conflicts
export function checkDietConflicts(selectedDiet, currentDislikes, currentCuisines) {
  const conflicts = { errors: [], warnings: [], disabledDiets: [] };

  if (!selectedDiet) return conflicts;

  const dietRules = DIET_HIERARCHY[selectedDiet];
  if (!dietRules) return conflicts;

  // Get disabled diets
  conflicts.disabledDiets = dietRules.disables || [];

  // Check diet vs dislike conflicts
  if (dietRules.conflictsWith) {
    const { dislike, action } = dietRules.conflictsWith;
    if (currentDislikes.includes(dislike)) {
      const message = `${dietRules.label} diet conflicts with disliking ${dislike}.`;
      if (action === "error") {
        conflicts.errors.push({ type: "diet-dislike", message, diet: selectedDiet, dislike });
      } else {
        conflicts.warnings.push({ type: "diet-dislike", message, diet: selectedDiet, dislike });
      }
    }
  }

  // Check diet vs cuisine warnings
  if (dietRules.warns && dietRules.warns.length > 0) {
    const conflictingCuisines = currentCuisines.filter(c => dietRules.warns.includes(c));
    if (conflictingCuisines.length > 0) {
      conflicts.warnings.push({
        type: "diet-cuisine",
        message: dietRules.warnMessage || `${dietRules.label} may have limited options in ${conflictingCuisines.join(", ")} cuisine.`,
        diet: selectedDiet,
        cuisines: conflictingCuisines
      });
    }
  }

  return conflicts;
}

// Helper function to check religious conflicts with cuisines
export function checkReligiousCuisineConflicts(religiousRestrictions, selectedCuisines) {
  const warnings = [];

  religiousRestrictions.forEach(({ id, strictness = "moderate" }) => {
    const rules = RELIGIOUS_RULES[id];
    if (!rules) return;

    const strictRules = rules.strictLevels?.[strictness];
    if (!strictRules?.cuisineWarnings) return;

    selectedCuisines.forEach(cuisine => {
      if (strictRules.cuisineWarnings[cuisine]) {
        warnings.push({
          type: "religious-cuisine",
          restriction: id,
          strictness,
          cuisine,
          message: strictRules.cuisineWarnings[cuisine],
          severity: "warning"
        });
      }
    });
  });

  return warnings;
}

// Helper function to check allergen conflicts with cuisines
export function checkAllergenCuisineConflicts(allergens, selectedCuisines) {
  const warnings = [];

  allergens.forEach(allergenId => {
    const allergen = ALLERGEN_HIERARCHY[allergenId];
    if (!allergen?.cuisineWarnings) return;

    selectedCuisines.forEach(cuisine => {
      if (allergen.cuisineWarnings[cuisine]) {
        warnings.push({
          type: "allergen-cuisine",
          allergen: allergenId,
          cuisine,
          message: allergen.cuisineWarnings[cuisine],
          severity: "info"
        });
      }
    });
  });

  return warnings;
}

// Get sub-allergens when parent is selected
export function getAllergenWithIncludes(allergenId) {
  const allergen = ALLERGEN_HIERARCHY[allergenId];
  if (!allergen?.includes) return [allergenId];
  return [allergenId, ...allergen.includes];
}

/**
 * BIDIRECTIONAL CONFLICT CHECK
 * Given current dislikes, returns which diets should show warnings/errors
 * This is the reverse of checkDietConflicts - used when selecting diets AFTER dislikes
 */
export function getDietConflictsFromDislikes(currentDislikes) {
  const dietWarnings = {}; // { dietId: { type, message, severity } }
  const dietErrors = {}; // { dietId: { type, message } }

  if (!currentDislikes || currentDislikes.length === 0) {
    return { dietWarnings, dietErrors };
  }

  // Check each diet for conflicts with current dislikes
  Object.entries(DIET_HIERARCHY).forEach(([dietId, dietRules]) => {
    // Check for ERROR conflicts (e.g., pescatarian + seafood dislike)
    if (dietRules.conflictsWith) {
      const { dislike, action, message } = dietRules.conflictsWith;
      if (currentDislikes.includes(dislike)) {
        if (action === 'error') {
          dietErrors[dietId] = {
            type: 'dislike-diet-error',
            message: message || `${dietRules.label} diet conflicts with disliking ${dislike}.`,
            dislike
          };
        }
      }
    }

    // Check for WARNING conflicts (e.g., vegan/vegetarian + vegetables dislike)
    if (dietRules.warnsWith) {
      const { dislike, action, message } = dietRules.warnsWith;
      if (currentDislikes.includes(dislike)) {
        dietWarnings[dietId] = {
          type: 'dislike-diet-warning',
          message: message || `${dietRules.label} may have limited options when you dislike ${dislike}.`,
          dislike,
          severity: action || 'warning'
        };
      }
    }
  });

  // Also check DISLIKE_DIET_CONFLICTS array for additional rules
  DISLIKE_DIET_CONFLICTS.forEach(conflict => {
    if (conflict.dislike && currentDislikes.includes(conflict.dislike)) {
      if (conflict.diet) {
        // Single diet conflict
        if (conflict.action === 'error') {
          dietErrors[conflict.diet] = {
            type: 'dislike-diet-error',
            message: conflict.message,
            dislike: conflict.dislike
          };
        } else {
          dietWarnings[conflict.diet] = {
            type: 'dislike-diet-warning',
            message: conflict.message,
            dislike: conflict.dislike,
            severity: conflict.action || 'warning'
          };
        }
      } else if (conflict.diets) {
        // Multiple diets conflict
        conflict.diets.forEach(dietId => {
          if (conflict.action === 'error') {
            dietErrors[dietId] = {
              type: 'dislike-diet-error',
              message: conflict.message,
              dislike: conflict.dislike
            };
          } else {
            dietWarnings[dietId] = {
              type: 'dislike-diet-warning',
              message: conflict.message,
              dislike: conflict.dislike,
              severity: conflict.action || 'warning'
            };
          }
        });
      }
    }
  });

  return { dietWarnings, dietErrors };
}

// Validate all selections and return errors/warnings
export function validateAllSelections(selections) {
  const errors = [];
  const warnings = [];

  // Check DISLIKE_DIET_CONFLICTS
  DISLIKE_DIET_CONFLICTS.forEach(conflict => {
    // Diet + dislike conflict
    if (conflict.diet && conflict.dislike) {
      if (selections.diet === conflict.diet && selections.dislikes?.includes(conflict.dislike)) {
        if (conflict.action === "error") {
          errors.push({ type: "diet-dislike", message: conflict.message });
        } else {
          warnings.push({ type: "diet-dislike", message: conflict.message });
        }
      }
    }

    // Diet + cuisines conflict
    if (conflict.diet && conflict.cuisines) {
      if (selections.diet === conflict.diet) {
        const matchingCuisines = conflict.cuisines.filter(c => selections.cuisines?.includes(c));
        if (matchingCuisines.length > 0) {
          warnings.push({
            type: "diet-cuisine",
            message: conflict.message,
            cuisines: matchingCuisines
          });
        }
      }
    }
  });

  // Check religious + cuisine conflicts
  if (selections.restrictions?.length > 0 && selections.cuisines?.length > 0) {
    const religiousRestrictions = selections.restrictions
      .filter(r => RELIGIOUS_RULES[r])
      .map(r => ({ id: r, strictness: selections.strictnessLevels?.[r] || "moderate" }));

    const religiousWarnings = checkReligiousCuisineConflicts(religiousRestrictions, selections.cuisines);
    warnings.push(...religiousWarnings);
  }

  // Check allergen + cuisine conflicts
  if (selections.allergens?.length > 0 && selections.cuisines?.length > 0) {
    const allergenWarnings = checkAllergenCuisineConflicts(selections.allergens, selections.cuisines);
    warnings.push(...allergenWarnings);
  }

  return { errors, warnings, isValid: errors.length === 0 };
}

export default {
  DIET_HIERARCHY,
  RELIGIOUS_RULES,
  ALLERGEN_HIERARCHY,
  MEDICAL_CONDITIONS,
  DISLIKE_DIET_CONFLICTS,
  CUISINE_TAGS,
  checkDietConflicts,
  checkReligiousCuisineConflicts,
  checkAllergenCuisineConflicts,
  getAllergenWithIncludes,
  getDietConflictsFromDislikes,
  validateAllSelections,
};
