const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const Benchmark = require('benchmark');
const beauty = require('beautify-benchmark');

const EventEmitter = require('events');
const EventEmitter2 = require('event-emitter');
const EventEmitter3 = require('eventemitter3');

const createArray = function (count) {
  const array = _.times(count, function() { return function() {}; });
  return array;
};

const createObject = function (count) {
  const object = {};
  _.times(count, function(t) { object[t] = function() {}; });
  return object;
};

const benchmarks = {
  'npm events': function (count) {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(0);
    _.times(count, function() { eventEmitter.on('test', function() {}); });
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'npm event-emitter': function (count) {
    const eventEmitter = new EventEmitter2();
    _.times(count, function() { eventEmitter.on('test', function() {}); });
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'npm eventemitter3': function (count) {
    const eventEmitter = new EventEmitter3();
    _.times(count, function() { eventEmitter.on('test', function() {}) });
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'for by array': function (count) {
    const array = createArray(count);
    return {
      fn() {
        for (let i = 0; i < array.length; i++) array[i]();
      },
    };
  },
  'for-in by array': function (count) {
    const array = createArray(count);
    return {
      fn() {
        for (let i in array) array[i]();
      },
    };
  },
  'for-of by array': function (count) {
    const array = createArray(count);
    return {
      fn() {
        for (let f of array) f();
      },
    };
  },
  'forEach by array': function (count) {
    const array = createArray(count);
    return {
      fn() {
        array.forEach(function(f) { f(); });
      },
    };
  },
  '_.forEach by array (npm: lodash)': function (count) {
    const array = createArray(count);
    return {
      fn() {
        _.forEach(array, function(f) { f(); });
      },
    };
  },
  'while by array': function (count) {
    const array = createArray(count);
    return {
      fn() {
        let i = 0;
        while (i < array.length) {
          array[i]();
          i++;
        }
      },
    };
  },
  'for by object': function (count) {
    const object = createObject(count);
    return {
      fn() {
        for (let i = 0; i < count; i++) object[i]();
      },
    };
  },
  'for-in by object': function (count) {
    const object = createObject(count);
    return {
      fn() {
        for (let i in object) object[i]();
      },
    };
  },
  '_.forEach by object (npm: lodash)': function (count) {
    const object = createObject(count);
    return {
      fn() {
        _.forEach(object, function(f) { f(); });
      },
    };
  },
  'while by linked objects': function (count) {
    const start = { listener: function() {}, next: null };
    let last = start;
    _.times(count, function() {
      const next = { listener: function() {}, next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        let pointer = start;
        while (pointer) {
          pointer.listener();
          pointer = pointer.next;
        }
      },
    };
  },
  'while by linked objects with resolve': function (count) {
    const start = { listener: function(resolve) { resolve(); }, next: null };
    let last = start;
    _.times(count, function() {
      const next = { listener: function(resolve) { resolve(); }, next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        let t = 0;
        const resolve = function() {
          t++;
        }
        let pointer = start;
        while (pointer.next) {
          pointer.listener(resolve);
          pointer = pointer.next;
        }
      },
    };
  },
  'while by linked objects with defer.resolve': function (count) {
    const start = { listener: function (defer) { defer.resolve(); }, next: null };
    let last = start;
    _.times(count, function() {
      const next = { listener: function (defer) { defer.resolve(); }, next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        let t = 0;
        const d = {
          resolve: function() {
            t++;
          }
        };
        let pointer = start;
        while (pointer.next) {
          pointer.listener(d);
          pointer = pointer.next;
        }
      },
    };
  },
};

const createSuite = function (benchmarks, count) {
  const suite = new Benchmark.Suite();
  for (let t in benchmarks) suite.add(t, benchmarks[t](count));
  return suite;
};

const createSuites = function (benchmarks) {
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

const suites = createSuites(benchmarks);

const launch = function (suites) {
  async.eachSeries(
    _.keys(suites),
    function (suiteName, next) {
      console.log(suiteName);
      suites[suiteName].on('cycle', function (event) { beauty.add(event.target); });
      suites[suiteName].on('complete', function (event) {
        beauty.log();
        next();
      });
      suites[suiteName].run({ async: true });
    },
  );
};

module.exports = {
  benchmarks,
  createSuite,
  createSuites,
  suites,
  launch,
};
