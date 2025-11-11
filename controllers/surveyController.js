const surveyModel = require('../models/surveyModel');
const userModel = require('../models/userModel');

const getSurveys = async (req, res) => {
  try {
    const {
      userId,
      category,
      categories,
      includeArchived,
      includeDrafts,
      statuses,
      excludeWithinDays,
      limit,
      mandatoryOnly,
    } = req.query;

    let user = null;
    let isSuperUser = false;

    if (userId) {
      try {
        user = await userModel.getUserByPublicId(String(userId).trim());
        isSuperUser = (user?.role || 'user') === 'super';
      } catch (error) {
        console.warn('Unable to resolve user by public id:', error.message);
      }
    }

    const normalizedCategories = new Set();
    if (category) {
      normalizedCategories.add(String(category).trim().toLowerCase());
    }
    if (categories) {
      String(categories)
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .forEach((value) => normalizedCategories.add(value.toLowerCase()));
    }

    const allowedStatuses = new Set(['active', 'draft', 'archived']);

    let statusList = [];
    if (statuses) {
      statusList = String(statuses)
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);
    }

    statusList = statusList.filter((status) => allowedStatuses.has(status));

    if (statusList.length === 0) {
      statusList = isSuperUser
        ? Array.from(allowedStatuses)
        : ['active'];
    } else if (!isSuperUser) {
      statusList = statusList.filter((status) => status === 'active');
      if (statusList.length === 0) {
        statusList = ['active'];
      }
    } else {
      const extras = new Set(statusList);
      if (includeArchived === 'true') extras.add('archived');
      if (includeDrafts === 'true') extras.add('draft');
      statusList = Array.from(extras);
    }

    if (isSuperUser) {
      if (includeArchived === 'true') {
        statusList = Array.from(new Set([...statusList, 'archived']));
      }
      if (includeDrafts === 'true') {
        statusList = Array.from(new Set([...statusList, 'draft']));
      }
    }

    const excludeDays = isSuperUser
      ? 0
      : Number.parseInt(excludeWithinDays, 10) || 90;

    const surveys = await surveyModel.getSurveys({
      statuses: statusList,
      categories: normalizedCategories.size > 0 ? Array.from(normalizedCategories) : undefined,
      userId: user ? user.id : null,
      excludeWithinDays: excludeDays,
      mandatoryOnly: mandatoryOnly === 'true',
      limit: limit ? Number(limit) : undefined,
    });

    res.status(200).json(surveys);
  } catch (error) {
    console.error('Error loading surveys:', error);
    res.status(500).json({ error: 'Failed to load surveys' });
  }
};
const getSurveyById = async (req, res) => {
  const { id } = req.params;
  try {
    const fullSurvey = await surveyModel.getSurveyById(id);
    if (!fullSurvey) return res.status(404).json({ error: 'Survey not found' });
    res.status(200).json(fullSurvey);
  } catch (err) {
    console.error('Error fetching survey:', err);
    res.status(500).json({ error: 'Failed to fetch survey' });
  }
};;

const createSurvey = async (req, res) => {
  try {
    const surveyData = req.body;
    const newSurvey = await surveyModel.createSurvey(surveyData);
    res.status(201).json(newSurvey);
  } catch (err) {
    console.error('Error creating survey via JSON:', err);
    res.status(500).json({ error: 'Failed to create survey via JSON' });
  }
};

const updateSurvey = async (req, res) => {
  const { id } = req.params;
  const {name, scoring, metadata, status} = req.body;
  await surveyModel.updateSurvey({name, scoring, metadata, status}, id);
  res.status(200).send(`survey updated with id: ${id}`);
};

const patchSurvey = async (req, res) => {
  const { id } = req.params;
  
  try {
    // Get the current survey first
    const currentSurvey = await surveyModel.getSurveyById(id);
    if (!currentSurvey) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const updateData = req.body;
    const updatedFields = [];

    // Validate that we have at least one field to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields provided for update' });
    }

    // Perform the partial update
    const result = await surveyModel.patchSurvey(updateData, id, currentSurvey);
    
    // Track which fields were updated
    Object.keys(updateData).forEach(field => {
      updatedFields.push(field);
    });

    res.status(200).json({
      message: `Survey ${id} updated successfully`,
      updatedFields: updatedFields,
      survey: result
    });

  } catch (err) {
    console.error('Error partially updating survey:', err);
    res.status(500).json({ 
      error: 'Failed to update survey',
      details: err.message 
    });
  }
};

const deleteSurvey = async (req, res) => {
  const { id } = req.params;
  await surveyModel.deleteSurvey(id);
  res.status(200).send(`Survey deleted ${id}`);
};

module.exports = {
  getSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  patchSurvey,
  deleteSurvey
};
