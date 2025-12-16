// src/utils/groupPreferences.js
// Group preference merging for Barkada Vote feature
// Uses "Least Misery" algorithm - no one should be extremely dissatisfied

import {
  DIET_HIERARCHY,
  RELIGIOUS_RULES,
  ALLERGEN_HIERARCHY,
} from './preferenceRules';

/**
 * Merge multiple users' preferences for group recommendations
 *
 * @param {Array} userPreferences - Array of user preference objects
 * @returns {Object} Merged group preferences with recommendations
 */
export function mergeGroupPreferences(userPreferences) {
  if (!userPreferences || userPreferences.length === 0) {
    return {
      hardConstraints: {
        excludedAllergens: [],
        excludedIngredients: [],
        religiousRequirements: [],
      },
      softConstraints: {
        preferredCuisines: [],
        acceptableCuisines: [],
        avoidDislikes: [],
        dietaryApproach: 'omnivore',
      },
      groupStats: {
        memberCount: 0,
        cuisineAgreement: 0,
        hasIncompatibilities: false,
        incompatibilities: [],
      },
      recommendations: {
        strategy: 'unified',
        message: 'No preferences to merge.',
      },
    };
  }

  const memberCount = userPreferences.length;

  // Collect all hard constraints - these MUST be respected
  const allHardConstraints = {
    allergens: new Set(),
    medicalConditions: new Set(),
    religiousRestrictions: [],
    excludedIngredients: new Set(),
  };

  // Collect soft constraint votes
  const softConstraintVotes = {
    diets: {},
    dislikes: {},
    cuisines: {},
  };

  // Process each user's preferences
  userPreferences.forEach((prefs) => {
    // Aggregate hard constraints (union of all)
    if (prefs.allergens) {
      prefs.allergens.forEach(allergenId => {
        allHardConstraints.allergens.add(allergenId);
        // Add cross-reactive allergens
        const allergen = ALLERGEN_HIERARCHY[allergenId];
        if (allergen?.crossReactive) {
          allergen.crossReactive.forEach(cr => allHardConstraints.allergens.add(cr));
        }
        // Add sub-allergens
        if (allergen?.includes) {
          allergen.includes.forEach(sub => allHardConstraints.allergens.add(sub));
        }
      });
    }

    // Medical conditions
    if (prefs.medicalConditions) {
      prefs.medicalConditions.forEach(condition => {
        allHardConstraints.medicalConditions.add(condition.id || condition);
      });
    }

    // Religious restrictions
    if (prefs.restrictions) {
      prefs.restrictions.forEach(restrictionId => {
        const rules = RELIGIOUS_RULES[restrictionId];
        if (rules) {
          const strictness = prefs.strictnessLevels?.[restrictionId] || 'moderate';
          const strictRules = rules.strictLevels?.[strictness];

          allHardConstraints.religiousRestrictions.push({
            id: restrictionId,
            strictness,
            label: rules.label,
          });

          // Add excluded ingredients
          if (strictRules?.excludeIngredients) {
            strictRules.excludeIngredients.forEach(i =>
              allHardConstraints.excludedIngredients.add(i)
            );
          }
        }
      });
    }

    // Count soft constraint votes
    if (prefs.diet) {
      softConstraintVotes.diets[prefs.diet] = (softConstraintVotes.diets[prefs.diet] || 0) + 1;
    }

    if (prefs.dislikes) {
      prefs.dislikes.forEach(dislike => {
        softConstraintVotes.dislikes[dislike] = (softConstraintVotes.dislikes[dislike] || 0) + 1;
      });
    }

    if (prefs.cuisines) {
      prefs.cuisines.forEach(cuisine => {
        softConstraintVotes.cuisines[cuisine] = (softConstraintVotes.cuisines[cuisine] || 0) + 1;
      });
    }
  });

  // Calculate cuisine scores (percentage who like each)
  const cuisineScores = Object.entries(softConstraintVotes.cuisines)
    .map(([cuisine, votes]) => ({
      cuisine,
      votes,
      score: votes / memberCount,
    }))
    .sort((a, b) => b.score - a.score);

  // Items disliked by majority should be soft-excluded
  const majorityDislikes = Object.entries(softConstraintVotes.dislikes)
    .filter(([_, votes]) => votes > memberCount / 2)
    .map(([dislike]) => dislike);

  // Find most restrictive diet using hierarchy
  const dietPriority = ['vegan', 'vegetarian', 'pescatarian', 'flexitarian', 'omnivore'];
  let mostRestrictiveDiet = 'omnivore';

  for (const diet of dietPriority) {
    if (softConstraintVotes.diets[diet]) {
      mostRestrictiveDiet = diet;
      break;
    }
  }

  // Detect incompatibilities
  const incompatibilities = detectGroupIncompatibilities(userPreferences, softConstraintVotes);

  // Build merged preferences
  return {
    hardConstraints: {
      excludedAllergens: Array.from(allHardConstraints.allergens),
      excludedIngredients: Array.from(allHardConstraints.excludedIngredients),
      religiousRequirements: allHardConstraints.religiousRestrictions,
    },
    softConstraints: {
      preferredCuisines: cuisineScores.filter(c => c.score >= 0.5).map(c => c.cuisine),
      acceptableCuisines: cuisineScores.filter(c => c.score >= 0.25).map(c => c.cuisine),
      avoidDislikes: majorityDislikes,
      dietaryApproach: mostRestrictiveDiet,
    },
    groupStats: {
      memberCount,
      cuisineAgreement: cuisineScores[0]?.score || 0,
      hasIncompatibilities: incompatibilities.length > 0,
      incompatibilities,
      dietDistribution: softConstraintVotes.diets,
      topCuisines: cuisineScores.slice(0, 5),
    },
    recommendations: generateGroupRecommendations(
      incompatibilities,
      cuisineScores,
      mostRestrictiveDiet,
      memberCount
    ),
  };
}

/**
 * Detect incompatibilities within a group
 */
function detectGroupIncompatibilities(userPreferences, votes) {
  const incompatibilities = [];

  // Check for vegan + meat-requiring member
  const hasVegan = votes.diets?.vegan > 0;
  const hasOmnivore = votes.diets?.omnivore > 0;
  const hasPaleo = votes.diets?.paleo > 0;

  if (hasVegan && (hasOmnivore || hasPaleo)) {
    incompatibilities.push({
      type: 'diet-conflict',
      severity: 'info',
      message: 'Group includes vegan and meat-eating members. Consider restaurants with diverse menus.',
    });
  }

  // Check for opposing religious requirements
  const hasHalal = userPreferences.some(p => p.restrictions?.includes('halal'));
  const hasKosher = userPreferences.some(p => p.restrictions?.includes('kosher'));

  if (hasHalal && hasKosher) {
    incompatibilities.push({
      type: 'religious-combo',
      severity: 'info',
      message: 'Group includes both Halal and Kosher requirements. Some restaurants may accommodate both, or consider separate options.',
    });
  }

  // Check for pescatarian + seafood dislike
  const hasPescatarian = votes.diets?.pescatarian > 0;
  const dislikesSeafood = votes.dislikes?.seafood > 0;

  if (hasPescatarian && dislikesSeafood) {
    incompatibilities.push({
      type: 'diet-dislike-conflict',
      severity: 'warning',
      message: 'A pescatarian member may have limited options since others dislike seafood.',
    });
  }

  // Check for severe allergen + cuisine mismatch
  // E.g., peanut allergy and most members want Thai food
  const peanutAllergy = userPreferences.some(p => p.allergens?.includes('peanuts'));
  const thaiPopular = (votes.cuisines?.thai || 0) >= userPreferences.length * 0.5;

  if (peanutAllergy && thaiPopular) {
    incompatibilities.push({
      type: 'allergen-cuisine-conflict',
      severity: 'warning',
      message: 'Thai cuisine is popular but contains peanuts frequently. Please inform the restaurant about the peanut allergy.',
    });
  }

  return incompatibilities;
}

/**
 * Generate recommendations for the group
 */
function generateGroupRecommendations(incompatibilities, cuisineScores, diet, memberCount) {
  const hasSerious = incompatibilities.some(i => i.severity === 'warning');
  const hasIncompat = incompatibilities.length > 0;

  let strategy = 'unified';
  let message = '';
  const suggestions = [];

  if (hasSerious) {
    strategy = 'diverse-menu';
    message = 'Your group has some dietary differences. We recommend restaurants with varied menus that can accommodate everyone.';
    suggestions.push('Look for restaurants with separate vegan/vegetarian sections');
    suggestions.push('Consider family-style restaurants where everyone can order independently');
  } else if (hasIncompat) {
    strategy = 'flexible';
    message = 'Your group has minor dietary differences but should be able to share most meals.';
    suggestions.push('Choose cuisines with good variety');
  } else if (cuisineScores.length > 0 && cuisineScores[0].score >= 0.75) {
    strategy = 'unified';
    message = `Great news! ${Math.round(cuisineScores[0].score * 100)}% of your group loves ${cuisineScores[0].cuisine} cuisine. Perfect for sharing!`;
    suggestions.push(`Try ${cuisineScores[0].cuisine} restaurants`);
  } else if (memberCount > 1) {
    strategy = 'balanced';
    message = 'Your group can easily share meals together with some variety.';
    if (cuisineScores.length >= 2) {
      suggestions.push(`Consider ${cuisineScores[0].cuisine} or ${cuisineScores[1].cuisine} restaurants`);
    }
  } else {
    message = 'Preferences recorded! We\'ll find perfect matches for you.';
  }

  return {
    strategy,
    message,
    suggestions,
    topCuisine: cuisineScores[0]?.cuisine || null,
    cuisineAgreementPercent: cuisineScores[0] ? Math.round(cuisineScores[0].score * 100) : 0,
  };
}

/**
 * Calculate compatibility score between two users
 *
 * @param {Object} user1Prefs - First user's preferences
 * @param {Object} user2Prefs - Second user's preferences
 * @returns {number} Compatibility score 0-100
 */
export function calculateCompatibility(user1Prefs, user2Prefs) {
  let score = 100;
  const penalties = [];

  // Check diet compatibility
  const diet1 = user1Prefs.diet;
  const diet2 = user2Prefs.diet;

  if (diet1 && diet2) {
    const incompatiblePairs = [
      ['vegan', 'paleo'],
      ['vegan', 'keto'],
      ['vegetarian', 'paleo'],
    ];

    const isIncompatible = incompatiblePairs.some(
      pair => (pair.includes(diet1) && pair.includes(diet2)) && diet1 !== diet2
    );

    if (isIncompatible) {
      score -= 30;
      penalties.push({ type: 'diet', penalty: 30, reason: `${diet1} and ${diet2} may conflict` });
    }
  }

  // Check cuisine overlap
  const cuisines1 = new Set(user1Prefs.cuisines || []);
  const cuisines2 = new Set(user2Prefs.cuisines || []);
  const commonCuisines = [...cuisines1].filter(c => cuisines2.has(c));
  const totalCuisines = new Set([...cuisines1, ...cuisines2]).size;

  if (totalCuisines > 0) {
    const cuisineOverlap = commonCuisines.length / totalCuisines;
    if (cuisineOverlap < 0.3) {
      score -= 20;
      penalties.push({ type: 'cuisine', penalty: 20, reason: 'Limited cuisine overlap' });
    }
  }

  // Check for conflicting allergens/dislikes
  const allergens1 = new Set(user1Prefs.allergens || []);
  const allergens2 = new Set(user2Prefs.allergens || []);
  const dislikes1 = new Set(user1Prefs.dislikes || []);
  const dislikes2 = new Set(user2Prefs.dislikes || []);

  // If one person dislikes what another requires...
  // E.g., pescatarian (needs seafood) + other dislikes seafood
  if (user1Prefs.diet === 'pescatarian' && dislikes2.has('seafood')) {
    score -= 15;
    penalties.push({ type: 'conflict', penalty: 15, reason: 'Pescatarian vs seafood dislike' });
  }
  if (user2Prefs.diet === 'pescatarian' && dislikes1.has('seafood')) {
    score -= 15;
    penalties.push({ type: 'conflict', penalty: 15, reason: 'Pescatarian vs seafood dislike' });
  }

  return {
    score: Math.max(0, score),
    compatibility: score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low',
    penalties,
    commonCuisines,
  };
}

/**
 * Build AI-ready payload from merged preferences
 *
 * @param {Object} mergedPrefs - Result from mergeGroupPreferences
 * @returns {Object} Payload ready for AI recommendation endpoint
 */
export function buildAIPayload(mergedPrefs, context = {}) {
  return {
    // ABSOLUTE EXCLUSIONS - AI must never recommend these
    absoluteExclusions: {
      ingredients: [...mergedPrefs.hardConstraints.excludedIngredients],
      allergens: [...mergedPrefs.hardConstraints.excludedAllergens],
      mustNotContainTraces: mergedPrefs.hardConstraints.excludedAllergens.filter(
        a => ALLERGEN_HIERARCHY[a]?.severity === 'critical'
      ),
    },

    // STRONG PREFERENCES - Heavy weight in ranking
    strongPreferences: {
      requiredCertifications: mergedPrefs.hardConstraints.religiousRequirements
        .filter(r => {
          const rules = RELIGIOUS_RULES[r.id];
          const strictRules = rules?.strictLevels?.[r.strictness];
          return strictRules?.requiresCertification;
        })
        .map(r => r.id),
      dietaryStyle: mergedPrefs.softConstraints.dietaryApproach,
    },

    // SOFT PREFERENCES - Influence ranking but don't exclude
    softPreferences: {
      preferredCuisines: mergedPrefs.softConstraints.preferredCuisines,
      acceptableCuisines: mergedPrefs.softConstraints.acceptableCuisines,
      avoidIfPossible: mergedPrefs.softConstraints.avoidDislikes,
    },

    // CONTEXT
    context: {
      groupSize: mergedPrefs.groupStats.memberCount,
      strategy: mergedPrefs.recommendations.strategy,
      ...context,
    },

    // METADATA
    meta: {
      hasIncompatibilities: mergedPrefs.groupStats.hasIncompatibilities,
      cuisineAgreement: mergedPrefs.groupStats.cuisineAgreement,
    },
  };
}

export default {
  mergeGroupPreferences,
  calculateCompatibility,
  buildAIPayload,
};
