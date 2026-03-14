const Exam = require('../models/Exam');
const Question = require('../models/Question');
const User = require('../models/User');
const ExamAttempt = require('../models/ExamAttempt');
const scoreExam = require('../services/scoreExam');
const { buildExamPayload } = require('../services/adminExamPayload');
const { mapExamForPlay } = require('../services/examMapper');

function toEditorPayload(questions = []) {
  return questions.map((question) => ({
    key: question.key,
    type: question.type,
    prompt: question.prompt,
    instructions: question.instructions || '',
    imageUrl: question.imageUrl || '',
    optionsRaw: (question.options || []).map((option) => `${option.key}|${option.text}`).join('\n'),
    correctAnswersRaw: (question.correctAnswers || []).join(', '),
    acceptedAnswersRaw: (question.acceptedAnswers || []).join(', '),
    dragItemsRaw: (question.dragItems || [])
      .map((item) => `${item.key}|${item.label}`)
      .join('\n'),
    dragTargetsRaw: (question.dragTargets || [])
      .map((target) => `${target.key}|${target.label}|${target.correctItemKey}`)
      .join('\n')
  }));
}

async function renderHomePage(req, res, next) {
  try {
    const exams = await Exam.find({ isPublished: true }).sort({ createdAt: -1 }).lean();
    res.render('home', {
      pageTitle: 'Thi thu tieng Anh cho be',
      exams
    });
  } catch (error) {
    next(error);
  }
}

async function renderExamPage(req, res, next) {
  try {
    const examDoc = await Exam.findOne({ slug: req.params.slug, isPublished: true })
      .populate({ path: 'questionIds', options: { sort: { order: 1 } } })
      .lean();

    const exam = mapExamForPlay(examDoc);

    if (!exam) {
      return res.status(404).render('result', {
        pageTitle: 'Khong tim thay de thi',
        exam: null,
        summary: null,
        errorMessage: 'Khong tim thay de thi.'
      });
    }

    res.render('exam', {
      pageTitle: exam.title,
      exam
    });
  } catch (error) {
    next(error);
  }
}

async function submitExam(req, res, next) {
  try {
    const examDoc = await Exam.findById(req.params.id)
      .populate({ path: 'questionIds', options: { sort: { order: 1 } } })
      .lean();

    const exam = mapExamForPlay(examDoc);

    if (!exam) {
      return res.status(404).render('result', {
        pageTitle: 'De thi khong ton tai',
        exam: null,
        summary: null,
        errorMessage: 'De thi khong ton tai.'
      });
    }

    const participantName = String(req.body.participantName || '').trim() || 'Hoc sinh';
    const submittedAnswers = req.body.answers || {};
    const summary = scoreExam(exam, submittedAnswers);

    const attempt = await ExamAttempt.create({
      examId: exam._id,
      examTitle: exam.title,
      participantName,
      submittedAnswers,
      score: summary.score,
      totalQuestions: summary.totalQuestions,
      correctCount: summary.correctCount,
      wrongCount: summary.wrongCount,
      details: summary.details
    });

    res.render('result', {
      pageTitle: `Ket qua - ${exam.title}`,
      exam,
      summary,
      attempt,
      errorMessage: null
    });
  } catch (error) {
    next(error);
  }
}

async function renderAdminResultList(req, res, next) {
  try {
    const attempts = await ExamAttempt.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.render('admin-results', {
      pageTitle: 'Lich su ket qua bai thi',
      attempts
    });
  } catch (error) {
    next(error);
  }
}

async function renderAdminLogin(req, res) {
  res.render('admin-login', {
    pageTitle: 'Dang nhap admin',
    errorMessage: null
  });
}

async function loginAdmin(req, res, next) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');

    const user = await User.findOne({ email, isActive: true });
    const isValidPassword = user ? await user.verifyPassword(password) : false;

    if (!user || !isValidPassword || user.role !== 'admin') {
      return res.status(401).render('admin-login', {
        pageTitle: 'Dang nhap admin',
        errorMessage: 'Thong tin dang nhap khong hop le.'
      });
    }

    req.session.user = {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role
    };

    user.lastLoginAt = new Date();
    await user.save();

    return res.redirect('/admin/exams');
  } catch (error) {
    return next(error);
  }
}

async function logoutAdmin(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

async function renderAdminExamList(req, res, next) {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 }).lean();

    res.render('admin-exams', {
      pageTitle: 'Quan ly de thi',
      exams,
      successMessage: req.query.success || null
    });
  } catch (error) {
    next(error);
  }
}

async function renderCreateExamPage(req, res) {
  res.render('admin-exam-form', {
    pageTitle: 'Tao de thi',
    mode: 'create',
    action: '/admin/exams',
    errorMessage: null,
    exam: {
      title: '',
      description: '',
      heroEmoji: '📘',
      durationMinutes: 15,
      isPublished: true,
      questionsPayload: '[]'
    }
  });
}

async function createExam(req, res, next) {
  try {
    const payload = buildExamPayload(req.body);
    const existed = await Exam.findOne({ slug: payload.exam.slug });

    if (existed) {
      return res.status(400).render('admin-exam-form', {
        pageTitle: 'Tao de thi',
        mode: 'create',
        action: '/admin/exams',
        errorMessage: 'Tieu de da ton tai. Vui long doi ten de thi.',
        exam: {
          ...payload.exam,
          questionsPayload: req.body.questionsPayload || '[]'
        }
      });
    }

    const createdQuestions = await Question.insertMany(payload.questions);

    await Exam.create({
      ...payload.exam,
      questionIds: createdQuestions.map((question) => question._id),
      questionCount: createdQuestions.length,
      createdBy: req.session.user.id,
      updatedBy: req.session.user.id
    });

    return res.redirect('/admin/exams?success=Tao+de+thi+thanh+cong');
  } catch (error) {
    if (error.message) {
      return res.status(400).render('admin-exam-form', {
        pageTitle: 'Tao de thi',
        mode: 'create',
        action: '/admin/exams',
        errorMessage: error.message,
        exam: {
          title: req.body.title || '',
          description: req.body.description || '',
          heroEmoji: req.body.heroEmoji || '📘',
          durationMinutes: req.body.durationMinutes || 15,
          isPublished: req.body.isPublished === 'on',
          questionsPayload: req.body.questionsPayload || '[]'
        }
      });
    }

    return next(error);
  }
}

async function renderEditExamPage(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate({ path: 'questionIds', options: { sort: { order: 1 } } })
      .lean();

    if (!exam) {
      return res.redirect('/admin/exams');
    }

    const editorQuestions = toEditorPayload(exam.questionIds || []);

    return res.render('admin-exam-form', {
      pageTitle: `Sua de thi - ${exam.title}`,
      mode: 'edit',
      action: `/admin/exams/${exam._id}/update`,
      errorMessage: null,
      exam: {
        ...exam,
        questionsPayload: JSON.stringify(editorQuestions, null, 2)
      }
    });
  } catch (error) {
    return next(error);
  }
}

async function updateExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.redirect('/admin/exams');
    }

    const payload = buildExamPayload(req.body);
    const slugExisted = await Exam.findOne({ slug: payload.exam.slug, _id: { $ne: exam._id } });

    if (slugExisted) {
      return res.status(400).render('admin-exam-form', {
        pageTitle: `Sua de thi - ${exam.title}`,
        mode: 'edit',
        action: `/admin/exams/${exam._id}/update`,
        errorMessage: 'Tieu de da ton tai. Vui long doi ten de thi.',
        exam: {
          ...payload.exam,
          _id: exam._id,
          questionsPayload: req.body.questionsPayload || '[]'
        }
      });
    }

    await Question.deleteMany({ _id: { $in: exam.questionIds } });
    const createdQuestions = await Question.insertMany(payload.questions);

    await Exam.updateOne(
      { _id: exam._id },
      {
        ...payload.exam,
        questionIds: createdQuestions.map((question) => question._id),
        questionCount: createdQuestions.length,
        updatedBy: req.session.user.id
      }
    );

    return res.redirect('/admin/exams?success=Cap+nhat+de+thi+thanh+cong');
  } catch (error) {
    if (error.message) {
      return res.status(400).render('admin-exam-form', {
        pageTitle: 'Sua de thi',
        mode: 'edit',
        action: `/admin/exams/${req.params.id}/update`,
        errorMessage: error.message,
        exam: {
          _id: req.params.id,
          title: req.body.title || '',
          description: req.body.description || '',
          heroEmoji: req.body.heroEmoji || '📘',
          durationMinutes: req.body.durationMinutes || 15,
          isPublished: req.body.isPublished === 'on',
          questionsPayload: req.body.questionsPayload || '[]'
        }
      });
    }

    return next(error);
  }
}

async function deleteExam(req, res, next) {
  try {
    const exam = await Exam.findById(req.params.id);

    if (exam) {
      await Question.deleteMany({ _id: { $in: exam.questionIds } });
      await Exam.deleteOne({ _id: exam._id });
    }

    return res.redirect('/admin/exams?success=Xoa+de+thi+thanh+cong');
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  renderHomePage,
  renderExamPage,
  submitExam,
  renderAdminLogin,
  loginAdmin,
  logoutAdmin,
  renderAdminExamList,
  renderCreateExamPage,
  createExam,
  renderEditExamPage,
  updateExam,
  deleteExam,
  renderAdminResultList
};