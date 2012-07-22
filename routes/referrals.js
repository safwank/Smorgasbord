var Referral = require('../models/referral');

// GET /referrals
exports.list = function (req, res, next) {
    Referral.getAll(function (err, referrals) {
        if (err) return next(err);
        res.render('referrals', {
            referrals: referrals
        });
    });
};
