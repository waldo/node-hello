require.paths.unshift('./node_modules')

// Module dependencies.
var express = require('express');
var jqtpl = require("jqtpl");
var less = require('less');
var articles = require('./articles');
var sys = require('sys');
var util = require('util');

var app = module.exports = express.createServer();
var pub = __dirname + '/public';

// set-up database
var mongo = require('mongodb');
var connection = mongo.Connection;
var bson = mongo.BSONPure;

var info = JSON.parse(process.env.VCAP_SERVICES || "0");
var creds = info ? info['mongodb-1.8'][0]['credentials'] : { 
  hostname: 'localhost',
  port: connection.DEFAULT_PORT,
  db: 'node-hello'
};

var userPass = '';
if (creds['username']) {
  userPass = creds['username'] + ':' + creds['password'] + '@';
}
var port = '';
if (creds['port']) {
  port = ':' + creds['port'];
}

var dbConn = 'mongo://' + userPass + creds['hostname'] + port + '/' + creds['db'];
// mongo://[username:password@]host1[:port1]/db

console.error('dbConn: ' + util.inspect(dbConn, true));

mongo.connect(dbConn, function(err, dbObj){
  if (err) {
    console.error('err: ' + util.inspect(err, true));
    console.error('dbObj: ' + util.inspect(dbObj, true));
  }

  articles.setup(dbObj, bson);

  // Dummy data
  articles.findAll(function(arts){
    if (arts === undefined || arts.length == 0) {
      articles.save([
          { title: 'Post one', body: 'Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old. Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source. Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC. This book is a treatise on the theory of ethics, very popular during the Renais', comments:[
            { author: 'Bobby', text: 'I love it' },
            { author: 'Dave', text: 'This is rubbish!' }
          ]},
          { title: 'Post two', body: 'Body two' },
          { title: 'Post three', body: 'Body three' }
        ],
        function(err, articles){
          console.error('articles err: ' + util.inspect(err, true));
          console.error('articles: ' + util.inspect(articles, true));
        }
      );
    }
  });
});

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set("view engine", "html");
  app.register(".html", require("jqtpl").express);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser());
  app.use(express.session({ secret: 'your secret here' }));
  app.use(app.router);
  app.use(express.compiler({ src: pub, enable: ['less'] }));
  app.use(express.static(pub));
  app.use(express.errorHandler({ dump: true, stack: true }));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){
  articles.findAll(function(arts){
    res.render('posts/index', {
      title: "posts",
      arts: arts
    });
  });
});

app.get('/post/:id', function(req, res){
  articles.findById(req.params.id, function(err, art) {
    if (err) {
      res.redirect('/');
    }
    else {
      res.render('posts/view', {
        title: art.title,
        art: art
      });
    }
  });
});

app.get('/new', function(req, res){
  res.render('posts/new', {
    title: "add a post"
  });
});

app.post('/new', function(req, res){
  if(req.xhr) {
    articles.save(req.param('post'), function(error, docs) {
      res.partial('posts/view', { art: docs[0] });
    });
  }
  else {
    articles.save(req.param('post'), function(error, docs) {
      res.redirect('/');
    });
  }
});

// Only listen on $ node app.js
if (!module.parent) {
  app.listen(process.env.VMC_APP_PORT || 3000);
  console.log("Express server listening on port %d", app.address().port);
}