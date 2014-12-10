function Walker(){}

Walker.prototype.handle = function(node, callback){
  callback(node);
}
Walker.prototype.walk = function(doc, callback){
  var self = this;
  var callTime = 0;
  function asyncWalk(doc, asyncCallback){
    if(!doc  || !doc.childNodes){
      return asyncCallback(doc);
    }

    var index = 0, len = doc.childNodes.length;
    var newChildren = [];
    function next(){
      if(index >= len){
        doc.childNodes = newChildren;
        asyncCallback(doc);
      }else{
        self.handle(doc.childNodes[index], function(node, stopWalk){
          if(stopWalk){
            if(node){
              newChildren.push(node);
            }
            index++;
            setImmediate(next)
          }else{
            asyncWalk(node, function(newNode){
              if(newNode){
                newChildren.push(newNode);
              }
              index++;
              setImmediate(next)
            });
          }
        });
      }
    }
    next();
   
  }
  asyncWalk(doc, callback);
}


function executeQueueFilter(queue, params, completeCallback){
  var index = 0, length = queue.length;
  var currentParams = params;
  function next(){
    if(index >= length || !currentParams){
      return completeCallback(currentParams);
    }else{
      queue[index](currentParams, function(newParams){
        currentParams = newParams;
        index++;
        next();
      });
    }
  }
  next();
}

function Transformer(){
  this.beforeFilters = [];
  this.nodeFilters = [];
  this.afterFilters = [];
  this.initWalker();
}

Transformer.prototype.initWalker = function(){
  this.walker = new Walker();
  this.walker.handle = function(node, callback){
    executeQueueFilter(this.nodeFilters, node, function(n){
      callback(n);
    });
  }.bind(this);
}

Transformer.prototype.addBeforeFilter = function(filter){
  this.beforeFilters.push(filter);
}
Transformer.prototype.addNodeFilter = function(filter){
  this.nodeFilters.push(filter);
}
Transformer.prototype.addAfterFilter = function(filter){
  this.afterFilters.push(filter);
}

Transformer.prototype.transform = function(input, callback){
  executeQueueFilter(this.beforeFilters, input, function(doc){
    this.walker.walk(doc, function(document){
      executeQueueFilter(this.afterFilters, document, function(result){
        callback(result);
      });
    }.bind(this));
  }.bind(this));
}

exports.Walker = Walker;
exports.Transformer = Transformer;