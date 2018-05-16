const fs = require('fs');
const async = require('async');
const _ = require('lodash');
const Benchmark = require('benchmark');
const beauty = require('beautify-benchmark');

const createArray = (count) => {
  const array = _.times(count, () => () => {});
  return array;
};

const createObject = (count) => {
  const object = {};
  _.times(count, t => object[t] = () => {});
  return object;
};

const createLinkedObjects = (count) => {
  const start = { listener: () => {}, next: null };
  let last = start;
  _.times(count, () => {
    const next = { listener: () => {}, next: null };
    last.next = next;
    last = next;
  });
  return start;
};

const benchmarks = {
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
    const start = createLinkedObjects(count);
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
};

const createSuite = (count) => {
  const suite = new Benchmark.Suite();
  for (let t in benchmarks) suite.add(t, benchmarks[t]({ count }));
  return suite;
};

const createSuites = () => {
  return {
    '10 items': createSuite(10),
    '100 items': createSuite(100),
    '250 items': createSuite(250),
    '500 items': createSuite(500),
    '1000 items': createSuite(1000),
    '5000 items': createSuite(5000),
    '10000 items': createSuite(10000),
  };
};

const suites = createSuites();

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

launch(suites);
