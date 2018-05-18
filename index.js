const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const Benchmark = require('benchmark');
const beauty = require('beautify-benchmark');

const EventEmitter = require('events');
const EventEmitter2 = require('event-emitter');
const EventEmitter3 = require('eventemitter3');

const createArray = (count) => {
  const array = _.times(count, () => () => {});
  return array;
};

const createObject = (count) => {
  const object = {};
  _.times(count, t => object[t] = () => {});
  return object;
};

const benchmarks = {
  'npm events': (count) => {
    const eventEmitter = new EventEmitter();
    eventEmitter.setMaxListeners(0);
    _.times(count, () => eventEmitter.on('test', () => {}));
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'npm event-emitter': (count) => {
    const eventEmitter = new EventEmitter2();
    _.times(count, () => eventEmitter.on('test', () => {}));
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'npm eventemitter3': (count) => {
    const eventEmitter = new EventEmitter3();
    _.times(count, () => eventEmitter.on('test', () => {}));
    return {
      fn() {
        eventEmitter.emit('test', 123);
      },
    };
  },
  'for by array': (count) => {
    const array = createArray(count);
    return {
      fn() {
        for (let i = 0; i < array.length; i++) array[i]();
      },
    };
  },
  'for-in by array': (count) => {
    const array = createArray(count);
    return {
      fn() {
        for (let i in array) array[i]();
      },
    };
  },
  'for-of by array': (count) => {
    const array = createArray(count);
    return {
      fn() {
        for (let f of array) f();
      },
    };
  },
  'forEach by array': (count) => {
    const array = createArray(count);
    return {
      fn() {
        array.forEach(f => f());
      },
    };
  },
  '_.forEach by array (npm: lodash)': (count) => {
    const array = createArray(count);
    return {
      fn() {
        _.forEach(array, f => f());
      },
    };
  },
  'while by array': (count) => {
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
  'for by object': (count) => {
    const object = createObject(count);
    return {
      fn() {
        for (let i = 0; i < count; i++) object[i]();
      },
    };
  },
  'for-in by object': (count) => {
    const object = createObject(count);
    return {
      fn() {
        for (let i in object) object[i]();
      },
    };
  },
  '_.forEach by object (npm: lodash)': (count) => {
    const object = createObject(count);
    return {
      fn() {
        _.forEach(object, f => f());
      },
    };
  },
  'while by linked objects': (count) => {
    const start = { listener: () => {}, next: null };
    let last = start;
    _.times(count, () => {
      const next = { listener: () => {}, next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        let pointer = start;
        while (pointer.next) {
          pointer.listener();
          pointer = pointer.next;
        }
      },
    };
  },
  'while by linked objects with resolve': (count) => {
    const start = { listener: resolve => resolve(), next: null };
    let last = start;
    _.times(count, () => {
      const next = { listener: resolve => resolve(), next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        let t = 0;
        const resolve = () => {
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
  'while by linked objects with defer.resolve': (count) => {
    const start = { listener: defer => defer.resolve(), next: null };
    let last = start;
    _.times(count, () => {
      const next = { listener: defer => defer.resolve(), next: null };
      last.next = next;
      last = next;
    });
    return {
      fn() {
        let t = 0;
        const d = {
          resolve: () => {
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

const createSuite = (benchmarks, count) => {
  const suite = new Benchmark.Suite();
  for (let t in benchmarks) suite.add(t, benchmarks[t](count));
  return suite;
};

const createSuites = (benchmarks) => {
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

const launch = (suites) => {
  async.eachSeries(
    _.keys(suites),
    (suiteName, next) => {
      console.log(suiteName);
      suites[suiteName].on('cycle', (event) => beauty.add(event.target));
      suites[suiteName].on('complete', (event) => {
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
