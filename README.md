# SSB sqlite indexing experiment

Is it practical to use sqlite as an index for SSB messages?

With the help of Christian Bundy!  See [ssb-sqlite](https://github.com/christianbundy/ssb-sqlite) for his take on this.

## Benchmark

Input file:
* 1 million messages as newline-delimited JSON, 740 mb

Output file:
* sqlite file, 645 mb

Timings on a 2013 iMac.  Experimenting with different numbers of messages to insert in each transaction.

```
commit transaction every 100,000 messages
    36.4 seconds
    27454.4 messages per second
    0.036 ms per message

commit transaction every 10,000 messages
    52.9 seconds
    18898.6 messages per second
    0.053 ms per message

commit transaction every 1,000 messages
    75.5 seconds
    13251.2 messages per second
    0.075 ms per message

commit transaction every 100 messages
    92.1 seconds
    10854.3 messages per second
    0.092 ms per message
```

Max memory usage: 79 mb, about the same for all the transaction sizes.

## Database Schema
```
CREATE TABLE IF NOT EXISTS msgs (
    key TEXT NOT NULL PRIMARY KEY,
    previousMessage TEXT,
    author TEXT,
    content TEXT,
    timestampReceived NUMBER,
    timestampAsserted NUMBER
);
```
Example row.  Note the `content` field is a string holding encoded JSON.
```
              key = %ox6s7+BrBiyKWthGxQ/iu4NgvGXv2f1P63/S7m+bNKc=.sha256
  previousMessage = %d6Jk7mwiXdl9+JaEhCcr+2q1ta19YiJGnOcNPqeuJVo=.sha256
           author = @fBS90Djngwl/SlCh/20G7piSC064Qz2hBBxbfnbyM+Y=.ed25519
          content = {"type":"pub","address":{"host":"ssb.hypersignal.xyz","port":8008,"key":"@XRg7pXoQqsWDDk4dmgvSWHUqzwS6BmqMo4IdbMKPjWA=.ed25519"}}
timestampReceived = 1505676293843
timestampAsserted = 1505676293841
```
