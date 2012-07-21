var Partner = require('../models/partner');

// GET /partners
exports.list = function (req, res, next) {
    Partner.getAll(function (err, partners) {
        if (err) return next(err);
        res.render('partners', {
            partners: partners
        });
    });
};
