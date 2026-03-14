const Joi = require('joi');

// Returns express middleware that validates req.body against a Joi schema
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
  }
  next();
};

module.exports = { validate, Joi };
