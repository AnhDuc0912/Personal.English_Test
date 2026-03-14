const slugify = require('slugify');

function splitLines(value) {
  return String(value || '')
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseOptionLines(value) {
  return splitLines(value).map((line) => {
    const [key, ...rest] = line.split('|');

    if (!key || rest.length === 0) {
      throw new Error('Options phai theo dinh dang key|text');
    }

    return {
      key: key.trim(),
      text: rest.join('|').trim()
    };
  });
}

function parseDragItemLines(value) {
  return splitLines(value).map((line) => {
    const [key, ...rest] = line.split('|');

    if (!key || rest.length === 0) {
      throw new Error('Drag items phai theo dinh dang key|label');
    }

    return {
      key: key.trim(),
      label: rest.join('|').trim()
    };
  });
}

function parseDragTargetLines(value) {
  return splitLines(value).map((line) => {
    const [key, label, correctItemKey] = line.split('|').map((entry) => entry.trim());

    if (!key || !label || !correctItemKey) {
      throw new Error('Drag targets phai theo dinh dang key|label|correctItemKey');
    }

    return {
      key,
      label,
      correctItemKey
    };
  });
}

function ensureUniqueQuestionKeys(questions) {
  const keySet = new Set();

  for (const question of questions) {
    if (keySet.has(question.key)) {
      throw new Error(`Key cau hoi bi trung: ${question.key}`);
    }

    keySet.add(question.key);
  }
}

function buildQuestionPayload(rawQuestions) {
  if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
    throw new Error('Can co it nhat 1 cau hoi trong de thi');
  }

  const questions = rawQuestions.map((entry, index) => {
    const type = String(entry.type || '').trim();
    const prompt = String(entry.prompt || '').trim();
    const instructions = String(entry.instructions || '').trim();
    const imageUrl = String(entry.imageUrl || '').trim();
    const providedKey = String(entry.key || '').trim();
    const key = providedKey || `q${index + 1}`;

    if (!prompt) {
      throw new Error(`Cau hoi ${index + 1} chua co noi dung prompt`);
    }

    const baseQuestion = {
      key,
      type,
      prompt,
      instructions,
      imageUrl,
      order: index
    };

    if (type === 'single-choice' || type === 'multiple-choice') {
      const options = parseOptionLines(entry.optionsRaw);
      const correctAnswers = String(entry.correctAnswersRaw || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (options.length < 2) {
        throw new Error(`Cau ${index + 1} can it nhat 2 options`);
      }

      if (!correctAnswers.length) {
        throw new Error(`Cau ${index + 1} can dap an dung`);
      }

      return {
        ...baseQuestion,
        options,
        correctAnswers
      };
    }

    if (type === 'fill-blank') {
      const acceptedAnswers = String(entry.acceptedAnswersRaw || '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!acceptedAnswers.length) {
        throw new Error(`Cau ${index + 1} can accepted answers`);
      }

      return {
        ...baseQuestion,
        acceptedAnswers
      };
    }

    if (type === 'drag-drop') {
      const dragItems = parseDragItemLines(entry.dragItemsRaw);
      const dragTargets = parseDragTargetLines(entry.dragTargetsRaw);

      if (!dragItems.length || !dragTargets.length) {
        throw new Error(`Cau ${index + 1} can drag items va drag targets`);
      }

      return {
        ...baseQuestion,
        dragItems,
        dragTargets
      };
    }

    throw new Error(`Loai cau hoi khong hop le o cau ${index + 1}`);
  });

  ensureUniqueQuestionKeys(questions);
  return questions;
}

function buildExamPayload(body) {
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const heroEmoji = String(body.heroEmoji || '📘').trim();
  const durationMinutes = Number(body.durationMinutes || 15);
  const isPublished = body.isPublished === 'on';
  const rawQuestions = JSON.parse(body.questionsPayload || '[]');

  if (!title || !description) {
    throw new Error('Title va description la bat buoc');
  }

  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Duration phai la so duong');
  }

  const questions = buildQuestionPayload(rawQuestions);
  const slug = slugify(title, { lower: true, strict: true });

  if (!slug) {
    throw new Error('Khong tao duoc slug tu title');
  }

  return {
    exam: {
      title,
      slug,
      description,
      heroEmoji,
      durationMinutes,
      isPublished
    },
    questions
  };
}

module.exports = {
  buildExamPayload
};
