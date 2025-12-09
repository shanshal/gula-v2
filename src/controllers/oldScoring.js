// const answerModel = require('../models/answerModel');
// const userModel = require('../models/userModel');
//
// // Leadership survey scoring function (from protocoles.js)
// const leadershipSurveyHandler = (surveyAnswers) => {
//   let authQuestions = [1, 2, 6, 10, 15, 16];
//   let auth = 0;
//   let demoQuestions = [4, 5, 8, 11, 14, 18];
//   let demo = 0;
//   let laisQuestions = [3, 7, 9, 12, 13, 17];
//   let lais = 0;
//
//   for (const question of Object.keys(surveyAnswers)) {
//     const qNum = Number(question);
//     const value = surveyAnswers[qNum];
//
//     if (authQuestions.includes(qNum)) {
//       auth += value;
//     } else if (demoQuestions.includes(qNum)) {
//       demo += value;
//     } else if (laisQuestions.includes(qNum)) {
//       lais += value;
//     }
//   }
//
//   return { auth, demo, lais };
// };
//
// // Advanced grouping logic for leadership styles
// function determineLeadershipGroup(auth, demo, lais) {
//   // --- Dominant cases (4+ lead) ---
//   if (auth >= demo + 4 && auth >= lais + 4) {
//     return {
//       category: "dominant_authoritarian",
//       title: "Authoritarian Leader",
//       description: "Focuses on control and strict supervision; expects compliance and adherence to rules.",
//       references: "",
//       scores: { auth, demo, lais }
//     };
//   }
//   if (demo >= auth + 4 && demo >= lais + 4) {
//     return {
//       category: "dominant_democratic",
//       title: "Democratic Leader",
//       description: "Encourages participation, collaboration, and shared decision-making among members.",
//       references: "",
//       scores: { auth, demo, lais }
//     };
//   }
//   if (lais >= auth + 4 && lais >= demo + 4) {
//     return {
//       category: "dominant_laissez_faire",
//       title: "Laissez-Faire Leader",
//       description: "Provides minimal guidance; members have high autonomy and self-direction.",
//       references: "",
//       scores: { auth, demo, lais }
//     };
//   }
//
//   // --- Balanced (all equal) ---
//   if (auth === demo && demo === lais) {
//     return {
//       category: "balanced",
//       title: "Balanced Leadership",
//       description: "Demonstrates a mix of authoritarian, democratic, and laissez-faire styles equally.",
//       references: "",
//       scores: { auth, demo, lais }
//     };
//   }
//
//   // --- Mixed (two equal & higher than third) ---
//   if (auth === demo && auth > lais) {
//     return {
//       category: "mixed_authoritarian_democratic",
//       title: "Authoritarian-Democratic Mix",
//       description: "Shows traits of both authoritarian and democratic leadership, with less laissez-faire influence.",
//       references: "",
//       scores: { auth, demo, lais }
//     };
//   }
//   if (auth === lais && auth > demo) {
//     return {
//       category: "mixed_authoritarian_laissez_faire",
//       title: "Authoritarian-Laissez-Faire Mix",
//       description: "Combines control and autonomy; less focus on democratic collaboration.",
//       references: "",
//       scores: { auth, demo, lais }
//     };
//   }
//   if (demo === lais && demo > auth) {
//     return {
//       category: "mixed_democratic_laissez_faire",
//       title: "Democratic-Laissez-Faire Mix",
//       description: "Encourages participation and autonomy, with less direct control.",
//       references: [],
//       scores: { auth, demo, lais }
//     };
//   }
//
//   // --- Primary (highest wins but not dominant) ---
//   const maxScore = Math.max(auth, demo, lais);
//   if (auth === maxScore) {
//     return {
//       category: "primary_authoritarian",
//       title: "Primary Authoritarian",
//       description: "Leans toward controlling and structured leadership, but not overwhelmingly dominant.",
//       references: [],
//       scores: { auth, demo, lais }
//     };
//   }
//   if (demo === maxScore) {
//     return {
//       category: "primary_democratic",
//       title: "Primary Democratic",
//       description: "Leans toward collaborative and participatory leadership, but not overwhelmingly dominant.",
//       references: [],
//       scores: { auth, demo, lais }
//     };
//   }
//   if (lais === maxScore) {
//     return {
//       category: "primary_laissez_faire",
//       title: "Primary Laissez-Faire",
//       description: "Leans toward hands-off leadership, giving members autonomy without full dominance.",
//       references: [],
//       scores: { auth, demo, lais }
//     };
//   }
//
//   // --- Default fallback ---
//   return {
//     category: "undefined",
//     title: "Undefined",
//     description: "Leadership style could not be classified.",
//     references: [],
//     scores: { auth, demo, lais }
//   };
// }
//
//
//
//
// // Calculate leadership scores for a user
// const calculateLeadershipScores = async (req, res) => {
//   try {
//     const { userId, surveyId } = req.params;
//
//     if (!userId || !surveyId) {
//       return res.status(400).json({
//         error: 'userId and surveyId are required'
//       });
//     }
//
//     const normalizedId = typeof userId === 'string' ? userId.trim() : String(userId ?? '').trim();
//     const user = await userModel.getUserByPublicId(normalizedId);
//     if (!user) {
//       return res.status(404).json({
//         error: 'User not found'
//       });
//     }
//
//     // Get all answers for this user and survey
//     const answers = await answerModel.getAnswersBySurveyId(surveyId);
//     const userAnswers = answers.filter(answer => String(answer.user_id) === String(user.id));
//
//     if (userAnswers.length === 0) {
//       return res.status(404).json({
//         error: 'No answers found for this user and survey'
//       });
//     }
//
//     // Convert answers to the format expected by the scoring function
//     const surveyAnswers = {};
//     userAnswers.forEach(answer => {
//       // Map question_id to question_order for scoring
//       surveyAnswers[answer.question_order || answer.question_id] = parseInt(answer.answer_value);
//     });
//
//     // Calculate scores
//     const scores = leadershipSurveyHandler(surveyAnswers);
//
//     // Determine leadership group using advanced grouping logic
//     const leadershipGroup = determineLeadershipGroup(scores.auth, scores.demo, scores.lais);
//
//     // Calculate percentages
//     const totalScore = scores.auth + scores.demo + scores.lais;
//     const percentages = {
//       authoritarian: Math.round((scores.auth / totalScore) * 100),
//       democratic: Math.round((scores.demo / totalScore) * 100),
//       laissezFaire: Math.round((scores.lais / totalScore) * 100)
//     };
//
//     const result = {
//       userId,
//       surveyId,
//       answersCount: userAnswers.length,
//       scores: {
//         authoritarian: scores.auth,
//         democratic: scores.demo,
//         laissezFaire: scores.lais
//       },
//       percentages,
//       leadershipProfile: {
//         category: leadershipGroup.category,
//         title: leadershipGroup.title,
//         description: leadershipGroup.description,
//         references: leadershipGroup.references
//       },
//       // Legacy field for backward compatibility
//       dominantStyle: leadershipGroup.title,
//       details: {
//         authoritarianQuestions: [1, 2, 6, 10, 15, 16],
//         democraticQuestions: [4, 5, 8, 11, 14, 18],
//         laissezFaireQuestions: [3, 7, 9, 12, 13, 17]
//       }
//     };
//
//     res.status(200).json(result);
//
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
//
// // Calculate scores using direct answer data (for testing or bulk processing)
// const calculateScoresFromAnswers = async (req, res) => {
//   try {
//     const { answers } = req.body;
//
//     if (!answers || typeof answers !== 'object') {
//       return res.status(400).json({
//         error: 'answers object is required in the format {question_number: answer_value}'
//       });
//     }
//
//     // Calculate scores
//     const scores = leadershipSurveyHandler(answers);
//
//     // Determine leadership group using advanced grouping logic
//     const leadershipGroup = determineLeadershipGroup(scores.auth, scores.demo, scores.lais);
//
//     // Calculate percentages
//     const totalScore = scores.auth + scores.demo + scores.lais;
//     const percentages = {
//       authoritarian: Math.round((scores.auth / totalScore) * 100),
//       democratic: Math.round((scores.demo / totalScore) * 100),
//       laissezFaire: Math.round((scores.lais / totalScore) * 100)
//     };
//
//     const result = {
//       scores: {
//         authoritarian: scores.auth,
//         democratic: scores.demo,
//         laissezFaire: scores.lais
//       },
//       percentages,
//       leadershipProfile: {
//         category: leadershipGroup.category,
//         title: leadershipGroup.title,
//         description: leadershipGroup.description,
//         references: leadershipGroup.references
//       },
//       // Legacy field for backward compatibility
//       dominantStyle: leadershipGroup.title,
//       details: {
//         authoritarianQuestions: [1, 2, 6, 10, 15, 16],
//         democraticQuestions: [4, 5, 8, 11, 14, 18],
//         laissezFaireQuestions: [3, 7, 9, 12, 13, 17]
//       }
//     };
//
//     res.status(200).json(result);
//
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };
//
// module.exports = {
//   calculateLeadershipScores,
//   calculateScoresFromAnswers
// };
