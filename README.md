# SSB sqlite indexing experiment

Is it practical to use sqlite as an index for SSB messages?

With the help of Christian Bundy!  See [ssb-sqlite](https://github.com/christianbundy/ssb-sqlite) for his take on this.  He used an ORM (sequelize), I used raw SQL.

## Benchmark

Input file:
* 1 million messages as newline-delimited JSON, 740 mb

Output file:
* sqlite file, 645 mb on disk

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
CREATE TABLE IF NOT EXISTS authors (
    key TEXT NOT NULL PRIMARY KEY,
    name TEXT,
    description TEXT,
    image TEXT
);
```
Example row from `msgs`.  Note the `content` field is a string holding encoded JSON.
```
              key = %ox6s...............redacted................=.sha256
  previousMessage = %d6Jk.......................................=.sha256
           author = @fBS9.......................................=.ed25519
          content = {"type":"pub","address":{"host":"ssb.hypersignal.xyz","port":8008,"key":"@XRg7pXo....................................=.ed25519"}}
timestampReceived = 1505676293843
timestampAsserted = 1505676293841
```

Example row from `authors`.
```
        key = @fBS9..............redacted.................=.ed25519
       name = cinnamon
description = blah blah blah description redacted
      image = &D7Qt.......................................=.sha256
```
