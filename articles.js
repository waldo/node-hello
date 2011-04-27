var util = require('util');

var db = null;
var bson = null;


exports.setup = function(dbObj, bsonX) {
  db = dbObj;
  bson = bsonX;
}

collection = function(callback) {
  db.collection('articles', function(err, article_collection) {
    callback(article_collection);
  });
};

exports.findAll = function(callback){
  collection(function(article_collection) {
    article_collection.find(function(err, cursor) {
      cursor.toArray(function(err, results) {
        callback(results);
      });
    });
  });
};

exports.findById = function(id, callback){
  collection(function(article_collection) {
    article_collection.findOne(bson.ObjectID.createFromHexString(id), {}, function(err, result) {
      if (err) {
        console.error('findById err: ' + util.inspect(err, true));
        callback(err, null)
      }
      else {
        callback(null, result);
      }
    });
  });
};

exports.save = function(articles, callback){
  collection(function(article_collection){
    if (typeof(articles.length)=="undefined") {
      articles = [articles];
    }

      for (var i = 0; i < articles.length; i++) {
        article = articles[i];
        article.created_at = new Date();
        if (article.comments === undefined) {
          article.comments = [];
        }
        for(var j =0;j< article.comments.length; j++) {
          article.comments[j].created_at = new Date();
        }
      }

      article_collection.insert(articles, function() {
        callback(null, articles);
      });
  });
};