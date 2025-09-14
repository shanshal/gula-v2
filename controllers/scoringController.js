const scoringService = require('../services/scoring');
const surveyModel = require('../models/surveyModel');

const getSurveyScore = async (req, res) => {
  try {
    const { userId, surveyId } = req.params;
    const score = await scoringService.calculateSurveyScore(userId, surveyId);
    res.json(score);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSurveyResultPages = async (req, res) => {
  try {
    const { surveyId } = req.params;
    const surveyJSON = await surveyModel.getSurveyById(surveyId);
    
    if (!surveyJSON) {
      return res.status(404).json({ error: 'Survey not found' });
    }

    const scoring = surveyJSON.survey.scoring;
    if (!scoring || !scoring.thresholds) {
      return res.json({ 
        pages: [], 
        message: 'No result pages configured for this survey' 
      });
    }

    const pages = [];
    
    // Handle different threshold structures
    if (scoring.type === 'grouped' && typeof scoring.thresholds === 'object') {
      // Grouped thresholds
      for (const [groupName, groupThresholds] of Object.entries(scoring.thresholds)) {
        if (typeof groupThresholds === 'object') {
          const sortedRanges = Object.entries(groupThresholds)
            .map(([range, interpretation]) => {
              const [min, max] = range.includes('-') 
                ? range.split('-').map(Number) 
                : [Number(range), Number(range)];
              return { range, min, max, interpretation, group: groupName };
            })
            .sort((a, b) => a.min - b.min);
          
          sortedRanges.forEach((threshold, index) => {
            pages.push({
              pageId: `result_page_${groupName}_${index + 1}`,
              level: index + 1,
              levelName: getLevelName(threshold.interpretation),
              group: groupName,
              range: threshold.range,
              min: threshold.min,
              max: threshold.max,
              interpretation: threshold.interpretation,
              template: generateResultPageTemplate(threshold.interpretation, groupName)
            });
          });
        }
      }
    } else {
      // Simple thresholds
      const sortedRanges = Object.entries(scoring.thresholds)
        .map(([range, interpretation]) => {
          const [min, max] = range.includes('-') 
            ? range.split('-').map(Number) 
            : [Number(range), Number(range)];
          return { range, min, max, interpretation };
        })
        .sort((a, b) => a.min - b.min);
      
      sortedRanges.forEach((threshold, index) => {
        pages.push({
          pageId: `result_page_${index + 1}`,
          level: index + 1,
          levelName: getLevelName(threshold.interpretation),
          range: threshold.range,
          min: threshold.min,
          max: threshold.max,
          interpretation: threshold.interpretation,
          template: generateResultPageTemplate(threshold.interpretation)
        });
      });
    }

    res.json({
      surveyId: parseInt(surveyId),
      scoringType: scoring.type,
      totalPages: pages.length,
      pages
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to extract level name from interpretation
function getLevelName(interpretation) {
  const lower = interpretation.toLowerCase();
  if (lower.includes('poor') || lower.includes('low')) return 'low';
  if (lower.includes('fair') || lower.includes('medium') || lower.includes('moderate')) return 'medium';
  if (lower.includes('good') || lower.includes('high')) return 'high';
  if (lower.includes('excellent') || lower.includes('very')) return 'excellent';
  return 'custom';
}

// Helper function to generate result page template
function generateResultPageTemplate(interpretation, group = null) {
  const groupText = group ? ` in ${group}` : '';
  return {
    title: interpretation,
    subtitle: group ? `Your ${group} results` : 'Your survey results',
    description: `Based on your responses, you scored${groupText}: ${interpretation}`,
    recommendations: generateRecommendations(interpretation, group),
    styling: {
      theme: getLevelName(interpretation),
      color: getThemeColor(interpretation)
    }
  };
}

// Helper function to generate recommendations based on interpretation
function generateRecommendations(interpretation, group = null) {
  const level = getLevelName(interpretation);
  const recommendations = [];
  
  switch (level) {
    case 'low':
      recommendations.push('Consider areas for improvement');
      recommendations.push('Seek additional resources or support');
      break;
    case 'medium':
      recommendations.push('You\'re on the right track');
      recommendations.push('Focus on specific areas for growth');
      break;
    case 'high':
      recommendations.push('Great job! Keep up the good work');
      recommendations.push('Consider sharing your approach with others');
      break;
    case 'excellent':
      recommendations.push('Outstanding results!');
      recommendations.push('You could mentor others in this area');
      break;
    default:
      recommendations.push('Review your results carefully');
      break;
  }
  
  if (group) {
    recommendations.push(`Explore more about ${group}`);
  }
  
  return recommendations;
}

// Helper function to get theme color
function getThemeColor(interpretation) {
  const level = getLevelName(interpretation);
  const colors = {
    low: '#ff6b6b',
    medium: '#feca57',
    high: '#48cae4',
    excellent: '#06d6a0',
    custom: '#6c5ce7'
  };
  return colors[level] || colors.custom;
}

module.exports = { 
  getSurveyScore,
  getSurveyResultPages
};
