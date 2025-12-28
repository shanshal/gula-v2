const express = require('express');
const router = express.Router();
const surveyController = require('../controllers/surveyController');
const {
  validateSurveyCreation,
  validateSurveyUpdate,
  validateSurveyPatch,
  validateUuidParam
} = require('../middleware/validation');

const internalAuth = require('../middleware/internalAuth');
const asyncHandler = require('../utils/asyncHandler');


router.get(
    '/',
    internalAuth,
    asyncHandler(surveyController.getSurveys),
);

router.get(
    '/:id',
    internalAuth,
    validateUuidParam,
    asyncHandler(surveyController.getSurveyById),
);

router.post(
    '/',
    internalAuth,
    validateSurveyCreation,
    asyncHandler(surveyController.getSurveyById),
);

router.post(
    '/seed',
    internalAuth,
    asyncHandler(surveyController.runSeeder),
);

router.put(
    '/:id',
    internalAuth,
    validateUuidParam,
    validateSurveyUpdate,
    asyncHandler(surveyController.updateSurvey)
);

router.patch(
    '/:id',
    internalAuth,
    validateUuidParam,
    validateSurveyPatch,
    asyncHandler(surveyController.patchSurvey)
);


router.delete(
    '/:id',
    internalAuth,
    validateUuidParam,
    asyncHandler(surveyController.deleteSurvey)
);


module.exports = router;
