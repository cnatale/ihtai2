const Joi = require('joi');

exports.nDimensionalPointSchema = Joi.object().keys({
  inputState: Joi.array(),
  actionState: Joi.array(),
  driveState: Joi.array(),
}).with('inputState', 'actionState', 'driveState');
