var Relation = require('../models/relation');

// GET /relations
exports.list = function (req, res, next) {
    Relation.getAll(function (err, relations) {
        if (err) return next(err);
        res.render('relations', {
            relations: relations
        });
    });
};
