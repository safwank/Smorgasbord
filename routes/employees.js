var Employee = require('../models/employee');

// GET /employees
exports.list = function (req, res, next) {
    Employee.getAll(function (err, employees) {
        if (err) return next(err);
        res.render('employees', {
            employees: employees
        });
    });
};
