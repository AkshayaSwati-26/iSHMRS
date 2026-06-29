const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: No role assigned'
      });
    }

    const hasRole = allowedRoles.includes(req.user.role.name);
    if (!hasRole) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden: Access denied for role ${req.user.role.name}`
      });
    }

    next();
  };
};

module.exports = { authorize };
