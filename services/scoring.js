const answerModel = require('../models/answerModel');
const surveyModel = require('../models/surveyModel');
const protocoles = require('../protocoles');
const { pickLocalizedText } = require('../surveySchemas/localization');

const LOCALE_KEYS = ['ar', 'en'];
const LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

function normalizeLocalized(value, fallbackLabel = '') {
  if (!value) {
    return LOCALE_KEYS.reduce((acc, key) => {
      acc[key] = fallbackLabel;
      return acc;
    }, {});
  }
  if (typeof value === 'string') {
    return LOCALE_KEYS.reduce((acc, key) => {
      acc[key] = value;
      return acc;
    }, {});
  }
  if (typeof value === 'object') {
    const normalized = {};
    LOCALE_KEYS.forEach((key) => {
      if (typeof value[key] === 'string' && value[key].trim().length > 0) {
        normalized[key] = value[key];
      }
    });
    if (Object.keys(normalized).length === 0) {
      LOCALE_KEYS.forEach((key) => {
        normalized[key] = fallbackLabel;
      });
    }
    return normalized;
  }
  return LOCALE_KEYS.reduce((acc, key) => {
    acc[key] = fallbackLabel;
    return acc;
  }, {});
}

function collectReference(label, url, collector) {
  if (!url) return;
  const trimmedUrl = url.trim();
  if (!trimmedUrl.length) return;
  const existing = collector.get(trimmedUrl);
  if (existing) return;
  collector.set(trimmedUrl, {
    label: label && label.trim().length ? label.trim() : trimmedUrl,
    url: trimmedUrl,
  });
}

function stripLinks(text, collector) {
  if (typeof text !== 'string') {
    return '';
  }
  return text.replace(LINK_REGEX, (_, label, url) => {
    collectReference(label, url, collector);
    return label;
  });
}

function sanitizeLocalized(value, collector, fallback = '') {
  const normalized = normalizeLocalized(value, fallback);
  const result = {};
  LOCALE_KEYS.forEach((key) => {
    result[key] = stripLinks(normalized[key] || fallback, collector);
  });
  return result;
}

function buildSection(type, titleAr, titleEn, value, collector) {
  if (!value) return null;
  const localized = sanitizeLocalized(value, collector, '');

  const itemsByLocale = {};
  LOCALE_KEYS.forEach((key) => {
    const lines = (localized[key] || '')
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^[-•]\s*/, '').trim());
    itemsByLocale[key] = lines;
  });

  const maxLen = Math.max(
    ...LOCALE_KEYS.map((key) => itemsByLocale[key].length)
  );

  if (maxLen === 0) {
    return null;
  }

  const items = [];
  for (let i = 0; i < maxLen; i += 1) {
    const entry = {};
    LOCALE_KEYS.forEach((key) => {
      const source = itemsByLocale[key];
      entry[key] = source[i] || source[source.length - 1] || '';
    });
    items.push(entry);
  }

  return {
    type,
    title: normalizeLocalized({ ar: titleAr, en: titleEn }, titleAr),
    items,
  };
}

function extractRecommendationsFromSection(section) {
  if (!section || !Array.isArray(section.items)) {
    return [];
  }
  return section.items
    .map((item) => item.ar || item.en || '')
    .filter((text) => text.trim().length > 0);
}

function findInterpretationEntry(collection, idFallback) {
  if (!Array.isArray(collection) || collection.length === 0) return null;
  if (idFallback) {
    const match = collection.find((entry) => entry?.id === idFallback);
    if (match) return match;
  }
  return collection[0];
}

const SUPPORTED_OPERATORS = new Set(['>=', '>', '<=', '<', '==', '!=']);

function getScore(scores, key) {
  if (!key) return 0;
  const value = scores?.[key];
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function compareWithOperator(operator = '>=', left, right) {
  if (!SUPPORTED_OPERATORS.has(operator)) {
    return false;
  }
  switch (operator) {
    case '>=':
      return left >= right;
    case '>':
      return left > right;
    case '<=':
      return left <= right;
    case '<':
      return left < right;
    case '==':
      return left === right;
    case '!=':
      return left !== right;
    default:
      return false;
  }
}

function evaluateRuleCondition(scores = {}, condition = {}) {
  const { type } = condition || {};
  if (!type) return false;

  const operator = condition.operator || '>=';

  switch (type) {
    case 'difference': {
      const left = getScore(scores, condition.left);
      const rightInput = condition.right;
      const right = typeof rightInput === 'number' ? rightInput : getScore(scores, rightInput);
      const diff = left - right;
      const value = Number(condition.value ?? 0);
      return compareWithOperator(operator, diff, value);
    }
    case 'abs_difference': {
      const left = getScore(scores, condition.left);
      const rightInput = condition.right;
      const right = typeof rightInput === 'number' ? rightInput : getScore(scores, rightInput);
      const diff = Math.abs(left - right);
      const value = Number(condition.value ?? 0);
      return compareWithOperator(operator, diff, value);
    }
    case 'compare': {
      const left = getScore(scores, condition.left);
      const target = typeof condition.value === 'number'
        ? condition.value
        : getScore(scores, condition.right);
      return compareWithOperator(operator, left, target);
    }
    default:
      return false;
  }
}

function applySelectionRules(scores = {}, interpretationConfig = {}, helpers = {}) {
  const rules = Array.isArray(interpretationConfig.selection_rules)
    ? interpretationConfig.selection_rules
    : [];

  if (rules.length === 0) {
    return null;
  }

  const { selectEntry, getOverallEntry } = helpers;

  for (const rawRule of rules) {
    if (!rawRule || typeof rawRule !== 'object') continue;
    const conditions = Array.isArray(rawRule.conditions) ? rawRule.conditions : [];

    let conditionsPassed = true;
    for (const condition of conditions) {
      if (!evaluateRuleCondition(scores, condition)) {
        conditionsPassed = false;
        break;
      }
    }

    if (!conditionsPassed) continue;

    const groupKey = rawRule.group || rawRule.target_group || null;
    const entryId = rawRule.entry_id || rawRule.interpretation_id || rawRule.id || null;

    let entry = null;
    let primaryGroup = rawRule.primary_group;

    if (groupKey === 'overall') {
      entry = getOverallEntry ? getOverallEntry(entryId) : null;
      if (primaryGroup === undefined) primaryGroup = null;
    } else if (groupKey) {
      entry = selectEntry ? selectEntry(groupKey, entryId) : null;
      if (primaryGroup === undefined) primaryGroup = groupKey;
    } else if (entryId) {
      entry = (getOverallEntry && getOverallEntry(entryId))
        || (selectEntry && selectEntry(entryId, entryId));
      if (primaryGroup === undefined) {
        primaryGroup = null;
      }
    }

    if (!entry) continue;

    const category = entry.id || entryId || groupKey || null;

    return {
      entry,
      category,
      primaryGroup: primaryGroup ?? null,
    };
  }

  return null;
}

function resolveLeadershipCategory(perGroup = {}, interpretationConfig = {}) {
  if (!interpretationConfig?.groups) {
    return null;
  }

  const scores = {
    authoritarian: Number(perGroup.authoritarian) || 0,
    democratic: Number(perGroup.democratic) || 0,
    laissez_faire: Number(perGroup.laissez_faire) || 0,
  };

  const { authoritarian, democratic, laissez_faire: laissez } = scores;
  const groups = interpretationConfig.groups;
  const overallGroups = Array.isArray(groups.overall) ? groups.overall : [];

  const dominanceThreshold = 4;
  const proximityThreshold = 3;

  const selectEntry = (groupKey, entryId) => {
    const source = groups[groupKey];
    if (!Array.isArray(source)) return null;
    return findInterpretationEntry(source, entryId);
  };

  const getOverallEntry = (id) => findInterpretationEntry(overallGroups, id);

  const ruleResolution = applySelectionRules(scores, interpretationConfig, {
    selectEntry,
    getOverallEntry,
  });

  if (ruleResolution) {
    return ruleResolution;
  }

  // Dominant styles
  if (authoritarian >= democratic + dominanceThreshold && authoritarian >= laissez + dominanceThreshold) {
    const entry = selectEntry('authoritarian', 'dominant_authoritarian');
    if (entry) {
      return { entry, category: entry.id || 'dominant_authoritarian', primaryGroup: 'authoritarian' };
    }
  }
  if (democratic >= authoritarian + dominanceThreshold && democratic >= laissez + dominanceThreshold) {
    const entry = selectEntry('democratic', 'dominant_democratic');
    if (entry) {
      return { entry, category: entry.id || 'dominant_democratic', primaryGroup: 'democratic' };
    }
  }
  if (laissez >= authoritarian + dominanceThreshold && laissez >= democratic + dominanceThreshold) {
    const entry = selectEntry('laissez_faire', 'dominant_laissez_faire');
    if (entry) {
      return { entry, category: entry.id || 'dominant_laissez_faire', primaryGroup: 'laissez_faire' };
    }
  }

  // Balanced / mixed cases from overall group definitions
  if (Math.abs(authoritarian - democratic) <= proximityThreshold && Math.abs(authoritarian - laissez) <= proximityThreshold && Math.abs(democratic - laissez) <= proximityThreshold) {
    const entry = getOverallEntry('balanced_ambivalent');
    if (entry) {
      return { entry, category: entry.id || 'balanced_ambivalent', primaryGroup: null };
    }
  }

  if (Math.abs(authoritarian - democratic) <= proximityThreshold && authoritarian >= laissez + dominanceThreshold && democratic >= laissez + dominanceThreshold) {
    const entry = getOverallEntry('mixed_authoritarian_democratic');
    if (entry) {
      return { entry, category: entry.id || 'mixed_authoritarian_democratic', primaryGroup: 'authoritarian' };
    }
  }

  if (Math.abs(democratic - laissez) <= proximityThreshold && democratic >= authoritarian + dominanceThreshold && laissez >= authoritarian + dominanceThreshold) {
    const entry = getOverallEntry('mixed_democratic_laissez_faire');
    if (entry) {
      return { entry, category: entry.id || 'mixed_democratic_laissez_faire', primaryGroup: 'democratic' };
    }
  }

  // Fallback to highest scoring group
  const maxScore = Math.max(authoritarian, democratic, laissez);
  let primaryGroup = 'authoritarian';
  if (democratic === maxScore && democratic >= authoritarian && democratic >= laissez) {
    primaryGroup = 'democratic';
  } else if (laissez === maxScore && laissez >= authoritarian && laissez >= democratic) {
    primaryGroup = 'laissez_faire';
  }
  const fallbackEntry = selectEntry(primaryGroup);
  if (fallbackEntry) {
    return { entry: fallbackEntry, category: fallbackEntry.id || primaryGroup, primaryGroup };
  }

  return null;
}

function buildInterpretationResult(perGroup, interpretationConfig) {
  const resolved = resolveLeadershipCategory(perGroup, interpretationConfig);
  if (!resolved) {
    return null;
  }

  const { entry, category, primaryGroup } = resolved;

  const referencesCollector = new Map();

  const title = sanitizeLocalized(entry.title, referencesCollector, category);
  const description = sanitizeLocalized(entry.description, referencesCollector, '');

  const sections = [];
  const prosSection = buildSection('pros', 'الإيجابيات', 'Pros', entry?.pros, referencesCollector);
  if (prosSection) sections.push(prosSection);
  const consSection = buildSection('cons', 'السلبيات', 'Cons', entry?.cons, referencesCollector);
  if (consSection) sections.push(consSection);
  const recommendationsSection = buildSection('recommendations', 'التوصيات', 'Recommendations', entry?.recommendations, referencesCollector);
  if (recommendationsSection) sections.push(recommendationsSection);

  const recommendationsList = extractRecommendationsFromSection(recommendationsSection);
  const references = Array.from(referencesCollector.values());

  const resultPage = {
    pageId: category,
    group: primaryGroup,
    primaryGroup,
    title,
    interpretation: description,
    recommendations: recommendationsList,
    sections,
    references,
    template: {
      title,
      subtitle: normalizeLocalized({ ar: 'نتيجة الاستبيان', en: 'Survey result' }, ''),
      description,
      recommendations: recommendationsList,
      sections,
      styling: {
        theme: primaryGroup || 'custom',
        color: entry.color || '#2563eb',
      },
    },
  };

  const interpretationData = {
    title,
    description,
    sections,
    recommendations: recommendationsList,
    references,
    primaryGroup,
    color: entry.color || '#2563eb',
  };

  return { resultPage, interpretationData };
}

// Normalize scoring config keys to use DB question IDs instead of question order
// This ensures mappings/groups/weights match the response keys (which are DB IDs)
function normalizeScoringConfig(scoring, surveyJSON) {
  try {
    if (!scoring || !surveyJSON?.questions) return scoring;

    const questions = surveyJSON.questions;
    const orderToId = {};
    const idSet = new Set();
    const orderSet = new Set();

    for (const q of questions) {
      if (q?.id != null) idSet.add(Number(q.id));
      if (q?.question_order != null) orderSet.add(Number(q.question_order));
      if (q?.question_order != null && q?.id != null) {
        orderToId[Number(q.question_order)] = Number(q.id);
      }
    }

    const isNumericKey = (k) => /^\d+$/.test(k);
    const isOrderKey = (k) => isNumericKey(k) && orderSet.has(Number(k));
    const isIdKey = (k) => isNumericKey(k) && idSet.has(Number(k));

    const remapKeyIfOrder = (k) => {
      if (isOrderKey(k)) {
        const id = orderToId[Number(k)];
        return id != null ? String(id) : k;
      }
      return k;
    };

    const remapArrayIndicesToIds = (arr) => {
      if (!Array.isArray(arr)) return arr;
      return arr.map((n) => {
        const num = Number(n);
        if (!Number.isFinite(num)) return n;
        // Prefer mapping order->id; if not found and it's already an id, keep as number
        if (orderToId[num] != null) return Number(orderToId[num]);
        if (idSet.has(num)) return num;
        return num; // leave as-is
      });
    };

    // Create a shallow clone to avoid mutating original
    const normalized = { ...scoring };

    // Normalize mappings: keys should be DB IDs as strings
    if (normalized.mappings && typeof normalized.mappings === 'object') {
      const newMappings = {};
      for (const [k, v] of Object.entries(normalized.mappings)) {
        const targetKey = remapKeyIfOrder(k);
        newMappings[targetKey] = v; // keep value mapping shape unchanged
      }
      normalized.mappings = newMappings;
    }

    // Normalize groups: arrays should contain DB IDs (numbers)
    if (normalized.groups && typeof normalized.groups === 'object') {
      const newGroups = {};
      for (const [groupName, arr] of Object.entries(normalized.groups)) {
        newGroups[groupName] = remapArrayIndicesToIds(arr);
      }
      normalized.groups = newGroups;
    }

    // Normalize weights and weight_overrides: keys should be DB IDs as strings
    if (normalized.weights && typeof normalized.weights === 'object') {
      const newWeights = {};
      for (const [k, v] of Object.entries(normalized.weights)) {
        const targetKey = remapKeyIfOrder(k);
        newWeights[targetKey] = v;
      }
      normalized.weights = newWeights;
    }

    if (normalized.weight_overrides && typeof normalized.weight_overrides === 'object') {
      const newOverrides = {};
      for (const [k, v] of Object.entries(normalized.weight_overrides)) {
        const targetKey = remapKeyIfOrder(k);
        newOverrides[targetKey] = v;
      }
      normalized.weight_overrides = newOverrides;
    }

    // Thresholds are based on score ranges or group names and do not need remapping

    return normalized;
  } catch (e) {
    console.error('Error normalizing scoring config:', e);
    return scoring;
  }
}

function extractFallbackInterpretations(scoringType, interpretationConfig) {
  if (!interpretationConfig || typeof interpretationConfig !== 'object') {
    return null;
  }

  const groups = interpretationConfig.groups;
  if (scoringType === 'grouped') {
    return groups && typeof groups === 'object' ? groups : null;
  }

  if (Array.isArray(interpretationConfig)) {
    return interpretationConfig;
  }

  if (Array.isArray(groups?.overall)) {
    return groups.overall;
  }

  if (groups && typeof groups === 'object') {
    const firstMatch = Object.values(groups).find((value) => Array.isArray(value));
    if (firstMatch) {
      return firstMatch;
    }
  }

  return null;
}

function buildOptionValueLookup(questions = []) {
  const lookup = {};

  for (const question of questions) {
    const questionId = question?.id;
    if (questionId == null || !Array.isArray(question?.options)) {
      continue;
    }

    const optionMap = {};
    const addVariant = (variant, canonical) => {
      if (typeof variant !== 'string') return;
      const key = variant.trim().toLowerCase();
      if (!key) return;
      optionMap[key] = canonical;
    };

    for (const option of question.options) {
      if (!option) continue;
      const canonical = option?.value != null ? String(option.value) : null;
      if (!canonical) continue;

      addVariant(canonical, canonical);
      addVariant(canonical.replace(/\s+/g, '_'), canonical);

      const text = option.text;
      if (typeof text === 'string') {
        addVariant(text, canonical);
      } else if (text && typeof text === 'object') {
        Object.values(text).forEach((value) => addVariant(value, canonical));
      }

      if (option.label) addVariant(option.label, canonical);
    }

    if (Object.keys(optionMap).length > 0) {
      lookup[String(questionId)] = optionMap;
    }
  }

  return lookup;
}

function normalizeResponseValue(rawValue, optionMap) {
  if (rawValue === null || rawValue === undefined) {
    return rawValue;
  }

  if (typeof rawValue === 'number') {
    return rawValue;
  }

  const stringValue = String(rawValue).trim();
  if (stringValue.length === 0) {
    return rawValue;
  }

  const lowered = stringValue.toLowerCase();
  if (optionMap && optionMap[lowered] !== undefined) {
    return optionMap[lowered];
  }

  if (optionMap) {
    const normalizedKey = lowered.replace(/\s+/g, '_');
    if (optionMap[normalizedKey] !== undefined) {
      return optionMap[normalizedKey];
    }
    const compactKey = normalizedKey.replace(/[^a-z0-9_]/g, '');
    if (optionMap[compactKey] !== undefined) {
      return optionMap[compactKey];
    }
  }

  const numeric = Number(stringValue);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const slugCandidate = lowered
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+/, '')
    .replace(/_+$/, '');

  if (slugCandidate.length > 0) {
    return slugCandidate;
  }

  return stringValue;
}

function normalizeSurveyResponses(responses, questions = []) {
  if (!responses || typeof responses !== 'object') {
    return responses;
  }

  const optionLookup = buildOptionValueLookup(questions);
  const normalized = {};

  for (const [questionId, value] of Object.entries(responses)) {
    const map = optionLookup[questionId];
    if (Array.isArray(value)) {
      normalized[questionId] = value.map((entry) => normalizeResponseValue(entry, map));
    } else {
      normalized[questionId] = normalizeResponseValue(value, map);
    }
  }

  return normalized;
}

const calculateSurveyScore = async (userId, surveyId, options = {}) => {
  try {
    const surveyJSON = await surveyModel.getSurveyById(surveyId);
    if (!surveyJSON) throw new Error('Survey not found');

    const providedResponses = options?.responses;
    const responseSource = (providedResponses && Object.keys(providedResponses).length > 0)
      ? providedResponses
      : await answerModel.getUserAnswersForSurvey(userId, surveyId);

    if (!responseSource || Object.keys(responseSource).length === 0) {
      throw new Error('No responses found for this user and survey');
    }

    // Convert responses to have string keys to match scoring mappings
    const stringKeyResponses = {};
    for (const [questionId, value] of Object.entries(responseSource)) {
      const key = questionId != null ? questionId.toString().trim() : '';
      if (key.length === 0) continue;
      stringKeyResponses[key] = value;
    }

    // Build question order map for formula expressions (Q1 -> question_id)
    const questionOrderMap = {};
    if (surveyJSON.questions) {
      for (const question of surveyJSON.questions) {
        questionOrderMap[question.question_order] = question.id;
      }
    }

    // Ensure scoring is an object
    let scoring = surveyJSON.survey.scoring;
    if (!scoring || typeof scoring === 'string') {
      scoring = { type: scoring || 'sum' };
    }

    // Normalize scoring config to use DB question IDs if it was authored with question orders
    let normalizedScoring = normalizeScoringConfig(scoring, surveyJSON) || {};

    const normalizedResponses = normalizeSurveyResponses(stringKeyResponses, surveyJSON.questions);

    const hasInterpretations = (() => {
      const interpretations = normalizedScoring.interpretations;
      if (!interpretations) return false;
      if (Array.isArray(interpretations)) {
        return interpretations.length > 0;
      }
      return typeof interpretations === 'object' && Object.keys(interpretations).length > 0;
    })();

    if (!hasInterpretations) {
      const fallbackInterpretations = extractFallbackInterpretations(
        normalizedScoring.type || scoring.type || 'sum',
        surveyJSON?.survey?.interpretation
      );

      if (fallbackInterpretations) {
        normalizedScoring = {
          ...normalizedScoring,
          interpretations: fallbackInterpretations,
        };
      }
    }

    if (!providedResponses) {
      console.log('Survey ID:', surveyId);
      console.log('Scoring config (normalized):', JSON.stringify(normalizedScoring, null, 2));
      console.log('Responses:', normalizedResponses);
      console.log('Question order map:', questionOrderMap);
    }

    let result;
    switch (normalizedScoring.type) {
      case 'grouped':
        result = protocoles.scoreGrouped(normalizedResponses, normalizedScoring);
        break;
      case 'paired-options':
        result = protocoles.scorePairedOptions(normalizedResponses, normalizedScoring);
        break;
      case 'formula':
        // For formula, continue to use order-based Q variables via questionOrderMap
        result = protocoles.scoreFormula(normalizedResponses, normalizedScoring, questionOrderMap);
        break;
      // case 'function': removed due to security concerns with code injection
      case 'mixed_sign':
        result = protocoles.scoreMixedSign(normalizedResponses, normalizedScoring);
        break;
      case 'sum':
      default:
        result = protocoles.scoreSum(normalizedResponses, normalizedScoring);
        break;
    }

    const interpretationConfig = surveyJSON?.survey?.interpretation;

    let customInterpretation = null;
    if (normalizedScoring.type === 'grouped' && interpretationConfig && result?.perGroup) {
      customInterpretation = buildInterpretationResult(result.perGroup, interpretationConfig);
    }

    // Add metadata and result page information
    const enhancedResult = {
      ...result,
      surveyId,
      userId,
      scoringType: normalizedScoring.type,
      responseCount: Object.keys(normalizedResponses).length
    };

    // Helper: pick an authored result page from survey schema if present
    const pickAuthoredResultPage = () => {
      const scoring = surveyJSON?.survey?.scoring || {};
      const rp = scoring.result_pages;
      if (!rp) return null;

      const getOverallScore = () => {
        if (typeof result.score === 'number') return result.score;
        if (typeof result.total === 'number') return result.total;
        return 0;
      };

      const matchPage = (pages, score, groupName = null) => {
        if (!Array.isArray(pages)) return null;
        for (let i = 0; i < pages.length; i++) {
          const p = pages[i] || {};
          // Support either explicit min/max or a "range" string like "3-7"
          let min = p.min;
          let max = p.max;
          if ((min == null || max == null) && typeof p.range === 'string' && p.range.includes('-')) {
            const [mi, ma] = p.range.split('-').map(Number);
            if (Number.isFinite(mi)) min = mi;
            if (Number.isFinite(ma)) max = ma;
          }
          if (!Number.isFinite(min) || !Number.isFinite(max)) continue;
          if (score >= min && score <= max) {
            return {
              ...p,
              pageId: p.pageId || (groupName ? `result_page_${groupName}_${i + 1}` : `result_page_${i + 1}`),
              group: groupName || p.group || null,
            };
          }
        }
        return null;
      };

      if (normalizedScoring.type === 'grouped' && result?.perGroup) {
        const primaryGroup = Object.keys(result.perGroup).reduce((a, b) =>
          result.perGroup[a] > result.perGroup[b] ? a : b
        );
        const groupScore = result.perGroup[primaryGroup];

        // Try group-specific pages first
        if (rp.groups && rp.groups[primaryGroup]) {
          const page = matchPage(rp.groups[primaryGroup], groupScore, primaryGroup);
          if (page) return { ...page, primaryGroup };
        }

        // Fallback to overall pages using overall total
        if (Array.isArray(rp.overall)) {
          const page = matchPage(rp.overall, getOverallScore(), null);
          if (page) return { ...page, primaryGroup };
        }
        return null;
      } else {
        // Non-grouped: try overall pages by total/score
        if (Array.isArray(rp.overall)) {
          const page = matchPage(rp.overall, getOverallScore(), null);
          if (page) return page;
        }
        return null;
      }
    };

    // Prefer authored result pages if present; otherwise keep threshold-derived hint for backward compatibility
    const authoredPage = pickAuthoredResultPage();
    const finalResultPage = customInterpretation?.resultPage || authoredPage;

    if (finalResultPage) {
      enhancedResult.resultPage = finalResultPage;
    } else if (result.threshold) {
      enhancedResult.resultPage = {
        level: result.threshold.level,
        levelName: result.threshold.levelName,
        totalLevels: result.threshold.totalLevels,
        pageId: `result_page_${result.threshold.level}`,
        pageName: pickLocalizedText(result.threshold.current?.interpretation) || 'Unknown Result'
      };
    } else if (result.groupThresholds) {
      // For grouped scoring, find the primary group's result page based on thresholds
      const primaryGroup = Object.keys(result.perGroup).reduce((a, b) =>
        result.perGroup[a] > result.perGroup[b] ? a : b
      );
      const primaryThreshold = result.groupThresholds[primaryGroup];
      if (primaryThreshold?.threshold) {
        enhancedResult.resultPage = {
          level: primaryThreshold.threshold.level,
          levelName: primaryThreshold.threshold.levelName,
          totalLevels: primaryThreshold.threshold.totalLevels,
          pageId: `result_page_${primaryGroup}_${primaryThreshold.threshold.level}`,
          pageName: pickLocalizedText(primaryThreshold.threshold.current?.interpretation) || `${primaryGroup} Result`,
          primaryGroup
        };
      }
    }

    if (customInterpretation?.interpretationData) {
      enhancedResult.interpretationData = customInterpretation.interpretationData;
      enhancedResult.interpretation = pickLocalizedText(customInterpretation.interpretationData.description);
    }

    return enhancedResult;

  } catch (error) {
    console.error('Error calculating survey score:', error);
    throw error;
  }
};

module.exports = { calculateSurveyScore };
