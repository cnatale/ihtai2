const Joi = require('joi');

exports.nDimensionalPointSchema = Joi.object().keys({
  inputState: Joi.array().items(
    Joi.number()
  ).required(),
  actionState: Joi.array().items(
    Joi.number()
  ).required(),
  driveState: Joi.array().items(
    // Joi.number()
  ).required()
}).required().with('inputState', 'actionState', 'driveState');

exports.nDimensionalPointsSchema = Joi.array().items(
  exports.nDimensionalPointSchema
);
