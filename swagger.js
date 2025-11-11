const swaggerJSDoc = require('swagger-jsdoc');

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Gula Leadership Survey API',
    version: '1.0.0',
    description: 'A comprehensive API for leadership assessment surveys with Arabic support',
    contact: {
      name: 'API Support',
      email: 'support@gula.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:8080',
      description: 'Development server',
    },
    {
      url: 'https://gula-v2.onrender.com',
      description: 'Testing production'
    }
  ],
  components: {
    schemas: {
      User: {
        type: 'object',
        required: ['name', 'email'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the user (UUID)',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          uuid: {
            type: 'string',
            format: 'uuid',
            description: 'Alias for the UUID identifier (mirrors id)',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          name: {
            type: 'string',
            description: 'User full name',
            example: 'أحمد محمد',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'ahmed@example.com',
          },
          age: {
            type: 'integer',
            description: 'User age',
            example: 30,
          },
          sex: {
            type: 'string',
            enum: ['male', 'female'],
            description: 'User gender',
            example: 'male',
          },
          weight: {
            type: 'number',
            format: 'float',
            description: 'User weight in kg',
            example: 75.5,
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'User creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'User last update timestamp',
          },
        },
      },
      Survey: {
        type: 'object',
        required: ['name'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Unique identifier for the survey (UUID)',
            example: '0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9',
          },
          name: {
            type: 'string',
            description: 'Survey name',
            example: 'أساليب القيادة',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Survey creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Survey last update timestamp',
          },
        },
      },
      Question: {
        type: 'object',
        required: ['question_text', 'survey_id'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the question',
            example: 1,
          },
          survey_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the survey this question belongs to',
            example: '0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9',
          },
          question_text: {
            type: 'string',
            description: 'The question text in Arabic',
            example: 'يجب الإشراف على الأعضاء عن كثب وإلا فمن غير المرجح أن يؤدوا عملهم.',
          },
          question_type: {
            type: 'string',
            description: 'Type of question',
            example: 'likert_scale',
          },
          is_required: {
            type: 'boolean',
            description: 'Whether this question is required',
            example: true,
          },
          options: {
            type: 'object',
            description: 'Question options for multiple choice or Likert scale',
            example: {
              scale: [
                { value: 1, label: 'أختلف بشدّة' },
                { value: 2, label: 'أختلف' },
                { value: 3, label: 'محايد' },
                { value: 4, label: 'أوافق' },
                { value: 5, label: 'أوافق بشدّة' },
              ],
            },
          },
          min_value: {
            type: 'number',
            description: 'Minimum value for numeric questions',
            example: 1,
          },
          max_value: {
            type: 'number',
            description: 'Maximum value for numeric questions',
            example: 5,
          },
          question_order: {
            type: 'integer',
            description: 'Order of the question in the survey',
            example: 1,
          },
          placeholder: {
            type: 'string',
            description: 'Placeholder text for input fields',
            example: 'أدخل إجابتك هنا',
          },
          help_text: {
            type: 'string',
            description: 'Help text to guide the user',
            example: 'اختر الإجابة التي تناسبك أكثر',
          },
        },
      },
      Answer: {
        type: 'object',
        required: ['user_id', 'question_id', 'answer_value'],
        properties: {
          id: {
            type: 'integer',
            description: 'Unique identifier for the answer',
            example: 1,
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the user who provided this answer',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          question_id: {
            type: 'integer',
            description: 'ID of the question being answered',
            example: 1,
          },
          answer_value: {
            type: 'string',
            description: 'The answer value (1-5 for Likert scale)',
            example: '4',
          },
          answer_text: {
            type: 'string',
            description: 'Optional text explanation for the answer',
            example: 'أوافق - الإشراف المنتظم مهم لضمان الجودة',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Answer creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Answer last update timestamp',
          },
        },
      },
      LeadershipProfile: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the user',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          surveyId: {
            type: 'string',
            format: 'uuid',
            description: 'ID of the survey',
            example: '0d78ab49-19b0-4ed1-8947-8fa8c4f9b2a9',
          },
          answersCount: {
            type: 'integer',
            description: 'Number of answers provided',
            example: 18,
          },
          scores: {
            type: 'object',
            properties: {
              authoritarian: {
                type: 'integer',
                description: 'Score for authoritarian leadership style',
                example: 22,
              },
              democratic: {
                type: 'integer',
                description: 'Score for democratic leadership style',
                example: 25,
              },
              laissezFaire: {
                type: 'integer',
                description: 'Score for laissez-faire leadership style',
                example: 17,
              },
            },
          },
          percentages: {
            type: 'object',
            properties: {
              authoritarian: {
                type: 'integer',
                description: 'Percentage for authoritarian style',
                example: 34,
              },
              democratic: {
                type: 'integer',
                description: 'Percentage for democratic style',
                example: 39,
              },
              laissezFaire: {
                type: 'integer',
                description: 'Percentage for laissez-faire style',
                example: 27,
              },
            },
          },
          leadershipProfile: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'Leadership category identifier',
                example: 'mixed_democratic_laissez_faire',
              },
              title: {
                type: 'string',
                description: 'Leadership style title in Arabic and English',
                example: 'القيادة المختلطة (ديمقراطي/حر) (Mixed Democratic/Laissez-Faire)',
              },
              description: {
                type: 'string',
                description: 'Detailed description of the leadership style',
                example: 'القائد هنا يمارس التحفيز والمشاركة لكنه يميل أيضاً لمنح الفريق مساحة كبيرة من الحرية',
              },
              pros: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'List of advantages of this leadership style',
                example: [
                  'أعلى مستويات الرضا الوظيفي والإبداع',
                  'أعضاء الفريق يشعرون بالتقدير والثقة الشخصية',
                ],
              },
              cons: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'List of disadvantages of this leadership style',
                example: [
                  'قد تنخفض الكفاءة في المشاريع التي تتطلب انضباطاً عالياً',
                  'احتمالية غياب القيادة أوقات الأزمات',
                ],
              },
              recommendations: {
                type: 'array',
                items: {
                  type: 'string',
                },
                description: 'Development recommendations for this leadership style',
                example: [
                  'وضع أهداف واضحة وقابلة للمتابعة',
                  'التدخل عند الحاجة لضبط التوجه',
                ],
              },
              references: {
                type: 'string',
                description: 'Academic references supporting this analysis',
                example: '[1](http://dx.doi.org/10.1353/csd.2020.0023) [4](https://pmc.ncbi.nlm.nih.gov/articles/PMC7012830/)',
              },
            },
          },
          dominantStyle: {
            type: 'string',
            description: 'Dominant leadership style (legacy field)',
            example: 'القيادة المختلطة (ديمقراطي/حر) (Mixed Democratic/Laissez-Faire)',
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Resource not found',
          },
        },
      },
    },
  },
};

const path = require('path');

const options = {
  definition: swaggerDefinition,
  apis: [
    path.join(__dirname, './routes/*.js'),
    path.join(__dirname, './controllers/*.js')
  ], // Path to the API files
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
