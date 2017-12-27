const Joi = require('joi');

// nDimensionalPoints {array} Initialization array of points
//   used for creating child PatternRecognizers. If you don't want to initialize
//   with points, pass an empty array.
exports.nDimensionalPointSchema = Joi.object().keys({
  inputState: Joi.array().items(
    Joi.number()
  ).required(),
  actionState: Joi.array().items(
    Joi.number()
  ).required(),
  driveState: Joi.array().items(
    Joi.number()
  ).required()
}).required().with('inputState', 'actionState', 'driveState');

exports.nDimensionalPointsSchema = Joi.array().items(
  exports.nDimensionalPointSchema
);
