module.exports = {
  method: 'GET',
  path: '/recover',
  handler: function(request, reply) {
    var config = request.server.app.config;
    var data = {
      title: config.website.title,
      description: config.website.description,
      keywords: config.website.keywords,
      logo: config.website.logo,
      favicon: config.website.favicon,
      siteKey: config.recaptchaSiteKey
    };

    return reply.view('recover', data);
  }
};
