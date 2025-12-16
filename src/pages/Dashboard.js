import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Heart, RefreshCw, Users, MessageSquare, Bot, ChefHat, Calendar, MapPin, Utensils, Sparkles, X, Star, Send, Settings, Flame, Salad, Coffee, Cake, Globe, Zap, Pizza, Sandwich, AlertTriangle, Info, Plus } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import LoadingModal from '../components/LoadingModal';
import { useAuth } from "../auth/AuthContext";
import { getCached, setCache, CACHE_KEYS, CACHE_TTL } from '../utils/cache';
import { DIET_HIERARCHY, RELIGIOUS_RULES, getDietConflictsFromDislikes } from '../utils/preferenceRules';
import './Dashboard.css';


// Scattered Elements Component - Memoized to prevent re-renders
const scatteredConfig = [
  { w: 80, h: 80, top: '5%', left: '3%', delay: 0, rot: 15 },
  { w: 60, h: 60, top: '12%', right: '8%', delay: -3, rot: -20 },
  { w: 100, h: 100, top: '25%', left: '85%', delay: -6, rot: 45 },
  { w: 50, h: 50, top: '35%', left: '2%', delay: -9, rot: -35 },
  { w: 70, h: 70, top: '45%', right: '3%', delay: -12, rot: 25 },
  { w: 90, h: 90, top: '55%', left: '5%', delay: -15, rot: -10 },
  { w: 55, h: 55, top: '65%', right: '6%', delay: -18, rot: 50 },
  { w: 75, h: 75, top: '75%', left: '88%', delay: -2, rot: -45 },
  { w: 65, h: 65, top: '82%', left: '4%', delay: -5, rot: 30 },
  { w: 85, h: 85, top: '90%', right: '12%', delay: -8, rot: -25 },
  { w: 45, h: 45, top: '8%', left: '45%', delay: -11, rot: 60, hideMobile: true },
  { w: 70, h: 70, top: '38%', left: '52%', delay: -14, rot: -55, hideMobile: true },
  { w: 55, h: 55, top: '36%', left: '62%', delay: -17, rot: 40, hideMobile: true },
  { w: 65, h: 65, top: '35%', left: '82%', delay: -1, rot: -15, hideMobile: true },
  { w: 60, h: 60, top: '72%', left: '55%', delay: -4, rot: 35, hideMobile: true },
  { w: 50, h: 50, top: '15%', left: '65%', delay: -7, rot: -40, hideMobile: true },
  { w: 95, h: 95, top: '68%', left: '15%', delay: -10, rot: 20, hideMobile: true },
  { w: 50, h: 50, top: '37%', left: '72%', delay: -13, rot: -30, hideMobile: true },
  { w: 72, h: 72, top: '85%', left: '40%', delay: -16, rot: 55, hideMobile: true },
  { w: 58, h: 58, top: '95%', left: '75%', delay: -19, rot: -50, hideMobile: true },
  { w: 65, h: 65, top: '3%', left: '30%', delay: -2.5, rot: 25 },
  { w: 55, h: 55, top: '18%', left: '50%', delay: -5.5, rot: -35 },
  { w: 70, h: 70, top: '28%', left: '40%', delay: -8.5, rot: 15 },
  { w: 48, h: 48, top: '42%', left: '30%', delay: -11.5, rot: -45 },
  { w: 75, h: 75, top: '52%', left: '50%', delay: -14.5, rot: 30 },
  { w: 60, h: 60, top: '62%', left: '70%', delay: -17.5, rot: -20, hideMobile: true },
  { w: 52, h: 52, top: '78%', left: '25%', delay: -3.5, rot: 50, hideMobile: true },
  { w: 68, h: 68, top: '88%', left: '50%', delay: -6.5, rot: -10, hideMobile: true },
  { w: 45, h: 45, top: '10%', left: '75%', delay: -9.5, rot: 40, hideMobile: true },
  { w: 80, h: 80, top: '22%', left: '10%', delay: -12.5, rot: -25, hideMobile: true },
  { w: 55, h: 55, top: '48%', left: '85%', delay: -15.5, rot: 35, hideMobile: true },
  { w: 62, h: 62, top: '58%', left: '25%', delay: -18.5, rot: -40, hideMobile: true },
  { w: 50, h: 50, top: '70%', left: '60%', delay: -1.5, rot: 20, hideMobile: true },
  { w: 72, h: 72, top: '80%', left: '80%', delay: -4.5, rot: -55, hideMobile: true },
  { w: 58, h: 58, top: '92%', left: '30%', delay: -7.5, rot: 45, hideMobile: true },
];

const ScatteredElements = React.memo(() => {
  return (
    <div className="scattered-elements">
      {scatteredConfig.map((el, i) => (
        <div
          key={i}
          className={`scattered-element${el.hideMobile ? ' scattered-element-hide-mobile' : ''}`}
          style={{
            backgroundImage: `url(${process.env.PUBLIC_URL}/images/element.png)`,
            width: el.w,
            height: el.h,
            top: el.top,
            left: el.left,
            right: el.right,
            animationDelay: `${el.delay}s`,
            transform: `rotate(${el.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
});





export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { authHeaders, user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const API = process.env.REACT_APP_API_URL || "http://localhost:4000";

  const activeUserId = (() => {
    try {
      return localStorage.getItem("pap:activeUserId") || "global";
    } catch {
      return "global";
    }
  })();

  const ONB_KEY = useMemo(() => `pap:onboardingDone:${activeUserId}`, [activeUserId]);

  const routeFlag = Boolean(location.state && location.state.showOnboarding);
  const searchParams = new URLSearchParams(location.search || "");
  const qp = (searchParams.get("newUser") || "").toLowerCase();
  const queryFlag = qp === "1" || qp === "true";

  let sessionTrigger = false;
  let forceFlag = false;
  try {
    sessionTrigger = sessionStorage.getItem("pap:onboardingTrigger") === "1";
    forceFlag = localStorage.getItem("pap:onboardingForce") === "1";
  } catch {}

  const cameFromSignup = routeFlag || queryFlag || sessionTrigger;

  // Only show onboarding modal if user is authenticated
  const isAuthenticated = !!user;

  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    // Don't show modal if not authenticated
    if (!isAuthenticated) return false;
    try {
      const alreadyDone = localStorage.getItem(ONB_KEY) === "1";
      if (cameFromSignup && forceFlag) return true;
      return cameFromSignup && !alreadyDone;
    } catch {
      return cameFromSignup;
    }
  });

  // Show modal when user becomes authenticated and came from signup
  useEffect(() => {
    if (isAuthenticated && cameFromSignup) {
      try {
        const alreadyDone = localStorage.getItem(ONB_KEY) === "1";
        if (!alreadyDone || forceFlag) {
          setShowWelcomeModal(true);
        }
      } catch {}
    }
  }, [isAuthenticated, cameFromSignup, forceFlag, ONB_KEY]);

  useEffect(() => {
    // Only clear triggers if user is authenticated
    if (!cameFromSignup || !isAuthenticated) return;
    try {
      sessionStorage.removeItem("pap:onboardingTrigger");
      localStorage.removeItem("pap:onboardingForce");
    } catch {}
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has("newUser")) {
        url.searchParams.delete("newUser");
        const newQuery = url.searchParams.toString();
        const newPath = url.pathname + (newQuery ? `?${newQuery}` : "");
        window.history.replaceState({}, document.title, newPath);
      }
      if (location.state && location.state.showOnboarding) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }
    } catch {}
  }, [cameFromSignup, location.state]);

  useEffect(() => {
    try {
      if (localStorage.getItem(ONB_KEY) === "1") setShowWelcomeModal(false);
    } catch {}
  }, [ONB_KEY]);

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCuisines, setSelectedCuisines] = useState([]);
  const [selectedDislikes, setSelectedDislikes] = useState([]);
  const [selectedDiets, setSelectedDiets] = useState([]);
  const [selectedAllergens, setSelectedAllergens] = useState([]);
  const [savingOnboarding, setSavingOnboarding] = useState(false);
  const [onboardingError, setOnboardingError] = useState("");

  // Sub-options state for dislikes with expandable sub-categories
  const [expandedDislike, setExpandedDislike] = useState(null);
  const [selectedSubOptions, setSelectedSubOptions] = useState({});

  // Custom "Others" input state for adding custom dietary needs
  const [customItems, setCustomItems] = useState({
    dislikes: [],
    allergens: [],
    diets: []
  });
  const [customInputValue, setCustomInputValue] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(null); // 'dislikes' | 'allergens' | 'diets' | null

  // Vegetable sub-options for more specific vegetable dislikes
  const vegetableSubOptions = [
    { id: "all-vegetables", name: "All Vegetables", icon: "🥬" },
    { id: "leafy-greens", name: "Leafy Greens", description: "Spinach, Kale, Lettuce", icon: "🥬" },
    { id: "root-vegetables", name: "Root Vegetables", description: "Carrots, Potatoes, Beets", icon: "🥕" },
    { id: "cruciferous", name: "Cruciferous", description: "Broccoli, Cauliflower, Cabbage", icon: "🥦" },
    { id: "alliums", name: "Alliums", description: "Onions, Garlic, Leeks", icon: "🧅" },
    { id: "nightshades", name: "Nightshades", description: "Tomatoes, Peppers, Eggplant", icon: "🍅" },
    { id: "squash", name: "Squash & Gourds", description: "Zucchini, Pumpkin, Cucumber", icon: "🥒" },
    { id: "mushrooms", name: "Mushrooms", description: "All types of mushrooms", icon: "🍄" },
  ];

  async function persistOnboarding() {
    setSavingOnboarding(true);
    setOnboardingError("");
    try {
      const payload = {
        likes: selectedCuisines,
        dislikes: selectedDislikes,
        dislikeSubOptions: selectedSubOptions, // Include specific sub-options (e.g., which vegetables)
        diets: selectedDiets,
        allergens: selectedAllergens,
        customItems: customItems, // Include custom "Others" items
        onboardingDone: true
      };

      const res = await fetch(`${API}/api/preferences/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to save onboarding preferences");
      }

      try {
        localStorage.setItem(ONB_KEY, "1");
      } catch {}
      setShowWelcomeModal(false);
    } catch (e) {
      setOnboardingError(e.message || "Could not save your preferences. You can update them in Profile anytime.");
      try {
        localStorage.setItem(ONB_KEY, "1");
      } catch {}
      setShowWelcomeModal(false);
    } finally {
      setSavingOnboarding(false);
    }
  }

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep((s) => s + 1);
    } else {
      await persistOnboarding();
    }
  };

  const handleSkip = async () => {
    await persistOnboarding();
  };

  // Conflict warnings state
  const [conflictWarnings, setConflictWarnings] = useState([]);
  const [conflictErrors, setConflictErrors] = useState([]);

  // Calculate disabled diets based on current selection AND current dislikes
  const disabledDiets = useMemo(() => {
    const disabled = [];

    // Disabled from current diet selection
    if (selectedDiets.length > 0) {
      const currentDiet = selectedDiets[0];
      const dietRules = DIET_HIERARCHY[currentDiet];
      if (dietRules?.disables) {
        disabled.push(...dietRules.disables);
      }
    }

    return disabled;
  }, [selectedDiets]);

  // Get diet warnings/errors from current dislikes (BIDIRECTIONAL CHECK)
  const dietConflictsFromDislikes = useMemo(() => {
    // Only include 'vegetables' in conflict check if "All Vegetables" is selected
    // (not when specific vegetable types are selected)
    const dislikesForConflictCheck = selectedDislikes.filter(dislike => {
      if (dislike === 'vegetables') {
        // Check if "all-vegetables" is selected or no specific sub-options chosen
        const vegSubs = selectedSubOptions.vegetables || [];
        return vegSubs.includes('all-vegetables') || vegSubs.length === 0;
      }
      return true;
    });
    return getDietConflictsFromDislikes(dislikesForConflictCheck);
  }, [selectedDislikes, selectedSubOptions]);

  // Check for conflicts whenever selections change
  useEffect(() => {
    const warnings = [];
    const errors = [];

    // Check diet vs dislike conflicts (when diet is selected)
    if (selectedDiets.length > 0) {
      const currentDiet = selectedDiets[0];
      const dietRules = DIET_HIERARCHY[currentDiet];

      // Check for ERROR conflicts (e.g., pescatarian + seafood)
      if (dietRules?.conflictsWith) {
        const { dislike, message } = dietRules.conflictsWith;
        if (selectedDislikes.includes(dislike)) {
          errors.push({
            type: 'diet-dislike',
            message: message || `${dietRules.label} diet conflicts with disliking ${dislike}.`
          });
        }
      }

      // Check for WARNING conflicts (e.g., vegan + vegetables)
      if (dietRules?.warnsWith) {
        const { dislike, message } = dietRules.warnsWith;
        if (selectedDislikes.includes(dislike)) {
          warnings.push({
            type: 'diet-dislike-warning',
            message: message || `${dietRules.label} may have limited options when you dislike ${dislike}.`
          });
        }
      }

      // Check diet vs cuisine warnings (keto + carb-heavy cuisines)
      if (dietRules?.warns && dietRules.warns.length > 0) {
        const conflictingCuisines = selectedCuisines.filter(c => dietRules.warns.includes(c));
        if (conflictingCuisines.length > 0) {
          warnings.push({
            type: 'diet-cuisine',
            message: `${dietRules?.label || currentDiet} may have limited options in ${conflictingCuisines.join(', ')} cuisine.`
          });
        }
      }
    }

    // Check religious restrictions vs cuisine warnings (halal + pork-heavy cuisines)
    selectedDiets.forEach(diet => {
      const rules = RELIGIOUS_RULES[diet];
      if (rules?.strictLevels) {
        const strictRules = rules.strictLevels['moderate'];
        if (strictRules?.cuisineWarnings) {
          selectedCuisines.forEach(cuisine => {
            if (strictRules.cuisineWarnings[cuisine]) {
              warnings.push({
                type: 'religious-cuisine',
                message: strictRules.cuisineWarnings[cuisine]
              });
            }
          });
        }
      }
    });

    setConflictWarnings(warnings);
    setConflictErrors(errors);
  }, [selectedDiets, selectedDislikes, selectedCuisines]);

  const toggleSelection = (id, type, hasSubOptions = false) => {
    if (type === "cuisine") {
      setSelectedCuisines((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    } else if (type === "dislike") {
      // Check if this dislike has sub-options
      if (hasSubOptions) {
        // Toggle expansion of sub-options panel
        setExpandedDislike((prev) => (prev === id ? null : id));
      } else {
        setSelectedDislikes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      }
    } else if (type === "diet") {
      // SINGLE SELECT for diets - clicking same deselects, clicking different replaces
      setSelectedDiets((prev) => {
        if (prev.includes(id)) {
          return []; // Deselect if clicking same
        }
        return [id]; // Replace with new selection (single select)
      });
    } else if (type === "allergen") {
      setSelectedAllergens((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    }
  };

  // Toggle sub-option for dislikes with sub-categories (e.g., vegetables)
  const toggleSubOption = (parentId, subOptionId) => {
    setSelectedSubOptions((prev) => {
      const currentSubs = prev[parentId] || [];
      const isAllVegetables = subOptionId === 'all-vegetables';

      if (isAllVegetables) {
        // "All Vegetables" is exclusive - selecting it clears specific subs and adds main dislike
        if (currentSubs.includes(subOptionId)) {
          // Deselect "All Vegetables" - remove from dislikes
          setSelectedDislikes((d) => d.filter((x) => x !== parentId));
          return { ...prev, [parentId]: [] };
        } else {
          // Select "All Vegetables" - add to main dislikes, clear specific subs
          setSelectedDislikes((d) => (d.includes(parentId) ? d : [...d, parentId]));
          return { ...prev, [parentId]: [subOptionId] };
        }
      } else {
        // Selecting specific sub-option
        if (currentSubs.includes(subOptionId)) {
          // Deselect this sub-option
          const newSubs = currentSubs.filter((x) => x !== subOptionId);
          // If no more specific subs, remove from main dislikes (unless "all" was selected)
          if (newSubs.length === 0 || (newSubs.length === 1 && newSubs[0] === 'all-vegetables')) {
            if (!newSubs.includes('all-vegetables')) {
              setSelectedDislikes((d) => d.filter((x) => x !== parentId));
            }
          }
          return { ...prev, [parentId]: newSubs };
        } else {
          // Select this sub-option - remove "All Vegetables" if present
          const newSubs = [...currentSubs.filter((x) => x !== 'all-vegetables'), subOptionId];
          // Add parentId to dislikes but mark it as "specific" (not all)
          // We'll store specific selections but NOT trigger the vegan/vegetarian warning
          setSelectedDislikes((d) => (d.includes(parentId) ? d : [...d, parentId]));
          return { ...prev, [parentId]: newSubs };
        }
      }
    });
  };

  // Check if "All Vegetables" is selected (triggers vegan/vegetarian warning)
  const isAllVegetablesSelected = () => {
    return selectedSubOptions.vegetables?.includes('all-vegetables') ||
           (selectedDislikes.includes('vegetables') && (!selectedSubOptions.vegetables || selectedSubOptions.vegetables.length === 0));
  };

  // Add custom item to a category
  const addCustomItem = (category) => {
    const trimmed = customInputValue.trim();
    if (!trimmed) return;

    // Prevent duplicates
    if (customItems[category].some(item => item.toLowerCase() === trimmed.toLowerCase())) {
      return;
    }

    setCustomItems(prev => ({
      ...prev,
      [category]: [...prev[category], trimmed]
    }));
    setCustomInputValue('');
  };

  // Remove custom item from a category
  const removeCustomItem = (category, item) => {
    setCustomItems(prev => ({
      ...prev,
      [category]: prev[category].filter(i => i !== item)
    }));
  };

  // Check if a diet option is disabled (from diet hierarchy OR from dislike conflicts)
  const isDietDisabled = (dietId) => {
    // Disabled from another diet selection
    if (disabledDiets.includes(dietId)) return true;
    // Disabled due to error-level conflict with dislikes (e.g., pescatarian + seafood dislike)
    if (dietConflictsFromDislikes.dietErrors[dietId]) return true;
    return false;
  };

  // Get warning message for a diet option (from dislike conflicts)
  const getDietWarning = (dietId) => {
    return dietConflictsFromDislikes.dietWarnings[dietId] || null;
  };

  // Get error message for a diet option (from dislike conflicts)
  const getDietError = (dietId) => {
    return dietConflictsFromDislikes.dietErrors[dietId] || null;
  };

  const openOnboardingPreview = () => {
    setCurrentStep(1);
    setSelectedCuisines([]);
    setSelectedDislikes([]);
    setSelectedDiets([]);
    setSelectedAllergens([]);
    setOnboardingError("");
    setShowWelcomeModal(true);
  };

  const cuisineOptions = [
    { id: "filipino", name: "Filipino", image: `${process.env.PUBLIC_URL}/images/filipino.jpg` },
    { id: "japanese", name: "Japanese", image: `${process.env.PUBLIC_URL}/images/japan.jpg` },
    { id: "italian", name: "Italian", image: `${process.env.PUBLIC_URL}/images/italian.jpeg` },
    { id: "korean", name: "Korean", image: `${process.env.PUBLIC_URL}/images/korean.jpg` },
    { id: "chinese", name: "Chinese", image: `${process.env.PUBLIC_URL}/images/chinese.jpg` },
    { id: "american", name: "American", image: `${process.env.PUBLIC_URL}/images/burger.jpg` },
    { id: "thai", name: "Thai", image: `${process.env.PUBLIC_URL}/images/thai.jpg` },
    { id: "mexican", name: "Mexican", image: `${process.env.PUBLIC_URL}/images/mexican.jpg` },
  ];

  const dislikeOptions = [
    { id: "seafood", name: "Seafood", image: `${process.env.PUBLIC_URL}/images/seafood.jpg` },
    { id: "spicy", name: "Spicy Food", image: `${process.env.PUBLIC_URL}/images/spicy.jpg` },
    { id: "vegetables", name: "Vegetables", image: `${process.env.PUBLIC_URL}/images/vegetables.jpg`, hasSubOptions: true },
    { id: "meat", name: "Meat", image: `${process.env.PUBLIC_URL}/images/meat.jpg` },
    { id: "dairy", name: "Dairy", image: `${process.env.PUBLIC_URL}/images/dairy.jpg` },
    { id: "gluten", name: "Gluten", image: `${process.env.PUBLIC_URL}/images/gluten.jpeg` },
    { id: "nuts", name: "Tree Nuts/Peanuts", image: `${process.env.PUBLIC_URL}/images/nuts.jpg` },
    { id: "eggs", name: "Eggs", image: `${process.env.PUBLIC_URL}/images/eggs.jpg` },
  ];

  const dietOptions = [
    { id: "omnivore", name: "Omnivore", image: `${process.env.PUBLIC_URL}/images/omnivore.jpg` },
    { id: "vegetarian", name: "Vegetarian", image: `${process.env.PUBLIC_URL}/images/salad.jpg` },
    { id: "vegan", name: "Vegan", image: `${process.env.PUBLIC_URL}/images/vegetables.jpg` },
    { id: "pescetarian", name: "Pescetarian", image: `${process.env.PUBLIC_URL}/images/fish.jpg` },
    { id: "keto", name: "Keto", image: `${process.env.PUBLIC_URL}/images/keto.jpg` },
    { id: "low-carb", name: "Low Carb", image: `${process.env.PUBLIC_URL}/images/lowcarb.jpg` },
    { id: "halal", name: "Halal", image: `${process.env.PUBLIC_URL}/images/halal.jpg` },
    { id: "kosher", name: "Kosher", image: `${process.env.PUBLIC_URL}/images/kosher.jpg` },
  ];

  const allergenOptions = [
    { id: "peanuts", name: "Peanuts", image: `${process.env.PUBLIC_URL}/images/peanuts.jpg` },
    { id: "tree-nuts", name: "Tree Nuts", image: `${process.env.PUBLIC_URL}/images/nuts.jpg` },
    { id: "eggs", name: "Eggs", image: `${process.env.PUBLIC_URL}/images/eggs.jpg` },
    { id: "dairy", name: "Dairy", image: `${process.env.PUBLIC_URL}/images/dairy.jpg` },
    { id: "gluten", name: "Gluten/Wheat", image: `${process.env.PUBLIC_URL}/images/gluten.jpeg` },
    { id: "soy", name: "Soy", image: `${process.env.PUBLIC_URL}/images/soy.jpg` },
    { id: "fish", name: "Fish", image: `${process.env.PUBLIC_URL}/images/fish.jpg` },
    { id: "shellfish", name: "Shellfish", image: `${process.env.PUBLIC_URL}/images/seafood.jpg` },
  ];

  const [showSurprise, setShowSurprise] = useState(false);
  const [currentFood, setCurrentFood] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [foodItems, setFoodItems] = useState([]);
  const [loadingSurprise, setLoadingSurprise] = useState(false);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);

  // Food Mood & Facts States
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const foodMoods = [
    { id: 'hungry', icon: Flame, label: 'Starving', query: 'What filling meals can you recommend?' },
    { id: 'healthy', icon: Salad, label: 'Healthy', query: 'Suggest me some Healthy nutritious food please!' },
    { id: 'comfort', icon: Coffee, label: 'Comfort', query: 'What comfort food would you recommend?' },
    { id: 'sweet', icon: Cake, label: 'Sweet Tooth', query: 'I am in the mood for dessert! What would you suggest?' },
    { id: 'adventure', icon: Globe, label: 'Adventurous', query: 'Suggest me some exotic International Recipes!' },
    { id: 'quick', icon: Zap, label: 'Quick Bite', query: 'What would you suggest for a quick bite?' },
  ];

  const foodFacts = useMemo(() => [
    { icon: ChefHat, fact: 'Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible!' },
    { icon: Cake, fact: 'White chocolate is not technically chocolate - it contains no cocoa solids, only cocoa butter.' },
    { icon: Salad, fact: 'Carrots were originally purple! Orange carrots were developed in the 17th century Netherlands.' },
    { icon: Pizza, fact: 'The Hawaiian pizza was invented in Canada by a Greek immigrant. Talk about fusion!' },
    { icon: Coffee, fact: 'Coffee beans are not beans - they are the pits of coffee cherries, a type of fruit.' },
    { icon: Salad, fact: 'Bananas are berries, but strawberries are not. Botanically speaking, that is!' },
    { icon: Flame, fact: 'The heat in chili peppers comes from capsaicin, which tricks your brain into feeling burning pain.' },
    { icon: Utensils, fact: 'There are over 1,800 different types of cheese in the world. Time to start tasting!' },
  ], []);

  const handleMoodSelect = (mood) => {
    navigate('/chatbot', { state: { message: mood.query } });
  };

  const nextFact = () => {
    setCurrentFactIndex((prev) => (prev + 1) % foodFacts.length);
  };

  const prevFact = () => {
    setCurrentFactIndex((prev) => (prev - 1 + foodFacts.length) % foodFacts.length);
  };

  const fetchSurpriseRecipes = useCallback(async () => {
    const cached = getCached(CACHE_KEYS.SURPRISE_RECIPES);
    if (cached && cached.length > 0) {
      setFoodItems(cached);
      return;
    }

    try {
      const res = await fetch(`${API}/api/surprise?limit=20`);
      const data = await res.json();
      if (res.ok && data.success && data.recipes.length > 0) {
        setFoodItems(data.recipes);
        setCache(CACHE_KEYS.SURPRISE_RECIPES, data.recipes, CACHE_TTL.SURPRISE_RECIPES);
      } else {
        setFoodItems([]);
      }
    } catch (error) {
      setFoodItems([]);
    }
  }, [API]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Hello');

    fetchSurpriseRecipes();

    const factTimer = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % foodFacts.length);
    }, 15000);

    return () => {
      clearInterval(factTimer);
    };
  }, [fetchSurpriseRecipes, foodFacts.length]);

  const surpriseMe = async () => {
    setIsAnimating(true);
    setLoadingSurprise(true);
    try {
      const res = await fetch(`${API}/api/surprise/random`);
      const data = await res.json();
      if (res.ok && data.success && data.recipe) {
        setCurrentFood(data.recipe);
        setIsLiked(false);
      } else if (foodItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * foodItems.length);
        setCurrentFood(foodItems[randomIndex]);
        setIsLiked(false);
      }
    } catch (error) {
      if (foodItems.length > 0) {
        const randomIndex = Math.floor(Math.random() * foodItems.length);
        setCurrentFood(foodItems[randomIndex]);
        setIsLiked(false);
      }
    } finally {
      setIsAnimating(false);
      setLoadingSurprise(false);
    }
  };

  const handleSurpriseClick = async () => {
    if (!showSurprise) {
      setLoadingSurprise(true);
      try {
        const res = await fetch(`${API}/api/surprise/random`);
        const data = await res.json();
        if (res.ok && data.success && data.recipe) {
          setCurrentFood(data.recipe);
        } else {
          if (foodItems.length > 0) {
            const randomIndex = Math.floor(Math.random() * foodItems.length);
            setCurrentFood(foodItems[randomIndex]);
          }
        }
      } catch (error) {
        if (foodItems.length > 0) {
          const randomIndex = Math.floor(Math.random() * foodItems.length);
          setCurrentFood(foodItems[randomIndex]);
        }
      } finally {
        setLoadingSurprise(false);
      }
    }
    setShowSurprise(!showSurprise);
  };

  const handleChatSubmit = () => {
    if (chatInput.trim()) {
      navigate('/chatbot', { state: { message: chatInput.trim() } });
      setChatInput('');
    }
  };

  const navigationCards = [
    { title: "Explorer", description: "Discover recipes", icon: Users },
    { title: "Barkada Vote", description: "Vote together", icon: MessageSquare },
    { title: "ChatBot", description: "Food advice", icon: Bot },
    { title: "Recipes", description: "Smart suggestions", icon: ChefHat },
    { title: "Calendar", description: "Meal planning", icon: Calendar },
    { title: "Restaurants", description: "Find nearby", icon: MapPin }
  ];

  return (
    <>
      {loadingSurprise && <LoadingModal message="Fetching delicious surprises..." />}

      {/* Onboarding Modal */}
      {showWelcomeModal && (
        <div className="onboarding-overlay">
          <div className="onboarding-modal">
            <div className="onboarding-header">
              <div className="onboarding-logo-container">
                <div className="onboarding-logo">
                  <span className="onboarding-logo-text">P</span>
                </div>
              </div>
              <h2 className="onboarding-title">
                {currentStep === 1 && "Welcome To Pick-A-Plate!"}
                {currentStep === 2 && "Foods you dislike?"}
                {currentStep === 3 && "Choose your diet"}
                {currentStep === 4 && "Any allergens?"}
              </h2>
              <p className="onboarding-subtitle">
                {currentStep === 1 && "Select cuisines you love"}
                {currentStep === 2 && "We'll avoid these for you"}
                {currentStep === 3 && "Pick what fits you best"}
                {currentStep === 4 && "Select to always exclude"}
              </p>
              <div className="onboarding-steps">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`onboarding-step ${step === currentStep ? "onboarding-step-active" : "onboarding-step-inactive"}`}
                  />
                ))}
              </div>
            </div>
            <div className="onboarding-content">
              {onboardingError && <div className="onboarding-error">{onboardingError}</div>}

              {/* Show conflict errors */}
              {conflictErrors.length > 0 && (
                <div className="preference-error-banner">
                  {conflictErrors.map((error, idx) => (
                    <div key={idx} className="preference-error-item">
                      <X className="preference-error-item-icon" />
                      <span className="preference-error-item-text">{error.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Show conflict warnings */}
              {conflictWarnings.length > 0 && (
                <div className="preference-warning-banner">
                  {conflictWarnings.map((warning, idx) => (
                    <div key={idx} className="preference-warning-item">
                      <AlertTriangle className="preference-warning-item-icon" />
                      <span className="preference-warning-item-text">{warning.message}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="onboarding-grid">
                {currentStep === 1 && cuisineOptions.map((option) => (
                  <div key={option.id} onClick={() => toggleSelection(option.id, "cuisine")} className={`onboarding-option ${selectedCuisines.includes(option.id) ? "onboarding-option-selected-yellow" : ""}`}>
                    <img src={option.image} alt={option.name} className="onboarding-option-image" width="150" height="112" loading="lazy" />
                    <div className="onboarding-option-overlay"><span className="onboarding-option-name">{option.name}</span></div>
                    {selectedCuisines.includes(option.id) && (<div className="onboarding-option-check onboarding-option-check-yellow"><svg className="onboarding-option-check-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>)}
                  </div>
                ))}
                {currentStep === 2 && (
                  <>
                    {dislikeOptions.map((option) => {
                      const isExpanded = expandedDislike === option.id;
                      const hasSubSelections = selectedSubOptions[option.id]?.length > 0;
                      const isSelected = selectedDislikes.includes(option.id);

                      return (
                        <div
                          key={option.id}
                          onClick={() => toggleSelection(option.id, "dislike", option.hasSubOptions)}
                          className={`onboarding-option ${isSelected ? "onboarding-option-selected-red" : ""} ${isExpanded ? "onboarding-option-expanded" : ""} ${hasSubSelections ? "onboarding-option-has-subs" : ""}`}
                        >
                          <img src={option.image} alt={option.name} className="onboarding-option-image" width="150" height="112" loading="lazy" />
                          <div className="onboarding-option-overlay">
                            <span className="onboarding-option-name">{option.name}</span>
                            {option.hasSubOptions && (
                              <span className="onboarding-option-expand-hint">
                                {isExpanded ? "▲ Tap to collapse" : "▼ Tap to specify"}
                              </span>
                            )}
                          </div>
                          {isSelected && !option.hasSubOptions && (
                            <div className="onboarding-option-check onboarding-option-check-red">
                              <X className="onboarding-option-check-icon" />
                            </div>
                          )}
                          {hasSubSelections && (
                            <div className="onboarding-option-sub-count">
                              {selectedSubOptions[option.id].includes('all-vegetables') ? 'All' : selectedSubOptions[option.id].length}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Sub-options panel for vegetables */}
                    {expandedDislike === 'vegetables' && (
                      <div className="sub-options-panel">
                        <div className="sub-options-header">
                          <span className="sub-options-title">Which vegetables do you dislike?</span>
                          <button
                            className="sub-options-close"
                            onClick={(e) => { e.stopPropagation(); setExpandedDislike(null); }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="sub-options-grid">
                          {vegetableSubOptions.map((subOption) => {
                            const isSubSelected = selectedSubOptions.vegetables?.includes(subOption.id);
                            const isAllSelected = selectedSubOptions.vegetables?.includes('all-vegetables');
                            const isDisabledBecauseAll = isAllSelected && subOption.id !== 'all-vegetables';

                            return (
                              <div
                                key={subOption.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (!isDisabledBecauseAll) {
                                    toggleSubOption('vegetables', subOption.id);
                                  }
                                }}
                                className={`sub-option ${isSubSelected ? "sub-option-selected" : ""} ${isDisabledBecauseAll ? "sub-option-disabled" : ""} ${subOption.id === 'all-vegetables' ? "sub-option-all" : ""}`}
                              >
                                <span className="sub-option-icon">{subOption.icon}</span>
                                <div className="sub-option-content">
                                  <span className="sub-option-name">{subOption.name}</span>
                                  {subOption.description && (
                                    <span className="sub-option-description">{subOption.description}</span>
                                  )}
                                </div>
                                {isSubSelected && (
                                  <div className="sub-option-check">
                                    <X size={14} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {isAllVegetablesSelected() && (
                          <div className="sub-options-warning">
                            <AlertTriangle size={16} />
                            <span>Selecting "All Vegetables" will show a warning on Vegan/Vegetarian diets.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                {currentStep === 3 && dietOptions.map((option) => {
                  const isDisabled = isDietDisabled(option.id);
                  const isSelected = selectedDiets.includes(option.id);
                  const warning = getDietWarning(option.id);
                  const hasWarning = warning && !isDisabled;
                  return (
                    <div
                      key={option.id}
                      onClick={() => !isDisabled && toggleSelection(option.id, "diet")}
                      className={`onboarding-option ${isSelected ? "onboarding-option-selected-yellow" : ""} ${isDisabled ? "onboarding-option-disabled" : ""} ${hasWarning ? "onboarding-option-warning" : ""}`}
                      title={isDisabled ? "Conflicts with your current selection" : hasWarning ? warning.message : ""}
                    >
                      <img
                        src={option.image}
                        alt={option.name}
                        className={`onboarding-option-image ${isDisabled ? "onboarding-option-image-disabled" : ""}`}
                        width="150"
                        height="112"
                        loading="lazy"
                      />
                      <div className="onboarding-option-overlay">
                        <span className="onboarding-option-name">{option.name}</span>
                      </div>
                      {isSelected && (
                        <div className="onboarding-option-check onboarding-option-check-yellow">
                          <svg className="onboarding-option-check-icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {isDisabled && (
                        <div className="onboarding-option-disabled-overlay">
                          <AlertTriangle className="onboarding-option-disabled-icon" />
                          <span className="onboarding-option-disabled-text">Conflict</span>
                        </div>
                      )}
                      {hasWarning && !isSelected && (
                        <div className="onboarding-option-warning-badge" title={warning.message}>
                          <Info className="onboarding-option-warning-icon" />
                        </div>
                      )}
                      {hasWarning && isSelected && (
                        <div className="onboarding-option-warning-selected">
                          <AlertTriangle className="onboarding-option-warning-selected-icon" />
                        </div>
                      )}
                    </div>
                  );
                })}
                {currentStep === 4 && (
                  <>
                    {allergenOptions.map((option) => (
                      <div key={option.id} onClick={() => toggleSelection(option.id, "allergen")} className={`onboarding-option ${selectedAllergens.includes(option.id) ? "onboarding-option-selected-red" : ""}`}>
                        <img src={option.image} alt={option.name} className="onboarding-option-image" width="150" height="112" loading="lazy" />
                        <div className="onboarding-option-overlay"><span className="onboarding-option-name">{option.name}</span></div>
                        {selectedAllergens.includes(option.id) && (<div className="onboarding-option-check onboarding-option-check-red"><svg className="onboarding-option-check-icon" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></div>)}
                      </div>
                    ))}

                    {/* Others - Add Custom Option */}
                    <div
                      onClick={() => setShowCustomInput(showCustomInput === 'allergens' ? null : 'allergens')}
                      className={`onboarding-option onboarding-option-others ${showCustomInput === 'allergens' ? 'onboarding-option-expanded' : ''} ${customItems.allergens.length > 0 ? 'onboarding-option-has-subs' : ''}`}
                    >
                      <div className="onboarding-option-others-content">
                        <Plus className="onboarding-option-others-icon" />
                        <span className="onboarding-option-others-text">Others</span>
                        <span className="onboarding-option-others-hint">Add custom item</span>
                      </div>
                      {customItems.allergens.length > 0 && (
                        <div className="onboarding-option-sub-count">{customItems.allergens.length}</div>
                      )}
                    </div>

                    {/* Custom input panel */}
                    {showCustomInput === 'allergens' && (
                      <div className="custom-input-panel">
                        <div className="custom-input-header">
                          <span className="custom-input-title">Add other allergies or restrictions</span>
                          <button
                            className="custom-input-close"
                            onClick={(e) => { e.stopPropagation(); setShowCustomInput(null); }}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="custom-input-form">
                          <input
                            type="text"
                            value={customInputValue}
                            onChange={(e) => setCustomInputValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addCustomItem('allergens');
                              }
                            }}
                            placeholder="Type and press Enter..."
                            className="custom-input-field"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => { e.stopPropagation(); addCustomItem('allergens'); }}
                            className="custom-input-add-btn"
                            disabled={!customInputValue.trim()}
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                        {customItems.allergens.length > 0 && (
                          <div className="custom-items-list">
                            {customItems.allergens.map((item, index) => (
                              <div key={index} className="custom-item-tag">
                                <span>{item}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); removeCustomItem('allergens', item); }}
                                  className="custom-item-remove"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="onboarding-footer">
              <button onClick={handleSkip} className="onboarding-skip-btn" disabled={savingOnboarding}>{savingOnboarding ? "Saving..." : "Skip"}</button>
              <button onClick={handleNext} className="onboarding-next-btn" disabled={savingOnboarding}>{currentStep === 4 ? (savingOnboarding ? "Saving..." : "Get Started") : "Next"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard */}
      <div className="dashboard-container">
        {/* Scattered Elements Background */}
        <ScatteredElements />

        {/* Enhanced Header */}
        <header className="dashboard-header-v2">
          {/* Curved bottom */}
          <div className="header-curve">
            <svg viewBox="0 0 1440 60" preserveAspectRatio="none">
              <path d="M0,0 C480,60 960,60 1440,0 L1440,60 L0,60 Z" fill="#fffbeb"/>
            </svg>
          </div>

          <div className="header-container-v2">
            <div className="header-content-v2">
              {/* Brand - CSS GRID: Icon LEFT, Title RIGHT */}
              <div
                className="header-brand"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  alignItems: 'center',
                  gap: '16px'
                }}
              >
                {/* ICON - Column 1 */}
                <div
                  className="header-logo-v2"
                  style={{
                    gridColumn: 1,
                    gridRow: 1
                  }}
                >
                  <div className="logo-plate">
                    <Utensils className="logo-utensils-icon" />
                  </div>
                  <div className="logo-sparkle logo-sparkle-1">
                    <Sparkles size={14} />
                  </div>
                  <div className="logo-sparkle logo-sparkle-2">
                    <Sparkles size={14} />
                  </div>
                </div>
                {/* TEXT - Column 2 */}
                <div style={{ gridColumn: 2, gridRow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <h1 className="header-title-v2" style={{ margin: 0 }}>Pick A Plate</h1>
                  <p className="header-tagline" style={{ margin: 0 }}>Your personal food companion</p>
                </div>
              </div>

              {/* Right side */}
              <div className="header-actions">
                {isAdmin && (
                  <button 
                    onClick={openOnboardingPreview} 
                    className="admin-btn-v2"
                    title="Preview Onboarding Modal"
                  >
                    <Settings className="admin-icon" />
                    <span className="admin-text">Admin</span>
                  </button>
                )}
                <div className="greeting-card">
                  <div className="greeting-avatar">
                    <Star className="greeting-avatar-icon" />
                  </div>
                  <div className="greeting-text-v2">
                    <span className="greeting-label">{greeting}!</span>
                    <span className="greeting-sub">Let's find something delicious</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          <div className="main-cards-section">
            <div className="ai-chat-card">
              <div className="ai-chat-decoration"></div>
              <div className="ai-chat-content">
                <div className="ai-chat-header" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '12px' }}>
                  <div className="ai-chat-icon-container" style={{ gridColumn: 1, gridRow: 1 }}><Bot className="ai-chat-icon" /></div>
                  <div style={{ gridColumn: 2, gridRow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                    <h2 className="ai-chat-title" style={{ margin: 0 }}>AI Assistant</h2>
                    <p className="ai-chat-subtitle" style={{ margin: '2px 0 0 0' }}>{greeting}! How can I help?</p>
                  </div>
                </div>
                <div className="ai-chat-features">
                  <span className="ai-chat-feature-tag"><Sparkles className="ai-chat-feature-icon" /> Recommendations</span>
                  <span className="ai-chat-feature-tag"><ChefHat className="ai-chat-feature-icon" /> Recipes</span>
                  <span className="ai-chat-feature-tag"><MessageSquare className="ai-chat-feature-icon" /> 24/7</span>
                </div>
                <div className="ai-chat-input-container">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleChatSubmit(); }} placeholder="Ask about food..." className="ai-chat-input" />
                  <button onClick={handleChatSubmit} className="ai-chat-submit-btn"><Send className="ai-chat-submit-icon" /></button>
                </div>
                <div className="ai-chat-quick-actions">
                  <button onClick={() => navigate('/chatbot', { state: { message: "What's popular today?" } })} className="ai-chat-quick-btn">Popular</button>
                  <button onClick={() => navigate('/chatbot', { state: { message: "Suggest a healthy meal" } })} className="ai-chat-quick-btn">Healthy</button>
                  <button onClick={() => navigate('/chatbot', { state: { message: "Find restaurants near me" } })} className="ai-chat-quick-btn">Near me</button>
                </div>
              </div>
            </div>

            <div className="surprise-card">
              <div className="surprise-decoration"></div>
              <div className="surprise-spot surprise-spot-1"></div>
              <div className="surprise-spot surprise-spot-2"></div>
              <div className="surprise-spot surprise-spot-3"></div>
              <div className="surprise-spot surprise-spot-4"></div>
              <div className="surprise-spot surprise-spot-5"></div>
              <div className="surprise-spot surprise-spot-6"></div>
              <div className="surprise-content">
                <Sparkles className="surprise-icon" />
                <div className="surprise-text-container">
                  <h2 className="surprise-title">Can't Decide?</h2>
                  <p className="surprise-subtitle">Let us surprise you!</p>
                </div>
                <button onClick={handleSurpriseClick} className="surprise-btn"><Sparkles className="surprise-btn-icon" /><span>Surprise Me!</span></button>
              </div>
            </div>
          </div>

          <div className="feature-section">
            <h3 className="feature-section-title"><Utensils className="feature-section-icon" />Explore Features</h3>
            <div className="feature-grid">
              {navigationCards.map((card, index) => {
                const Icon = card.icon;
                return (
                  <button key={index} onClick={() => navigate(`/${card.title.toLowerCase().replace(/\s+/g, '-')}`)} className="feature-card">
                    <div className="feature-card-content">
                      <div className="feature-card-icon-container"><Icon className="feature-card-icon" /></div>
                      <h3 className="feature-card-title">{card.title}</h3>
                      <p className="feature-card-description">{card.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="footer-banner">
            <div className="footer-banner-decoration">
              <Pizza className="footer-icon footer-icon-1" />
              <Sandwich className="footer-icon footer-icon-2" />
              <Flame className="footer-icon footer-icon-3" />
              <Salad className="footer-icon footer-icon-4" />
            </div>
            <div className="footer-banner-content">
              <h3 className="footer-banner-title">Ready to cook something amazing?</h3>
              <p className="footer-banner-text">Join our community of food lovers and discover new flavors every day!</p>
              <div className="footer-banner-buttons">
                <button onClick={() => navigate('/explorer')} className="footer-btn-primary">Browse Recipes</button>
                <button onClick={() => navigate('/chatbot', { state: { message: "Suggest me something new to try" } })} className="footer-btn-secondary">Get Suggestions</button>
              </div>
            </div>
          </div>

          {/* Food Mood & Fun Facts Section */}
          <div className="mood-facts-section">
            <div className="mood-picker-card">
              <div className="mood-picker-header" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: '12px' }}>
                <div className="mood-picker-icon-wrapper" style={{ gridColumn: 1, gridRow: 1 }}><Flame className="mood-picker-icon" /></div>
                <div style={{ gridColumn: 2, gridRow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }}>
                  <h3 className="mood-picker-title" style={{ margin: 0 }}>What's Your Food Mood?</h3>
                  <p className="mood-picker-subtitle" style={{ margin: '2px 0 0 0' }}>Tap how you're feeling, we'll find the perfect dish!</p>
                </div>
              </div>
              <div className="mood-grid">
                {foodMoods.map((mood) => {
                  const Icon = mood.icon;
                  return (
                    <button key={mood.id} onClick={() => handleMoodSelect(mood)} className="mood-btn">
                      <div className="mood-icon-wrapper">
                        <Icon className="mood-icon" />
                      </div>
                      <span className="mood-label">{mood.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="food-facts-card">
              <div className="food-facts-header">
                <span className="food-facts-badge"><Star className="food-facts-badge-icon" />Did You Know?</span>
              </div>
              <div className="food-facts-content">
                <div className="food-facts-icon-wrapper">
                  {React.createElement(foodFacts[currentFactIndex].icon, { className: 'food-facts-icon' })}
                </div>
                <p className="food-facts-text">{foodFacts[currentFactIndex].fact}</p>
              </div>
              <div className="food-facts-nav">
                <button onClick={prevFact} className="food-facts-nav-btn">
                  <ChefHat className="food-facts-nav-icon" style={{ transform: 'rotate(-90deg)' }} />
                </button>
                <div className="food-facts-dots">
                  {foodFacts.map((_, index) => (<span key={index} className={`food-facts-dot ${index === currentFactIndex ? 'food-facts-dot-active' : ''}`} onClick={() => setCurrentFactIndex(index)} />))}
                </div>
                <button onClick={nextFact} className="food-facts-nav-btn">
                  <ChefHat className="food-facts-nav-icon" style={{ transform: 'rotate(90deg)' }} />
                </button>
              </div>
            </div>
          </div>

        </main>
      </div>

      {/* Surprise Me Modal */}
      {showSurprise && currentFood && (
        <div className="surprise-modal-overlay">
          <div className="surprise-modal">
            <div className="surprise-modal-header">
              <div className="surprise-modal-title-container"><Sparkles className="surprise-modal-icon" /><h2 className="surprise-modal-title">Your Surprise!</h2></div>
              <button onClick={() => setShowSurprise(false)} className="surprise-modal-close-btn"><X className="surprise-modal-close-icon" /></button>
            </div>
            <div className={`surprise-modal-content ${isAnimating ? 'surprise-modal-content-animating' : 'surprise-modal-content-visible'}`}>
              <div className="surprise-modal-layout">
                <div className="surprise-modal-image-container">
                  <img src={currentFood.image} alt={currentFood.name} className="surprise-modal-image" width="400" height="320" loading="lazy" />
                  <button onClick={() => setIsLiked(!isLiked)} className="surprise-modal-like-btn"><Heart className={`surprise-modal-like-icon ${isLiked ? 'surprise-modal-like-icon-active' : 'surprise-modal-like-icon-inactive'}`} /></button>
                </div>
                <div className="surprise-modal-details">
                  <div className="surprise-modal-badge"><Sparkles className="surprise-modal-badge-icon" />RECOMMENDATION</div>
                  <h3 className="surprise-modal-food-name">{currentFood.name}</h3>
                  <p className="surprise-modal-restaurant"><MapPin className="surprise-modal-restaurant-icon" />{currentFood.restaurant}</p>
                  {currentFood.description && (<p className="surprise-modal-description">{currentFood.description}</p>)}
                  <div className="surprise-modal-info-grid">
                    {currentFood.prepTime && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Prep</p><p className="surprise-modal-info-value">{currentFood.prepTime}</p></div>)}
                    {currentFood.cookTime && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Cook</p><p className="surprise-modal-info-value">{currentFood.cookTime}</p></div>)}
                    {currentFood.difficulty && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Difficulty</p><p className="surprise-modal-info-value">{currentFood.difficulty}</p></div>)}
                    {currentFood.servings && (<div className="surprise-modal-info-item"><p className="surprise-modal-info-label">Servings</p><p className="surprise-modal-info-value">{currentFood.servings}</p></div>)}
                  </div>
                  <button onClick={() => setShowRecipeDetails(true)} className="surprise-modal-recipe-btn"><ChefHat className="surprise-modal-recipe-btn-icon" />View Full Recipe</button>
                  <button onClick={surpriseMe} className="surprise-modal-try-another-btn"><RefreshCw className={`surprise-modal-try-another-icon ${isAnimating ? 'surprise-modal-try-another-icon-spinning' : ''}`} />Try Another</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Details Modal */}
      {showRecipeDetails && currentFood && (
        <div className="recipe-modal-overlay">
          <div className="recipe-modal">
            <div className="recipe-modal-header">
              <div className="recipe-modal-title-container"><ChefHat className="recipe-modal-icon" /><h2 className="recipe-modal-title">Full Recipe</h2></div>
              <button onClick={() => setShowRecipeDetails(false)} className="recipe-modal-close-btn"><X className="recipe-modal-close-icon" /></button>
            </div>
            <div className="recipe-modal-content">
              <div className="recipe-modal-header-section">
                <div className="recipe-modal-badge"><Star className="recipe-modal-badge-icon" />{currentFood.type === "community" ? "COMMUNITY RECIPE" : "CULTURAL RECIPE"}</div>
                <h3 className="recipe-modal-food-name">{currentFood.name}</h3>
                <p className="recipe-modal-restaurant">{currentFood.restaurant}</p>
              </div>
              {currentFood.image && (<img src={currentFood.image} alt={currentFood.name} className="recipe-modal-image" width="400" height="224" loading="lazy" />)}
              {currentFood.description && (<p className="recipe-modal-description">{currentFood.description}</p>)}
              <div className="recipe-modal-info-grid">
                {currentFood.prepTime && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Prep Time</p><p className="recipe-modal-info-value">{currentFood.prepTime}</p></div>)}
                {currentFood.cookTime && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Cook Time</p><p className="recipe-modal-info-value">{currentFood.cookTime}</p></div>)}
                {currentFood.difficulty && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Difficulty</p><p className="recipe-modal-info-value">{currentFood.difficulty}</p></div>)}
                {currentFood.servings && (<div className="recipe-modal-info-item"><p className="recipe-modal-info-label">Servings</p><p className="recipe-modal-info-value">{currentFood.servings}</p></div>)}
              </div>
              {currentFood.ingredients && currentFood.ingredients.length > 0 && (
                <div className="recipe-modal-section">
                  <h3 className="recipe-modal-section-title"><Utensils className="recipe-modal-section-icon" />Ingredients</h3>
                  <ul className="recipe-modal-ingredients-list">{currentFood.ingredients.map((ingredient, i) => (<li key={i} className="recipe-modal-ingredient-item"><span className="recipe-modal-ingredient-bullet">-</span><span className="recipe-modal-ingredient-text">{ingredient}</span></li>))}</ul>
                </div>
              )}
              {currentFood.instructions && currentFood.instructions.length > 0 && (
                <div className="recipe-modal-section">
                  <h3 className="recipe-modal-section-title"><ChefHat className="recipe-modal-section-icon" />Instructions</h3>
                  <ol className="recipe-modal-instructions-list">{currentFood.instructions.map((step, i) => (<li key={i} className="recipe-modal-instruction-item"><span className="recipe-modal-instruction-number">{i + 1}</span><span className="recipe-modal-instruction-text">{step}</span></li>))}</ol>
                </div>
              )}
              {(!currentFood.ingredients || currentFood.ingredients.length === 0) && (!currentFood.instructions || currentFood.instructions.length === 0) && currentFood.recipe && currentFood.recipe.length > 0 && (
                <div className="recipe-modal-section">
                  <h3 className="recipe-modal-section-title"><ChefHat className="recipe-modal-section-icon" />Recipe</h3>
                  <ul className="recipe-modal-recipe-list">{currentFood.recipe.map((step, i) => (<li key={i} className="recipe-modal-recipe-item"><span className="recipe-modal-recipe-bullet">-</span><span className="recipe-modal-recipe-text">{step}</span></li>))}</ul>
                </div>
              )}
              {currentFood.type === "community" && (
                <div className="recipe-modal-tags-allergens">
                  {currentFood.tags && currentFood.tags.length > 0 && (<div><h4 className="recipe-modal-tags-title">Tags</h4><div className="recipe-modal-tags-container">{currentFood.tags.map((tag, i) => (<span key={i} className="recipe-modal-tag">#{tag}</span>))}</div></div>)}
                  {currentFood.allergens && currentFood.allergens.length > 0 && (<div><h4 className="recipe-modal-allergens-title">Allergens</h4><div className="recipe-modal-allergens-container">{currentFood.allergens.map((allergen, i) => (<span key={i} className="recipe-modal-allergen">{allergen}</span>))}</div></div>)}
                </div>
              )}
              {currentFood.notes && (<div className="recipe-modal-notes-section"><h4 className="recipe-modal-notes-title">Notes</h4><p className="recipe-modal-notes-text">{currentFood.notes}</p></div>)}
              <div className="recipe-modal-footer"><button onClick={() => setShowRecipeDetails(false)} className="recipe-modal-close-action-btn">Close</button></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}