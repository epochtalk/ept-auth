var Joi = require('joi');
var path = require('path');
var Boom = require('boom');
var crypto = require('crypto');
var Promise = require('bluebird');

/**
  * @api {GET} /recover/:query Recover Account
  * @apiName AccountRecoveryReq
  * @apiGroup Auth
  * @apiVersion 0.4.0
  * @apiDescription Used to recover an account by username or email. Sends an email with
  * a URL to visit to reset the user's account password.
  *
  * @apiParam {string} query The email or username to attempt to recover
  *
  * @apiSuccess {boolean} success true if recovery email is sent
  * @apiError BadRequest The username or email is not found
  * @apiError (Error 500) InternalServerError There was an error updating the user account's reset token information
  */
module.exports = {
  method: 'GET',
  path: '/api/recover/{query}',
  config: {
    validate: { params: { query: Joi.string().min(1).max(255).required(), } }
  },
  handler: function(request, reply) {
    var config = request.server.app.config;
    var query = request.params.query;
    var promise = request.db.users.userByUsername(query) // get full user info
    .then(function(user) {
      if (user) { return user; }
      else { return Promise.reject(Boom.badRequest('No Account Found')); }
    })
    .catch(function() { return request.db.users.userByEmail(query); })
    .then(function(user) {
      if (user) { return user; }
      else { return Promise.reject(Boom.badRequest('No Account Found')); }
    })
    .then(function(user) {
      // Build updated user with resetToken and resetExpiration
      var updateUser = {};
      updateUser.reset_token = crypto.randomBytes(20).toString('hex');
      updateUser.reset_expiration = Date.now() + 1000 * 60 * 60; // 1 hr
      updateUser.id = user.id;
      // Store token and expiration to user object
      return request.db.users.update(updateUser);
    })
    .then(function(user) {
      // Email user reset information here
      var emailParams = {
        email: user.email,
        username: user.username,
        reset_url: config.publicUrl + '/' + path.join('reset', user.username, user.reset_token)
      };
      return request.emailer.send('recoverAccount', emailParams);
    });
    return reply(promise);
  }
};
