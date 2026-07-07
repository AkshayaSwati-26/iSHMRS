const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!result.success) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }

    req.body = result.data.body || req.body;
    req.query = result.data.query || req.query;
    req.params = result.data.params || req.params;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = validate;
