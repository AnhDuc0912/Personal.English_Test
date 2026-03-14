function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function compareArrays(left, right) {
  if (left.length !== right.length) {
    return false;
  }

  return [...left].sort().every((item, index) => item === [...right].sort()[index]);
}

function scoreExam(exam, submittedAnswers = {}) {
  const details = exam.questions.map((question) => {
    const rawAnswer = submittedAnswers[question.key];
    let isCorrect = false;
    let normalizedUserAnswer;
    let correctAnswer;

    if (question.type === 'single-choice') {
      normalizedUserAnswer = normalizeText(rawAnswer);
      correctAnswer = question.correctAnswers[0] || '';
      isCorrect = normalizedUserAnswer === normalizeText(correctAnswer);
    }

    if (question.type === 'multiple-choice') {
      const values = Array.isArray(rawAnswer) ? rawAnswer : rawAnswer ? [rawAnswer] : [];
      normalizedUserAnswer = values.map(normalizeText);
      correctAnswer = question.correctAnswers.map(normalizeText);
      isCorrect = compareArrays(normalizedUserAnswer, correctAnswer);
    }

    if (question.type === 'fill-blank') {
      normalizedUserAnswer = normalizeText(rawAnswer);
      correctAnswer = question.acceptedAnswers;
      isCorrect = question.acceptedAnswers.map(normalizeText).includes(normalizedUserAnswer);
    }

    if (question.type === 'drag-drop') {
      const values = rawAnswer && typeof rawAnswer === 'object' ? rawAnswer : {};
      normalizedUserAnswer = values;
      correctAnswer = Object.fromEntries(
        question.dragTargets.map((target) => [target.key, target.correctItemKey])
      );
      isCorrect = question.dragTargets.every(
        (target) => normalizeText(values[target.key]) === normalizeText(target.correctItemKey)
      );
    }

    return {
      questionKey: question.key,
      prompt: question.prompt,
      type: question.type,
      isCorrect,
      userAnswer: normalizedUserAnswer,
      correctAnswer
    };
  });

  const correctCount = details.filter((detail) => detail.isCorrect).length;
  const totalQuestions = exam.questions.length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

  return {
    totalQuestions,
    correctCount,
    wrongCount: totalQuestions - correctCount,
    score,
    details
  };
}

module.exports = scoreExam;