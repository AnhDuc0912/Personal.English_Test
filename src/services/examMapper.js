function mapExamForPlay(examDoc) {
  if (!examDoc) {
    return null;
  }

  const questions = Array.isArray(examDoc.questionIds) ? examDoc.questionIds : [];

  return {
    ...examDoc,
    questions,
    questionCount: examDoc.questionCount || questions.length
  };
}

module.exports = {
  mapExamForPlay
};
