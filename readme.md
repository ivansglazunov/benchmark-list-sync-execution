# benchmark-list-sync-execution

[![Build Status](https://travis-ci.org/ivansglazunov/benchmark-list-sync-execution.svg?branch=master)](https://travis-ci.org/ivansglazunov/benchmark-list-sync-execution)

Summary extract from travis for different versions of the node. 1000 items is used.

| Tests                                      | v10             | v9              | v8              | v7             | v6              | v5              |
| ------------------------------------------ | --------------: | --------------: | --------------: | -------------: | --------------: | --------------: |
| npm events                                 | 67,270          | 67,270          | 28,511          | 49,667         | 62,122          | 46,962          |
| npm event-emitter                          | 31,880          | 31,880          | 15,117          | 25,829         | 5,139           | 2,436           |
| npm eventemitter3                          | 49,989          | 49,989          | 39,328          | 51,193         | 74,469          | 58,662          |
| for by array                               | _107,606_     | _107,606_     | 70,575          | _**88,673**_ | _**108,344**_ | _103,135_     |
| for-in by array                            | 16,562          | 16,562          | 11,937          | 14,826         | 26,985          | 14,163          |
| for-of by array                            | _**120,728**_ | _**120,728**_ | 79,578          | _90,610_     | 10,909          | 11,475          |
| forEach by array                           | _110,842_     | _110,842_     | 39,135          | 35,243         | 37,350          | 12,990          |
| _.forEach by array (npm: lodash)           | 43,894          | 43,894          | 48,061          | 38,204         | 48,764          | _49,920_      |
| while by array                             | 97,657          | 97,657          | 87,806          | _84,543_     | _99,293_      | _**107,330**_ |
| for by object                              | 85,369          | 85,369          | _94,732_      | _85,532_     | _99,049_      | _104,257_     |
| for-in by object                           | 13,628          | 13,628          | 13,898          | 13,889         | 26,604          | 15,502          |
| _.forEach by object (npm: lodash)          | 16,899          | 16,899          | 10,647          | 13,661         | 17,286          | 19,120          |
| while by linked objects                    | _108,236_     | _108,236_     | _**112,972**_ | 63,444         | 84,998          | _102,770_     |
| while by linked objects with resolve       | 53,768          | 53,768          | 55,254          | 51,930         | 53,969          | 57,606          |
| while by linked objects with defer.resolve | 49,791          | 49,791          | 53,899          | 25,654         | 49,326          | 50,823          |
