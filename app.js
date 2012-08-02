
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.cookieParser());
  app.use(express.session({secret: "string" }));
  //app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

app.helpers({
    title: 'Smorgasbord'
});

// Routes

app.get('/', routes.site.index);

app.get('/users', routes.users.list);
app.post('/users', routes.users.create);
app.get('/users/:id', routes.users.show);
app.post('/users/:id', routes.users.edit);
app.del('/users/:id', routes.users.del);

app.post('/users/:id/follow', routes.users.follow);
app.post('/users/:id/unfollow', routes.users.unfollow);

app.get('/datainit/business', routes.datainit.loadBusiness);
app.get('/datainit/businesstaxreturn', routes.datainit.loadBusinessTaxReturn);
app.get('/datainit/partner', routes.datainit.loadPartner);
app.get('/datainit/employee', routes.datainit.loadEmployee);
app.get('/datainit/individual', routes.datainit.loadIndividual);
app.get('/datainit/individualrelation', routes.datainit.loadIndividualRelation);
app.get('/datainit/individualstock', routes.datainit.loadIndividualStock);
app.get('/datainit/stock', routes.datainit.loadStock);
app.get('/datainit/referral', routes.datainit.loadReferral);
app.get('/datainit/financialyear', routes.datainit.loadFinancialYear);

app.get('/businesses', routes.businesses.list);

app.get('/businesstaxreturns', routes.businesstaxreturns.list);

app.get('/partners', routes.partners.list);

app.get('/employees', routes.employees.list);

app.get('/individuals', routes.individuals.list);
app.get('/individualrelations', routes.individualrelations.list);
app.get('/individualstocks', routes.individualstocks.list);

app.get('/stocks', routes.stocks.list);

app.get('/referrals', routes.referrals.list);

app.get('/financialyears', routes.financialyears.list);

app.get('/upload', routes.upload.show);
app.post('/upload', routes.upload.importCSVData);

app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
