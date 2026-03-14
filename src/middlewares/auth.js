function requireAdmin(req, res, next) {
  if (req.session?.user?.role === 'admin') {
    return next();
  }

  return res.redirect('/admin/login');
}

function requireGuest(req, res, next) {
  if (req.session?.user?.role === 'admin') {
    return res.redirect('/admin/exams');
  }

  return next();
}

module.exports = {
  requireAdmin,
  requireGuest
};
