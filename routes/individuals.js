var Individual = require('../models/individual');

// GET /individuals
exports.list = function (req, res, next) {
    Individual.getAll(function (err, individuals) {
        if (err) return next(err);
        res.render('individuals', {
            individuals: individuals
        });
    });
};
