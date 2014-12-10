var fs = require('fs');
var parse5 = require("parse5");
var Transformer = require("../lib/index.js").Transformer;
var Walker = require("../lib/index.js").Walker;

var parser = new parse5.Parser();
var document = parser.parse(fs.readFileSync(__dirname + "/custom-tag.html", "utf-8"));
var serializer = new parse5.Serializer();

var transformer  = new Transformer();

//change header to div.header
var changeHeaderWalker = new Walker();
changeHeaderWalker.handle = function(node, callback){
  if(node.tagName == 'header'){
    node.tagName = 'div';
    node.attrs.push({name: 'class', value: 'header'});
  }
  callback(node);
}
transformer.addBeforeFilter(function(doc, callback){
  changeHeaderWalker.walk(doc, callback);
});

//include file
transformer.addNodeFilter(function(node, callback){
  if(node.tagName == 'include'){
    var file;
    node.attrs.forEach(function(item){
      if(item.name == 'file'){
        file = item.value;
      }
    });
    if(file){
      try{
        var fragment = parser.parseFragment(fs.readFileSync(__dirname + "/" + file, "utf-8"));
        callback(fragment.childNodes[0]);
      }catch(err){
        console.log(err);
        callback(null);
      }
    }else{
      callback(null);
    }
  }else{
    callback(node)
  }
});

//remove comment
var removeCommentWalker = new Walker();
removeCommentWalker.handle = function(node, callback){
  if(node.nodeName != '#comment'){
    callback(node);
    if(node.nodeName == 'h1'){
    console.log(node);
    }
  }else{
    callback(null);
  }
}
transformer.addAfterFilter(function(doc, callback){
  removeCommentWalker.walk(doc, callback);
});


//execute transform
transformer.transform(document, function(doc){
  var html = serializer.serialize(doc);
  console.log(html);
});