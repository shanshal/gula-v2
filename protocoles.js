// Helper Functions

const calculateLeadershipScores = (answers) => {
  const styles = {
    authoritarian: [1, 2, 6, 10, 15, 16],
    democratic: [4, 5, 8, 11, 14, 18],
    laissezFaire: [3, 7, 9, 12, 13, 17]
  };

  const scores = { authoritarian: 0, democratic: 0, laissezFaire: 0 };

  for (const { question_id, answer } of answers) {
    for (const s in styles) if (styles[s].includes(question_id)) scores[s] += +answer;
  }

  const { authoritarian: a, democratic: d, laissezFaire: l } = scores;

  const classification =
    (a >= d + 4 && a >= l + 4 && 'Dominant Authoritarian') ||
    (d >= a + 4 && d >= l + 4 && 'Dominant Democratic') ||
    (l >= a + 4 && l >= d + 4 && 'Dominant Laissez-Faire') ||
    (Math.abs(a - d) <= 3 && a >= l + 4 && d >= l + 4 && 'Mixed Authoritarian/Democratic') ||
    (Math.abs(l - d) <= 3 && l >= a + 4 && d >= a + 4 && 'Mixed Democratic/Laissez-Faire') ||
    (Math.abs(a - d) <= 3 && Math.abs(a - l) <= 3 && Math.abs(d - l) <= 3 && 'Balanced/Ambivalent') ||
    'Mixed/Unclear';

  return { scores, classification };
};

const calculateLoveLanguagesScores = (answers) => {
  const languageMap = {
    A: 'Words of Affirmation',
    B: 'Quality Time',
    C: 'Receiving Gifts',
    D: 'Acts of Service',
    E: 'Physical Touch'
  };

  const questionMap = {
    1: { 1: 'A', 2: 'E' },  2: { 1: 'B', 2: 'D' },  3: { 1: 'C', 2: 'B' },
    4: { 1: 'D', 2: 'E' },  5: { 1: 'E', 2: 'C' },  6: { 1: 'B', 2: 'E' },
    7: { 1: 'A', 2: 'C' },  8: { 1: 'E', 2: 'A' },  9: { 1: 'B', 2: 'C' },
    10: { 1: 'D', 2: 'A' }, 11: { 1: 'B', 2: 'A' }, 12: { 1: 'E', 2: 'D' },
    13: { 1: 'A', 2: 'C' }, 14: { 1: 'E', 2: 'B' }, 15: { 1: 'A', 2: 'D' },
    16: { 1: 'E', 2: 'B' }, 17: { 1: 'C', 2: 'D' }, 18: { 1: 'A', 2: 'B' },
    19: { 1: 'E', 2: 'D' }, 20: { 1: 'D', 2: 'C' }, 21: { 1: 'B', 2: 'D' },
    22: { 1: 'C', 2: 'A' }, 23: { 1: 'D', 2: 'C' }, 24: { 1: 'C', 2: 'B' },
    25: { 1: 'B', 2: 'D' }, 26: { 1: 'E', 2: 'C' }, 27: { 1: 'A', 2: 'B' },
    28: { 1: 'C', 2: 'E' }, 29: { 1: 'A', 2: 'D' }, 30: { 1: 'E', 2: 'A' }
  };

  const scores = Object.fromEntries(Object.values(languageMap).map(l => [l, 0]));

  // Count scores
  for (const { question_id, answer } of answers) {
    const code = questionMap[question_id]?.[answer];
    if (code) scores[languageMap[code]]++;
  }

  // Sort languages by score
  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const [primary, secondary] = sorted;

  return {
    scores,
    primary: { name: primary[0], score: primary[1] },
    secondary: { name: secondary[0], score: secondary[1] }
  };
};

const calculateDefault = (answers) => {
  return answers.reduce((sum, { answer }) => {
    // Convert answer to number if it's not already
    const numericAnswer = typeof answer === 'number' ? answer : parseInt(answer) || 0;
    return sum + numericAnswer;
  }, 0);
};


module.exports = {
  calculateLeadershipScores,
  calculateLoveLanguagesScores,
  calculateDefault
};





