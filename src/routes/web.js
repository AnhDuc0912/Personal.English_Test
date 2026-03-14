const express = require('express');

const {
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
  renderAdminResultList,
  renderAdminResultDetail
} = require('../controllers/examController');
const { requireAdmin, requireGuest } = require('../middlewares/auth');

const router = express.Router();

router.get('/', renderHomePage);
router.get('/exams/:slug', renderExamPage);
router.post('/exams/:id/submit', submitExam);

router.get('/admin/login', requireGuest, renderAdminLogin);
router.post('/admin/login', requireGuest, loginAdmin);
router.post('/admin/logout', requireAdmin, logoutAdmin);

router.get('/admin/exams', requireAdmin, renderAdminExamList);
router.get('/admin/results', requireAdmin, renderAdminResultList);
router.get('/admin/results/:id', requireAdmin, renderAdminResultDetail);
router.get('/admin/exams/new', requireAdmin, renderCreateExamPage);
router.post('/admin/exams', requireAdmin, createExam);
router.get('/admin/exams/:id/edit', requireAdmin, renderEditExamPage);
router.post('/admin/exams/:id/update', requireAdmin, updateExam);
router.post('/admin/exams/:id/delete', requireAdmin, deleteExam);

module.exports = router;