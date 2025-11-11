const pool = require("../db");
const {
  buildLocalizedArrayFromLegacy,
  buildLocalizedFromLegacy,
  normalizeLocalizedInput,
  normalizeLocalizedOptionalInput,
  normalizeLocalizedArrayInput,
  normalizeLocalizedOutput,
  normalizeLocalizedArrayOutput,
  normalizeOptionsInput,
  normalizeOptionsOutput,
  pickLocalizedText,
} = require("../surveySchemas/localization");

// Utility: log a warning when scoring normalization alters keys/structure
function logNormalizationWarning(original, normalized, surveyId, operation) {
  try {
    const orig = original || {};
    const norm = normalized || {};
    const changed = JSON.stringify(orig) !== JSON.stringify(norm);
    if (!changed) return;

    const sectionChanged = (section) => {
      const a = orig[section];
      const b = norm[section];
      if (a == null && b == null) return false;
      if ((a == null) !== (b == null)) return true;
      if (typeof a !== 'object' || typeof b !== 'object') return a !== b;
      // For mappings/weights: compare key sets
      if (section === 'mappings' || section === 'weights' || section === 'weight_overrides') {
        const ak = new Set(Object.keys(a));
        const bk = new Set(Object.keys(b));
        if (ak.size !== bk.size) return true;
        for (const k of ak) if (!bk.has(k)) return true;
        return false;
      }
      // For groups: compare per-group arrays
      if (section === 'groups') {
        const ag = Object.keys(a || {});
        const bg = Object.keys(b || {});
        if (ag.length !== bg.length) return true;
        for (const g of ag) {
          const arrA = Array.isArray(a[g]) ? a[g].map(String) : [];
          const arrB = Array.isArray(b[g]) ? b[g].map(String) : [];
          if (arrA.length !== arrB.length) return true;
          for (let i = 0; i < arrA.length; i++) if (arrA[i] !== arrB[i]) return true;
        }
        return false;
      }
      return JSON.stringify(a) !== JSON.stringify(b);
    };

    const sections = ['mappings', 'groups', 'weights', 'weight_overrides'];
    const changedSections = sections.filter(sectionChanged);

    console.warn(
      `[ScoringNormalization] Survey ${surveyId} ${operation}: normalized scoring config to question IDs. Sections changed: ${changedSections.join(', ') || 'unknown'}`
    );
  } catch (e) {
    console.warn(`[ScoringNormalization] Survey ${surveyId} ${operation}: normalization detected but failed to summarize changes.`);
  }
}

const isPlainObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

const toNumberOrNull = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

const normalizeMetadata = (metadata = {}) => {
  if (!metadata || typeof metadata !== "object") return {};
  const normalized = { ...metadata };

  const applyLocalizedField = (key) => {
    const legacy = buildLocalizedFromLegacy(
      normalized[`${key}_en`],
      normalized[`${key}_ar`]
    );
    if (legacy && normalized[key] === undefined) {
      normalized[key] = legacy;
    }

    delete normalized[`${key}_en`];
    delete normalized[`${key}_ar`];

    if (normalized[key] !== undefined) {
      const localized = normalizeLocalizedOptionalInput(normalized[key], `metadata.${key}`);
      if (localized) {
        normalized[key] = localized;
      } else {
        delete normalized[key];
      }
    }
  };

  ["description", "instructions", "estimated_time", "target_audience"].forEach(applyLocalizedField);

  return normalized;
};

const normalizeInterpretationEntry = (entry, path) => {
  const source = entry || {};

  const minScore = toNumberOrNull(source.min_score);
  const maxScore = toNumberOrNull(source.max_score);

  if (minScore === null || maxScore === null) {
    throw new Error(`${path} must include numeric min_score and max_score values`);
  }

  const titleSource = source.title ?? buildLocalizedFromLegacy(source.title_en, source.title_ar);
  const descriptionSource =
    source.description ?? buildLocalizedFromLegacy(source.description_en, source.description_ar);
  const recommendationsSource = source.recommendations ??
    buildLocalizedArrayFromLegacy(source.recommendations_en || [], source.recommendations_ar || []);

  const recommendations = Array.isArray(recommendationsSource)
    ? recommendationsSource.map((rec, idx) =>
        normalizeLocalizedInput(rec, `${path}.recommendations[${idx}]`)
      )
    : [];

  const normalized = {
    min_score: minScore,
    max_score: maxScore,
    title: normalizeLocalizedInput(titleSource, `${path}.title`),
    description: normalizeLocalizedInput(descriptionSource, `${path}.description`),
    recommendations,
  };

  ["color", "icon", "theme"].forEach((key) => {
    if (source[key] !== undefined) {
      normalized[key] = source[key];
    }
  });

  return normalized;
};

const normalizeInterpretationsInput = (interpretations, path) => {
  if (!interpretations) return undefined;

  if (Array.isArray(interpretations)) {
    return interpretations.map((entry, idx) =>
      normalizeInterpretationEntry(entry, `${path}[${idx}]`)
    );
  }

  if (isPlainObject(interpretations)) {
    const normalized = {};
    for (const [group, entries] of Object.entries(interpretations)) {
      if (!Array.isArray(entries)) continue;
      normalized[group] = entries.map((entry, idx) =>
        normalizeInterpretationEntry(entry, `${path}.${group}[${idx}]`)
      );
    }
    return normalized;
  }

  return undefined;
};

const normalizeThresholdsInput = (thresholds, path) => {
  if (!thresholds || typeof thresholds !== "object") return undefined;
  const normalized = {};

  for (const [key, value] of Object.entries(thresholds)) {
    if (isPlainObject(value) && !("en" in value) && !("ar" in value)) {
      const nested = normalizeThresholdsInput(value, `${path}.${key}`);
      if (nested !== undefined) {
        normalized[key] = nested;
      }
    } else {
      normalized[key] = normalizeLocalizedInput(value, `${path}.${key}`);
    }
  }

  return normalized;
};

const normalizeScoringInput = (scoring = {}) => {
  if (!scoring || typeof scoring !== "object") {
    return { type: "sum" };
  }

  const normalized = { ...scoring };
  normalized.type = scoring.type || "sum";

  const descriptionSource = scoring.description ??
    buildLocalizedFromLegacy(scoring.description_en, scoring.description_ar);

  if (descriptionSource !== undefined) {
    const description = normalizeLocalizedOptionalInput(descriptionSource, "scoring.description");
    if (description) {
      normalized.description = description;
    } else {
      delete normalized.description;
    }
  }

  if (normalized.thresholds) {
    const thresholds = normalizeThresholdsInput(normalized.thresholds, "scoring.thresholds");
    if (thresholds) normalized.thresholds = thresholds;
  }

  if (normalized.interpretations) {
    const interpretations = normalizeInterpretationsInput(normalized.interpretations, "scoring.interpretations");
    if (interpretations) normalized.interpretations = interpretations;
  }

  return normalized;
};

const normalizeQuestionInput = (question, index) => {
  const source = question || {};
  const questionPath = `questions[${index}]`;

  const questionTextSource =
    source.question_text ??
    source.text ??
    buildLocalizedFromLegacy(source.question_text_en, source.question_text_ar);

  const questionType = source.question_type || source.type;
  if (!questionType) {
    throw new Error(`${questionPath}.question_type is required`);
  }

  const legacyOptions = Array.isArray(source.options_en) || Array.isArray(source.options_ar)
    ? (source.options_en || []).map((enText, optIndex) => ({
        value:
          (Array.isArray(source.option_values) && source.option_values[optIndex]) ||
          (Array.isArray(source.options_values) && source.options_values[optIndex]) ||
          enText,
        text: buildLocalizedFromLegacy(
          enText,
          Array.isArray(source.options_ar) ? source.options_ar[optIndex] : undefined
        ),
        group: Array.isArray(source.options_groups) ? source.options_groups[optIndex] : undefined,
      }))
    : null;

  let optionsSource = source.options ?? legacyOptions;
  if (legacyOptions && (Array.isArray(source.option_values) || Array.isArray(source.options_en))) {
    const optionsAreStrings = Array.isArray(source.options) && source.options.every((opt) => typeof opt === 'string');
    if (!source.options || optionsAreStrings) {
      optionsSource = legacyOptions;
    }
  }

  const placeholderSource =
    source.placeholder ?? buildLocalizedFromLegacy(source.placeholder_en, source.placeholder_ar);
  const helpTextSource =
    source.help_text ??
    source.helper_text ??
    buildLocalizedFromLegacy(source.help_text_en, source.help_text_ar);

  const weightValue =
    typeof source.weight === "number"
      ? source.weight
      : source.weight != null
      ? Number(source.weight)
      : null;

  return {
    question_text: normalizeLocalizedInput(questionTextSource, `${questionPath}.question_text`),
    question_type: questionType,
    question_order: source.question_order ?? source.order ?? index + 1,
    is_required: Boolean(source.is_required),
    options: normalizeOptionsInput(optionsSource, `${questionPath}.options`),
    min_value: source.min_value ?? null,
    max_value: source.max_value ?? null,
    placeholder: normalizeLocalizedOptionalInput(placeholderSource, `${questionPath}.placeholder`),
    help_text: normalizeLocalizedOptionalInput(helpTextSource, `${questionPath}.help_text`),
    question_route: source.question_route ?? null,
    flag: source.flag ?? null,
    weight: Number.isFinite(weightValue) ? weightValue : 1,
  };
};

const normalizeSurveyPayload = (payload) => {
  if (!payload || typeof payload !== "object") {
    throw new Error("Survey payload must be an object");
  }

  const normalized = { ...payload };

  const nameSource = normalized.name ?? buildLocalizedFromLegacy(normalized.name_en, normalized.name_ar);
  normalized.name = normalizeLocalizedInput(nameSource, "name");

  normalized.metadata = normalizeMetadata(normalized.metadata || {});
  normalized.status = normalized.status || "draft";
  if (normalized.interpretation === undefined) {
    normalized.interpretation = {};
  }

  if (!Array.isArray(normalized.questions) || normalized.questions.length === 0) {
    throw new Error("Survey must include at least one question");
  }

  normalized.questions = normalized.questions.map((question, index) =>
    normalizeQuestionInput(question, index)
  );

  normalized.scoring = normalizeScoringInput(normalized.scoring || { type: "sum" });

  return normalized;
};

const formatMetadataFromDb = (metadata = {}) => {
  if (!metadata || typeof metadata !== "object") return {};
  const formatted = { ...metadata };
  ["description", "instructions", "estimated_time", "target_audience"].forEach((key) => {
    if (formatted[key] !== undefined && formatted[key] !== null) {
      formatted[key] = normalizeLocalizedOutput(formatted[key]);
    }
  });
  return formatted;
};

const formatInterpretationOutput = (entry) => {
  if (!entry || typeof entry !== "object") return entry;
  const formatted = { ...entry };
  if (formatted.title !== undefined) {
    formatted.title = normalizeLocalizedOutput(formatted.title);
  }
  if (formatted.description !== undefined) {
    formatted.description = normalizeLocalizedOutput(formatted.description);
  }
  if (Array.isArray(formatted.recommendations)) {
    formatted.recommendations = formatted.recommendations
      .map((rec) => normalizeLocalizedOutput(rec))
      .filter(Boolean);
  }
  return formatted;
};

const formatInterpretationsOutput = (interpretations) => {
  if (Array.isArray(interpretations)) {
    return interpretations.map((entry) => formatInterpretationOutput(entry));
  }
  if (isPlainObject(interpretations)) {
    const formatted = {};
    for (const [group, entries] of Object.entries(interpretations)) {
      if (Array.isArray(entries)) {
        formatted[group] = entries.map((entry) => formatInterpretationOutput(entry));
      } else if (isPlainObject(entries)) {
        formatted[group] = formatInterpretationsOutput(entries);
      } else {
        formatted[group] = entries;
      }
    }
    return formatted;
  }
  return interpretations;
};

const formatThresholdsOutput = (thresholds) => {
  if (!thresholds || typeof thresholds !== "object") return thresholds;
  const formatted = {};
  for (const [key, value] of Object.entries(thresholds)) {
    if (isPlainObject(value) && !("en" in value) && !("ar" in value)) {
      formatted[key] = formatThresholdsOutput(value);
    } else {
      formatted[key] = normalizeLocalizedOutput(value);
    }
  }
  return formatted;
};

const formatScoringFromDb = (scoring = {}) => {
  if (!scoring || typeof scoring !== "object") return scoring;
  const formatted = { ...scoring };
  if (formatted.description !== undefined) {
    formatted.description = normalizeLocalizedOutput(formatted.description);
  }
  if (formatted.thresholds) {
    formatted.thresholds = formatThresholdsOutput(formatted.thresholds);
  }
  if (formatted.interpretations) {
    formatted.interpretations = formatInterpretationsOutput(formatted.interpretations);
  }
  return formatted;
};

const formatQuestionRow = (row) => {
  if (!row) return row;
  const formatted = { ...row };
  formatted.question_text = normalizeLocalizedOutput(formatted.question_text);
  formatted.placeholder = formatted.placeholder !== undefined ? normalizeLocalizedOutput(formatted.placeholder) : null;
  formatted.help_text = formatted.help_text !== undefined ? normalizeLocalizedOutput(formatted.help_text) : null;
  if (formatted.options !== undefined && formatted.options !== null) {
    formatted.options = normalizeOptionsOutput(formatted.options);
  }
  if (formatted.weight !== undefined && formatted.weight !== null) {
    const weightNum = Number(formatted.weight);
    formatted.weight = Number.isFinite(weightNum) ? weightNum : formatted.weight;
  }
  return formatted;
};

const formatSurveyRow = (row) => {
  if (!row) return null;
  const formatted = { ...row };
  formatted.name = normalizeLocalizedOutput(formatted.name);
  if (formatted.metadata) {
    formatted.metadata = formatMetadataFromDb(formatted.metadata);
  }
  if (formatted.scoring) {
    formatted.scoring = formatScoringFromDb(formatted.scoring);
  }
  if (formatted.interpretation) {
    formatted.interpretation = formatInterpretationsOutput(formatted.interpretation);
  }
  if (formatted.last_completed_at) {
    formatted.last_completed_at = new Date(formatted.last_completed_at);
  }
  return formatted;
};

const getSurveys = async (options = {}) => {
  const {
    statuses,
    categories,
    userId,
    excludeWithinDays = 0,
    mandatoryOnly = false,
    limit,
  } = options;

  const params = [];
  const whereClauses = [];

  let cte = '';
  let joinClause = '';
  let selectFields = 's.*';

  if (userId) {
    params.push(userId);
    const userParamIndex = params.length;
    cte = `WITH last_completion AS (
      SELECT ss.survey_id, MAX(ss.submitted_at) AS last_completed_at
      FROM survey_submissions ss
      WHERE ss.user_id = $${userParamIndex} AND ss.status = 'completed'
      GROUP BY ss.survey_id
    ) `;
    joinClause = ' LEFT JOIN last_completion lc ON lc.survey_id = s.id';
    selectFields += ', lc.last_completed_at';
  } else {
    selectFields += ', NULL::timestamp AS last_completed_at';
  }

  if (Array.isArray(statuses) && statuses.length > 0) {
    params.push(statuses);
    whereClauses.push(`s.status = ANY($${params.length})`);
  }

  if (Array.isArray(categories) && categories.length > 0) {
    params.push(categories.map((cat) => cat.toLowerCase()));
    whereClauses.push(`LOWER(COALESCE(s.metadata->>'category', '')) = ANY($${params.length})`);
  }

  if (userId && excludeWithinDays && excludeWithinDays > 0) {
    params.push(excludeWithinDays);
    const daysParamIndex = params.length;
    whereClauses.push(`(lc.last_completed_at IS NULL OR lc.last_completed_at < NOW() - ($${daysParamIndex} * INTERVAL '1 day'))`);
  }

  if (mandatoryOnly) {
    whereClauses.push(`(
      (s.metadata ? 'mandatory' AND (
        s.metadata->'mandatory' = 'true'::jsonb OR
        LOWER(COALESCE(s.metadata->>'mandatory', '')) IN ('true', 'yes', '1', 'daily', 'always', 'checkin', 'check_in') OR
        LOWER(COALESCE((s.metadata->'mandatory'->>'enabled'), '')) IN ('true', 'yes', '1')
      ))
      OR LOWER(COALESCE(s.metadata->>'mandatory_survey', '')) IN ('true', 'yes', '1', 'daily', 'always')
      OR LOWER(COALESCE(s.metadata->>'type', '')) IN ('checkin', 'check_in', 'daily_check', 'mood_check')
    )`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  if (limit && Number.isFinite(Number(limit)) && Number(limit) > 0) {
    params.push(Number(limit));
  }

  const query = `${cte}SELECT ${selectFields}
    FROM surveys s${joinClause}
    ${whereSql}
    ORDER BY s.created_at DESC, s.id ASC
    ${limit && Number(limit) > 0 ? `LIMIT $${params.length}` : ''}`;

  const res = await pool.query(query, params);
  return res.rows.map(formatSurveyRow);
};

const getSurveyById = async (id) => {
  const client = await pool.connect();
  try {
    const surveyRes = await client.query(
      `SELECT * FROM surveys WHERE id = $1`,
      [id]
    );
    const surveyRow = surveyRes.rows[0];
    if (!surveyRow) return null;

    const questionsRes = await client.query(
      `SELECT
         id,
         question_text, 
         question_type, 
         is_required, 
         options, 
         min_value,  
         max_value, 
         question_order, 
         placeholder, 
         help_text, 
         question_route,
         flag
       FROM questions
       WHERE survey_id = $1
       ORDER BY question_order ASC, id ASC`,
      [id]
    );

    return {
      survey: formatSurveyRow(surveyRow),
      questions: questionsRes.rows.map(formatQuestionRow),
    };
  } finally {
    client.release();
  }
};

const createSurvey = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const normalized = normalizeSurveyPayload(data);

    const surveyRes = await client.query(
      `INSERT INTO surveys (name, metadata, status, scoring, interpretation)
       VALUES ($1::jsonb, $2::jsonb, $3, $4::jsonb, $5::jsonb)
       RETURNING *`,
      [
        JSON.stringify(normalized.name),
        JSON.stringify(normalized.metadata),
        normalized.status || 'draft',
        JSON.stringify(normalized.scoring),
        JSON.stringify(normalized.interpretation || {}),
      ]
    );
    const surveyRow = surveyRes.rows[0];

    const questionRows = [];
    const formattedQuestions = [];

    for (let i = 0; i < normalized.questions.length; i += 1) {
      const q = normalized.questions[i];

      const questionRes = await client.query(
        `INSERT INTO questions
           (survey_id, question_text, question_type, is_required, options, min_value, max_value, question_order, placeholder, help_text, question_route, flag, weight)
         VALUES
           ($1, $2::jsonb, $3, $4, $5::jsonb, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12, $13)
         RETURNING *`,
        [
          surveyRow.id,
          JSON.stringify(q.question_text),
          q.question_type,
          q.is_required,
          q.options ? JSON.stringify(q.options) : null,
          q.min_value,
          q.max_value,
          q.question_order,
          q.placeholder ? JSON.stringify(q.placeholder) : null,
          q.help_text ? JSON.stringify(q.help_text) : null,
          q.question_route,
          q.flag,
          q.weight,
        ]
      );

      const insertedQuestion = questionRes.rows[0];
      questionRows.push(insertedQuestion);
      formattedQuestions.push(formatQuestionRow(insertedQuestion));
    }

    let processedScoring = normalized.scoring;

    if (processedScoring && (processedScoring.type === 'grouped' || processedScoring.type === 'formula')) {
      const updatedScoring = await updateScoringWithQuestionIds(processedScoring, questionRows);
      logNormalizationWarning(processedScoring, updatedScoring, surveyRow.id, 'create');
      await client.query(
        `UPDATE surveys SET scoring = $1::jsonb WHERE id = $2`,
        [JSON.stringify(updatedScoring), surveyRow.id]
      );
      processedScoring = updatedScoring;
    } else if (processedScoring && processedScoring.type === 'sum') {
      const updatedScoring = await updateSumScoringWithQuestionIds(processedScoring, questionRows);
      logNormalizationWarning(processedScoring, updatedScoring, surveyRow.id, 'create');
      await client.query(
        `UPDATE surveys SET scoring = $1::jsonb WHERE id = $2`,
        [JSON.stringify(updatedScoring), surveyRow.id]
      );
      processedScoring = updatedScoring;
    }

    await client.query("COMMIT");

    const formattedSurvey = formatSurveyRow({
      ...surveyRow,
      scoring: processedScoring,
    });

    return {
      survey: formattedSurvey,
      questions: formattedQuestions,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// Helper function to update sum scoring configuration with actual question IDs
const updateSumScoringWithQuestionIds = async (scoringConfig, questions) => {
  const updatedScoring = { ...scoringConfig };
  
  // Create a mapping from question order to question ID
  const orderToIdMap = {};
  questions.forEach(q => {
    orderToIdMap[q.question_order] = q.id.toString();
  });

  // Create a reverse mapping from question ID to question order (for validation)
  const idToOrderMap = {};
  questions.forEach(q => {
    idToOrderMap[q.id.toString()] = q.question_order;
  });

  // Update mappings to use actual question IDs
  if (scoringConfig.mappings) {
    const updatedMappings = {};
    for (const [questionKey, mapping] of Object.entries(scoringConfig.mappings)) {
      let questionId;
      
      // Check if the key is a question order or question ID
      if (orderToIdMap[questionKey] !== undefined) {
        // It's a question order, convert to question ID
        questionId = orderToIdMap[questionKey];
      } else if (idToOrderMap[questionKey] !== undefined) {
        // It's already a question ID, keep as is
        questionId = questionKey;
      } else {
        // Unknown format, keep as is
        questionId = questionKey;
      }
      
      updatedMappings[questionId] = mapping;
    }
    updatedScoring.mappings = updatedMappings;
  }

  // Update weight_overrides to use actual question IDs
  if (scoringConfig.weight_overrides) {
    const updatedWeightOverrides = {};
    for (const [questionKey, weight] of Object.entries(scoringConfig.weight_overrides)) {
      let questionId;
      
      // Check if the key is a question order or question ID
      if (orderToIdMap[questionKey] !== undefined) {
        // It's a question order, convert to question ID
        questionId = orderToIdMap[questionKey];
      } else if (idToOrderMap[questionKey] !== undefined) {
        // It's already a question ID, keep as is
        questionId = questionKey;
      } else {
        // Unknown format, keep as is
        questionId = questionKey;
      }
      
      updatedWeightOverrides[questionId] = weight;
    }
    updatedScoring.weight_overrides = updatedWeightOverrides;
  }

  // Extract weights from question objects and add to scoring config
  const questionWeights = {};
  questions.forEach(q => {
    if (q.weight && q.weight !== 1) {
      questionWeights[q.id.toString()] = q.weight;
    }
  });
  
  // Merge question weights with any existing weights, with weight_overrides taking precedence
  if (Object.keys(questionWeights).length > 0) {
    updatedScoring.weights = {
      ...questionWeights,
      ...updatedScoring.weights
    };
  }

  return updatedScoring;
};

// Helper function to update scoring configuration with actual question IDs
const updateScoringWithQuestionIds = async (scoringConfig, questions) => {
  const updatedScoring = { ...scoringConfig };
  
  // Create a mapping from question order to question ID
  const orderToIdMap = {};
  questions.forEach(q => {
    orderToIdMap[q.question_order] = q.id.toString();
  });

  // Create a reverse mapping from question ID to question order (for validation)
  const idToOrderMap = {};
  questions.forEach(q => {
    idToOrderMap[q.id.toString()] = q.question_order;
  });

  if (scoringConfig.type === 'grouped' && scoringConfig.groups) {
    // Update groups to use actual question IDs
    const updatedGroups = {};
    for (const [groupName, questionIds] of Object.entries(scoringConfig.groups)) {
      // Check if the group contains question orders or question IDs
      const isUsingOrders = questionIds.some(id => orderToIdMap[id] !== undefined);
      
      if (isUsingOrders) {
        // Convert question orders to question IDs
        updatedGroups[groupName] = questionIds.map(order => 
          orderToIdMap[order] || order.toString()
        );
      } else {
        // Already using question IDs, keep as is
        updatedGroups[groupName] = questionIds;
      }
    }
    updatedScoring.groups = updatedGroups;

    // Update mappings to use actual question IDs
    if (scoringConfig.mappings) {
      const updatedMappings = {};
      for (const [questionKey, mapping] of Object.entries(scoringConfig.mappings)) {
        let questionId;
        
        // Check if the key is a question order or question ID
        if (orderToIdMap[questionKey] !== undefined) {
          // It's a question order, convert to question ID
          questionId = orderToIdMap[questionKey];
        } else if (idToOrderMap[questionKey] !== undefined) {
          // It's already a question ID, keep as is
          questionId = questionKey;
        } else {
          // Unknown format, keep as is
          questionId = questionKey;
        }
        
        updatedMappings[questionId] = mapping;
      }
      updatedScoring.mappings = updatedMappings;
    }
  }

  if (scoringConfig.type === 'formula') {
    // Update mappings for formula scoring
    if (scoringConfig.mappings) {
      const updatedMappings = {};
      for (const [questionKey, mapping] of Object.entries(scoringConfig.mappings)) {
        let questionId;
        
        // Check if the key is a question order or question ID
        if (orderToIdMap[questionKey] !== undefined) {
          // It's a question order, convert to question ID
          questionId = orderToIdMap[questionKey];
        } else if (idToOrderMap[questionKey] !== undefined) {
          // It's already a question ID, keep as is
          questionId = questionKey;
        } else {
          // Unknown format, keep as is
          questionId = questionKey;
        }
        
        updatedMappings[questionId] = mapping;
      }
      updatedScoring.mappings = updatedMappings;
    }

    // Update expression to use actual question IDs
    if (scoringConfig.expression) {
      let updatedExpression = scoringConfig.expression;
      for (const [order, id] of Object.entries(orderToIdMap)) {
        const regex = new RegExp(`\\b${order}\\b`, 'g');
        updatedExpression = updatedExpression.replace(regex, id);
      }
      updatedScoring.expression = updatedExpression;
    }
  }

  // Handle weight_overrides for all scoring types
  if (scoringConfig.weight_overrides) {
    const updatedWeightOverrides = {};
    for (const [questionKey, weight] of Object.entries(scoringConfig.weight_overrides)) {
      let questionId;
      
      // Check if the key is a question order or question ID
      if (orderToIdMap[questionKey] !== undefined) {
        // It's a question order, convert to question ID
        questionId = orderToIdMap[questionKey];
      } else if (idToOrderMap[questionKey] !== undefined) {
        // It's already a question ID, keep as is
        questionId = questionKey;
      } else {
        // Unknown format, keep as is
        questionId = questionKey;
      }
      
      updatedWeightOverrides[questionId] = weight;
    }
    updatedScoring.weight_overrides = updatedWeightOverrides;
  }

  // Extract weights from question objects and add to scoring config
  const questionWeights = {};
  questions.forEach(q => {
    if (q.weight && q.weight !== 1) {
      questionWeights[q.id.toString()] = q.weight;
    }
  });
  
  // Merge question weights with any existing weights, with weight_overrides taking precedence
  if (Object.keys(questionWeights).length > 0) {
    updatedScoring.weights = {
      ...questionWeights,
      ...updatedScoring.weights
    };
  }

  return updatedScoring;
};

const updateSurvey = async (updateData, id) => {
  const fields = [];
  const values = [];
  let paramIndex = 1;
  let fullSurvey = null;

  if (updateData.name !== undefined) {
    const normalizedName = normalizeLocalizedInput(updateData.name, 'name');
    fields.push(`name = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(normalizedName));
    paramIndex++;
  }

  if (updateData.metadata !== undefined) {
    const normalizedMetadata = normalizeMetadata(updateData.metadata || {});
    fields.push(`metadata = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(normalizedMetadata));
    paramIndex++;
  }

  if (updateData.status !== undefined) {
    fields.push(`status = $${paramIndex}`);
    values.push(updateData.status);
    paramIndex++;
  }

  if (updateData.scoring !== undefined) {
    if (!fullSurvey) {
      fullSurvey = await getSurveyById(id);
    }
    const questions = fullSurvey?.questions || [];
    let normalizedScoring = normalizeScoringInput(updateData.scoring || {});

    if (normalizedScoring && questions.length > 0) {
      if (normalizedScoring.type === 'sum') {
        const norm = await updateSumScoringWithQuestionIds(normalizedScoring, questions);
        logNormalizationWarning(normalizedScoring, norm, id, 'update');
        normalizedScoring = norm;
      } else if (normalizedScoring.type === 'grouped' || normalizedScoring.type === 'formula') {
        const norm = await updateScoringWithQuestionIds(normalizedScoring, questions);
        logNormalizationWarning(normalizedScoring, norm, id, 'update');
        normalizedScoring = norm;
      }
    }

    fields.push(`scoring = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(normalizedScoring));
    paramIndex++;
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  const query = `UPDATE surveys SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
  await pool.query(query, values);
};

// Helper function to deep merge objects
const deepMerge = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      // If the target also has this key and it's an object, merge recursively
      if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
        result[key] = deepMerge(result[key], source[key]);
      } else {
        // Otherwise, replace with the source value
        result[key] = { ...source[key] };
      }
    } else {
      // For primitive values and arrays, replace directly
      result[key] = source[key];
    }
  }
  
  return result;
};

const patchSurvey = async (updateData, id, currentSurvey) => {
  const client = await pool.connect();
  
  try {
    await client.query("BEGIN");
    
    const fields = [];
    const values = [];
    let paramIndex = 1;
    const currentMetadata = currentSurvey.survey?.metadata || {};
    const currentScoring = currentSurvey.survey?.scoring || {};
    const currentQuestions = currentSurvey?.questions || [];

    if (updateData.name !== undefined) {
      const normalizedName = normalizeLocalizedInput(updateData.name, 'name');
      fields.push(`name = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(normalizedName));
      paramIndex++;
    }

    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updateData.status);
      paramIndex++;
    }

    let metadataPatch = null;
    if (updateData.metadata !== undefined) {
      metadataPatch = normalizeMetadata(updateData.metadata || {});
    }
    if (metadataPatch) {
      const mergedMetadata = normalizeMetadata(deepMerge(currentMetadata, metadataPatch));
      fields.push(`metadata = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(mergedMetadata));
      paramIndex++;
    }

    if (updateData.interpretation !== undefined) {
      fields.push(`interpretation = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(updateData.interpretation || {}));
      paramIndex++;
    }

    if (updateData.scoring !== undefined) {
      let mergedScoring = deepMerge(currentScoring, updateData.scoring || {});
      mergedScoring = normalizeScoringInput(mergedScoring);

      if (mergedScoring?.type === 'sum') {
        const norm = await updateSumScoringWithQuestionIds(mergedScoring, currentQuestions);
        logNormalizationWarning(mergedScoring, norm, id, 'patch');
        mergedScoring = norm;
      } else if (mergedScoring?.type === 'grouped' || mergedScoring?.type === 'formula') {
        const norm = await updateScoringWithQuestionIds(mergedScoring, currentQuestions);
        logNormalizationWarning(mergedScoring, norm, id, 'patch');
        mergedScoring = norm;
      }

      fields.push(`scoring = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(mergedScoring));
      paramIndex++;
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(id);
    const query = `UPDATE surveys SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    await client.query(query, values);
    
    await client.query("COMMIT");
    
    return await getSurveyById(id);
    
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

const deleteSurvey = async (id) => {
  await pool.query(`DELETE FROM surveys WHERE id = $1`, [id]);
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  patchSurvey,
  deleteSurvey,
};
