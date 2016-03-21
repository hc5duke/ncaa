(function() {
  "use strict";
  // Express server setup
  var express = require('express');
  var app = express();
  app.use(express.static(__dirname + '/dist'));

  // server config
  var port = process.env.PORT || 3111;
  var server = app.listen(port, function(){
    console.log(port);
  });
})();
