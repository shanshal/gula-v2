const { Survey, Question } = require('../src/models');
const sequelize = require('../src/config/db');

const CATEGORY_OPTIONS = [
  {
    id: 'mental_health',
    en: 'Mental Health',
    ar: 'الصحة النفسية',
  },
  {
    id: 'health',
    en: 'General Health',
    ar: 'الصحة العامة',
  },
  {
    id: 'feedback',
    en: 'Feedback & Reflection',
    ar: 'تغذية راجعة وتقييم',
  },
];

const ensureLocalizedString = (value, fallbackEn, fallbackAr) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      en: value.en ?? fallbackEn ?? '',
      ar: value.ar ?? fallbackAr ?? value.en ?? fallbackEn ?? '',
    };
  }
  return {
    en: value ?? fallbackEn ?? '',
    ar: value ?? fallbackAr ?? fallbackEn ?? value ?? '',
  };
};

const buildMandatorySurveyPayload = () => {
  const options = CATEGORY_OPTIONS.map((category, index) => ({
    value: category.id,
    text: ensureLocalizedString(null, category.en, category.ar),
    position: index + 1,
  }));

  const mapping = CATEGORY_OPTIONS.reduce((acc, category) => {
    acc[category.id] = category.id;
    acc[category.en.toLowerCase()] = category.id;
    acc[category.ar.toLowerCase()] = category.id;
    return acc;
  }, {});

  return {
    name: ensureLocalizedString(null, 'Daily check-in', 'تسجيل يومي'),
    status: 'active',
    metadata: {
      description: ensureLocalizedString(
        null,
        'Tell us what you want to explore today so we can curate the right surveys.',
        'أخبرنا بما ترغب بالاطلاع عليه اليوم لنقترح الاستبيانات المناسبة.',
      ),
      mandatory: true,
      category: 'checkin',
      category_filters: {
        category_choice: mapping,
      },
    },
    questions: [
      {
        question_text: ensureLocalizedString(
          null,
          'What do you want to take today?',
          'ماذا ترغب بالاطلاع عليه اليوم؟',
        ),
        question_type: 'single_choice',
        is_required: true,
        question_order: 1,
        options,
      },
    ],
    scoring: {
      type: 'sum',
    },
  };
};

const seedSurveys = async () => {
  const transaction = await sequelize.transaction();
  try {
    // Clear existing data
    await Question.destroy({ where: {}, transaction });
    await Survey.destroy({ where: {}, transaction });

    const payload = buildMandatorySurveyPayload();
    
    // Create survey
    const survey = await Survey.create({
      name: payload.name,
      status: payload.status,
      metadata: payload.metadata,
      scoring: payload.scoring,
      interpretation: payload.interpretation
    }, { transaction });

    // Create questions
    const questions = payload.questions.map(q => ({
      ...q,
      survey_id: survey.id
    }));
    
    await Question.bulkCreate(questions, { transaction });

    await transaction.commit();
    console.log('✓ Seeded mandatory daily check-in survey');
    return 1;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      const count = await seedSurveys();
      console.log(`\nFinished seeding surveys. Created ${count} survey.`);
      await sequelize.close();
      process.exit(0);
    } catch (error) {
      console.error('Survey seeding failed:', error);
      await sequelize.close();
      process.exit(1);
    }
  })();
}

module.exports = { seedSurveys };
