var controllerBuilder = require('../controllers/BaseController');
// var passport = require('passport');

module.exports = function (app, models) {
    for (var key in models) {
        if (models.hasOwnProperty(key)) {
            var controller = controllerBuilder(models[key]);
            app.get('/api/' + key, controller.get);
            app.get('/api/' + key + '/:Id', controller.getById);
            app.get('/api/' + key + '/count', controller.count);
            app.post('/api/' + key, controller.post);
            app.post('/api/' + key + '/postbulk', controller.postBulk);
            app.put('/api/' + key, controller.put);
            app.patch('/api/' + key,controller.put);
            app.delete('/api/' + key,controller.delete);
        }
    }

    app.use(function (req, res, next) {
        res.status(404);
        // log.error('%s %d %s', req.method, res.statusCode, req.url);
        res.json({
            error: 'Not found'
        });
        return;
    });

    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        // log.error('%s %d %s', req.method, res.statusCode, err.message);
        res.json({
            error: err.message || err
        });
        return;
    });
};