const pool = require("../db");

const getSurveys = async () => {
  const res = await pool.query("SELECT * FROM surveys ORDER BY id ASC");
  return res.rows;
};

const getSurveyById = async (id) => {
  const client = await pool.connect();
  try {
    const surveyRes = await client.query(
      `SELECT * FROM surveys WHERE id = $1`,
      [id]
    );
    const survey = surveyRes.rows[0];
    if (!survey) return null;

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
      survey,
      questions: questionsRes.rows,
    };
  } finally {
    client.release();
  }
};

const createSurvey = async (data) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const metadata =
      data.metadata && typeof data.metadata === "object"
        ? JSON.stringify(data.metadata)
        : JSON.stringify({});

    // Process scoring configuration to use question orders instead of arbitrary IDs
    let processedScoring = data.scoring || { type: 'sum' };
    
    const surveyRes = await client.query(
      `INSERT INTO surveys (name, metadata, status, scoring)
       VALUES ($1, $2::jsonb, $3, $4)
       RETURNING *`,
      [data.name, metadata, data.status || 'draft', JSON.stringify(processedScoring)]
    );
    const survey = surveyRes.rows[0];

    const questionResults = [];
    if (Array.isArray(data.questions)) {
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        const {
          text,
          question_text,
          type,
          question_type,
          is_required = false,
          options = null,
          min_value = null,
          max_value = null,
          placeholder = null,
          help_text = null,
          question_route = null,
          flag = null,
          weight = 1,
        } = q;

        // Handle both field name formats for backward compatibility
        const questionText = text || question_text;
        const questionType = type || question_type;

        // Validate required fields
        if (!questionText) {
          throw new Error(`Question ${i + 1}: question_text or text field is required`);
        }
        if (!questionType) {
          throw new Error(`Question ${i + 1}: question_type or type field is required`);
        }

        // Use the array index + 1 as question_order if not provided
        const question_order = q.question_order !== undefined ? q.question_order : (i + 1);

        const normalizedOptions =
          options && Array.isArray(options)
            ? JSON.stringify(options)
            : options
            ? JSON.stringify(options)
            : null;
            
        const questionRes = await client.query(
          `INSERT INTO questions
           (survey_id, question_text, question_type, is_required, options, min_value, max_value, question_order, placeholder, help_text, question_route, flag)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [
            survey.id,
            questionText,
            questionType,
            is_required,
            normalizedOptions,
            min_value,
            max_value,
            question_order,
            placeholder,
            help_text,
            question_route,
            flag,
          ]
        );

        const questionWithWeight = { ...questionRes.rows[0], weight };
        questionResults.push(questionWithWeight);
      }

      // Now update the scoring configuration to use the actual question IDs
      if (data.scoring && (data.scoring.type === 'grouped' || data.scoring.type === 'formula')) {
        const updatedScoring = await updateScoringWithQuestionIds(data.scoring, questionResults);
        
        await client.query(
          `UPDATE surveys SET scoring = $1 WHERE id = $2`,
          [JSON.stringify(updatedScoring), survey.id]
        );
        
        // Update the survey object to reflect the new scoring
        survey.scoring = updatedScoring;
      } else if (data.scoring && data.scoring.type === 'sum') {
        // For sum scoring, we need to convert question order mappings to question ID mappings
        const updatedScoring = await updateSumScoringWithQuestionIds(data.scoring, questionResults);
        
        await client.query(
          `UPDATE surveys SET scoring = $1 WHERE id = $2`,
          [JSON.stringify(updatedScoring), survey.id]
        );
        
        // Update the survey object to reflect the new scoring
        survey.scoring = updatedScoring;
      }
    }

    await client.query("COMMIT");

    return {
      survey,
      questions: questionResults,
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

  if (updateData.name !== undefined) {
    fields.push(`name = $${paramIndex}`);
    values.push(updateData.name);
    paramIndex++;
  }

  if (updateData.scoring !== undefined) {
    fields.push(`scoring = $${paramIndex}`);
    values.push(JSON.stringify(updateData.scoring));
    paramIndex++;
  }

  if (updateData.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex}::jsonb`);
    values.push(JSON.stringify(updateData.metadata));
    paramIndex++;
  }

  if (updateData.status !== undefined) {
    fields.push(`status = $${paramIndex}`);
    values.push(updateData.status);
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

    // Handle name update
    if (updateData.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(updateData.name);
      paramIndex++;
    }

    // Handle status update
    if (updateData.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updateData.status);
      paramIndex++;
    }

    // Handle metadata partial update (deep merge)
    if (updateData.metadata !== undefined) {
      const currentMetadata = currentSurvey.survey?.metadata || {};
      const mergedMetadata = deepMerge(currentMetadata, updateData.metadata);
      
      fields.push(`metadata = $${paramIndex}::jsonb`);
      values.push(JSON.stringify(mergedMetadata));
      paramIndex++;
    }

    // Handle scoring partial update (deep merge)
    if (updateData.scoring !== undefined) {
      const currentScoring = currentSurvey.survey?.scoring || {};
      const mergedScoring = deepMerge(currentScoring, updateData.scoring);
      
      fields.push(`scoring = $${paramIndex}`);
      values.push(JSON.stringify(mergedScoring));
      paramIndex++;
    }

    // Handle interpretation update (stored as JSON in scoring or metadata)
    if (updateData.interpretation !== undefined) {
      // For now, we'll store interpretation in the survey's metadata
      const currentMetadata = currentSurvey.survey?.metadata || {};
      const currentInterpretation = currentMetadata.interpretation || {};
      const mergedInterpretation = deepMerge(currentInterpretation, updateData.interpretation);
      
      const mergedMetadata = {
        ...currentMetadata,
        interpretation: mergedInterpretation
      };
      
      // Check if we already updated metadata above
      const metadataIndex = fields.findIndex(field => field.includes('metadata'));
      if (metadataIndex !== -1) {
        // Replace the existing metadata update
        const existingMetadata = JSON.parse(values[metadataIndex]);
        values[metadataIndex] = JSON.stringify({
          ...existingMetadata,
          interpretation: mergedInterpretation
        });
      } else {
        fields.push(`metadata = $${paramIndex}::jsonb`);
        values.push(JSON.stringify(mergedMetadata));
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Update the survey
    values.push(id);
    const query = `UPDATE surveys SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
    const result = await client.query(query, values);
    
    await client.query("COMMIT");
    
    // Return the updated survey in the same format as getSurveyById
    const updatedSurvey = await getSurveyById(id);
    return updatedSurvey;
    
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
