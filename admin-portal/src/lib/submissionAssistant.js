const toText = (content) => {
  if (Array.isArray(content)) return content.join(', ');
  if (content === null || content === undefined) return '';
  return String(content);
};

const hasAny = (text, patterns) => patterns.some(pattern => pattern.test(text));

const detectLanguage = (text) => {
  const trimmed = text.trim();
  if (!trimmed) return 'Unknown';
  if (/<\/?[a-z][\s\S]*>/i.test(trimmed)) return 'HTML';
  if (/\b(import|export|const|let|var|function|=>|console\.)\b/.test(trimmed)) return 'JavaScript';
  if (/\b(def|print|import|from|class)\b/.test(trimmed) && /:\s*(#.*)?$/m.test(trimmed)) return 'Python';
  if (/\b(public|private|class|static|void|String)\b/.test(trimmed)) return 'Java';
  if (/[.#][\w-]+\s*\{[\s\S]*\}/.test(trimmed)) return 'CSS';
  return 'Plain text';
};

export function analyzeSubmission(submission, maxPoints = 0) {
  const content = toText(submission.content);
  const trimmed = content.trim();
  const type = submission.type || 'text';
  const concerns = [];
  const strengths = [];
  const questions = [];
  let scoreRatio = 0.65;
  let summary = 'Review the submission against the task requirements before grading.';

  if (!trimmed) {
    return {
      verdict: 'Needs reviewer attention',
      confidence: 'High',
      summary: 'The submission content is empty.',
      strengths: [],
      concerns: ['No content was submitted.'],
      questions: ['Ask the student to resubmit with the required work attached or pasted.'],
      suggestedPoints: 0,
      suggestedFeedback: 'I could not find any submitted content. Please resubmit the required work so it can be reviewed.',
    };
  }

  if (type === 'code') {
    const language = detectLanguage(trimmed);
    const lines = trimmed.split(/\r?\n/);
    const nonEmptyLines = lines.filter(line => line.trim()).length;
    const uniqueLines = new Set(lines.map(line => line.trim()).filter(Boolean)).size;
    const duplicateRatio = nonEmptyLines > 0 ? 1 - (uniqueLines / nonEmptyLines) : 0;

    summary = `${language} submission with ${nonEmptyLines} non-empty line${nonEmptyLines === 1 ? '' : 's'}.`;

    if (nonEmptyLines >= 15) strengths.push('Includes enough code to review structure and intent.');
    if (hasAny(trimmed, [/\bfunction\b/, /=>/, /\bclass\b/, /\bdef\b/])) strengths.push('Uses functions or structured code blocks.');
    if (hasAny(trimmed, [/try\s*{/, /\bcatch\b/, /\bexcept\b/, /\.catch\(/])) strengths.push('Includes some error-handling logic.');
    if (hasAny(trimmed, [/\/\//, /\/\*/, /#\s/, /<!--/])) strengths.push('Includes comments that may help explain the approach.');

    if (nonEmptyLines < 5) concerns.push('The code is very short, so it may be incomplete.');
    if (hasAny(trimmed, [/\bTODO\b/i, /\bFIXME\b/i, /placeholder/i])) concerns.push('Contains TODO, FIXME, or placeholder text.');
    if (hasAny(trimmed, [/\beval\s*\(/, /document\.write\s*\(/, /innerHTML\s*=/, /api[_-]?key/i, /password\s*=/i])) concerns.push('Contains patterns that may be unsafe or should be reviewed carefully.');
    if (duplicateRatio > 0.35) concerns.push('A large portion of the code appears duplicated.');
    if (!hasAny(trimmed, [/return\b/, /console\.log/, /print\s*\(/, /<body/i, /render\s*\(/])) questions.push('Check that the submitted code actually produces the required output.');
    if (!hasAny(trimmed, [/test\b/i, /assert\b/i, /expect\s*\(/])) questions.push('Ask how the student tested this solution if the task expected validation.');

    scoreRatio = concerns.length === 0 ? 0.9 : concerns.length === 1 ? 0.75 : 0.45;
  } else if (['link', 'video', 'image'].includes(type)) {
    try {
      const url = new URL(trimmed);
      summary = `External ${type} submission hosted on ${url.hostname}.`;
      strengths.push('The submission uses a valid URL format.');
      if (url.protocol !== 'https:') concerns.push('The link is not HTTPS.');
      questions.push('Open the link and confirm it is accessible without private permissions.');
      scoreRatio = concerns.length === 0 ? 0.8 : 0.55;
    } catch {
      summary = 'The submission is intended to be a URL but does not look valid.';
      concerns.push('Invalid URL format.');
      scoreRatio = 0.2;
    }
  } else if (type === 'multichoice') {
    summary = `Selected answer${Array.isArray(submission.content) && submission.content.length === 1 ? '' : 's'}: ${toText(submission.content)}.`;
    strengths.push('The answer is recorded and ready to compare with the task key.');
    questions.push('Confirm the selected options match the configured correct choices.');
    scoreRatio = 0.7;
  } else {
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    summary = `Text response with about ${words} word${words === 1 ? '' : 's'}.`;
    if (words >= 50) strengths.push('Provides a reasonably detailed written response.');
    if (words < 20) concerns.push('The answer is brief and may need more explanation.');
    if (hasAny(trimmed, [/I don't know/i, /not sure/i, /placeholder/i])) concerns.push('Contains uncertainty or placeholder wording.');
    questions.push('Compare the explanation with the task rubric before approving.');
    scoreRatio = concerns.length === 0 ? 0.8 : 0.55;
  }

  const suggestedPoints = Math.max(0, Math.round(maxPoints * scoreRatio));
  const verdict = concerns.length >= 2
    ? 'Needs reviewer attention'
    : concerns.length === 1
      ? 'Review before approving'
      : 'Ready to approve';

  const suggestedFeedback = concerns.length > 0
    ? `Good effort. Please review: ${concerns.join(' ')}`
    : `Nice work. ${strengths[0] || 'The submission appears complete from the automated review.'}`;

  return {
    verdict,
    confidence: type === 'code' ? 'Medium' : 'Low',
    summary,
    strengths,
    concerns,
    questions,
    suggestedPoints,
    suggestedFeedback,
  };
}
