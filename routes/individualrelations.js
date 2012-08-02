var IndividualRelation = require('../models/individualrelation');

// GET /individualrelations
exports.list = function (req, res, next) {
    IndividualRelation.getAll(function (err, individualRelations) {
        if (err) return next(err);
        res.render('individualrelations', {
            individualRelations: individualRelations
        });
    });
};
