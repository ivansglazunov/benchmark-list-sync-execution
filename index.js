var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var Benchmark = require('benchmark');
var beauty = require('beautify-benchmark');

var EventEmitter = require('events');
var EventEmitter2 = require('event-emitter');
var EventEmitter3 = require('eventemitter3');

var createArray = function (count) {
  var array = _.times(count, function() { return function() {}; });
  return array;
};

var createObject = function (count) {
  var object = {};
  _.times(count, function(t) { object[t] = function() {}; });
  return object;
};

var benchmarks = {
  'npm events': function (count) {
    var eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(0);
    _.times(count, function() { eventEmitter.on('test', function() {}); });
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'npm event-emitter': function (count) {
    var eventEmitter = new EventEmitter2();
    _.times(count, function() { eventEmitter.on('test', function() {}); });
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'npm eventemitter3': function (count) {
    var eventEmitter = new EventEmitter3();
    _.times(count, function() { eventEmitter.on('test', function() {}) });
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'for by array': function (count) {
    var array = createArray(count);
    return {
      fn() {
        for (var i = 0; i < array.length; i++) array[i]();
      },
    };
  },
  'for-in by array': function (count) {
    var array = createArray(count);
    return {
      fn() {
        for (var i in array) array[i]();
      },
    };
  },
  'for-of by array': function (count) {
    var array = createArray(count);
    return {
      fn() {
        for (var f of array) f();
      },
    };
  },
  'forEach by array': function (count) {
    var array = createArray(count);
    return {
      fn() {
        array.forEach(function(f) { f(); });
      },
    };
  },
  '_.forEach by array (npm: lodash)': function (count) {
    var array = createArray(count);
    return {
      fn() {
        _.forEach(array, function(f) { f(); });
      },
    };
  },
  'while by array': function (count) {
    var array = createArray(count);
    return {
      fn() {
        var i = 0;
        while (i < array.length) {
          array[i]();
          i++;
        }
      },
    };
  },
  'for by object': function (count) {
    var object = createObject(count);
    return {
      fn() {
        for (var i = 0; i < count; i++) object[i]();
      },
    };
  },
  'for-in by object': function (count) {
    var object = createObject(count);
    return {
      fn() {
        for (var i in object) object[i]();
      },
    };
  },
  '_.forEach by object (npm: lodash)': function (count) {
    var object = createObject(count);
    return {
      fn() {
        _.forEach(object, function(f) { f(); });
      },
    };
  },
  'while by linked objects': function (count) {
    var start = { listener: function() {}, next: null };
    var last = start;
    _.times(count, function() {
      var next = { listener: function() {}, next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        var pointer = start;
        while (pointer) {
          pointer.listener();
          pointer = pointer.next;
        }
      },
    };
  },
  'while by linked objects with resolve': function (count) {
    var start = { listener: function(resolve) { resolve(); }, next: null };
    var last = start;
    _.times(count, function() {
      var next = { listener: function(resolve) { resolve(); }, next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        var t = 0;
        var resolve = function() {
          t++;
        }
        var pointer = start;
        while (pointer.next) {
          pointer.listener(resolve);
          pointer = pointer.next;
        }
      },
    };
  },
  'while by linked objects with defer.resolve': function (count) {
    var start = { listener: function (defer) { defer.resolve(); }, next: null };
    var last = start;
    _.times(count, function() {
      var next = { listener: function (defer) { defer.resolve(); }, next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        var t = 0;
        var d = {
          resolve: function() {
            t++;
          }
        };
        var pointer = start;
        while (pointer.next) {
          pointer.listener(d);
          pointer = pointer.next;
        }
      },
    };
  },
};

var createSuite = function (benchmarks, count) {
  var suite = new Benchmark.Suite();
  for (var t in benchmarks) suite.add(t, benchmarks[t](count));
  return suite;
};

var createSuites = function (benchmarks) {
  return {
    '10 items': createSuite(benchmarks, 10),
    '100 items': createSuite(benchmarks, 100),
    '250 items': createSuite(benchmarks, 250),
    '500 items': createSuite(benchmarks, 500),
    '1000 items': createSuite(benchmarks, 1000),
    '5000 items': createSuite(benchmarks, 5000),
    '10000 items': createSuite(benchmarks, 10000),
  };
};

var suites = createSuites(benchmarks);

var launch = function (suites) {
  async.eachSeries(
    _.keys(suites),
    function (suiteName, next) {
      console.log(suiteName);
      suites[suiteName].on('cycle', function (event) { beauty.add(event.target); });
      suites[suiteName].on('compvare', function (event) {
        beauty.log();
        next();
      });
      suites[suiteName].run({ async: true });
    }
  );
};

module.exports = {
  benchmarks,
  createSuite,
  createSuites,
  suites,
  launch,
};
