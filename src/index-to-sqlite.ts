import fs = require('fs');
import chalk = require('chalk');
import pull = require('pull-stream');
import sqlite = require('better-sqlite3');

import coolerModule = require('./ssb');

import { makeLogger } from './util';

let main = async () => {

    let log = makeLogger(chalk.cyan('indexer'), 0);

    let MODE = 'sqlite-memory';
    //let MODE = 'sqlite-disk';
    //let MODE = 'memory-array';
    //let MODE = 'none';  // iterate and discard
    log('MODE: ' + MODE);

    let db : sqlite.Database | null = null;
    if (MODE === 'sqlite-memory') {
        db = new sqlite(':memory:');
    } else if (MODE === 'sqlite-disk') {
        let dbFn = 'db.sqlite';
        if (fs.existsSync(dbFn)) {
            fs.unlinkSync(dbFn);
        }
        db = new sqlite('db.sqlite');
    }
    if (db) {
        log('preparing database');
        db.prepare(`
            CREATE TABLE IF NOT EXISTS msgs (
                key TEXT NOT NULL PRIMARY KEY
            );
        `).run();
    }

    log('instantiating cooler');
    const cooler = coolerModule({offline: true});
    log('...instantiated');

    log('opening cooler');
    let ssb = await cooler.open();
    log('...opened');

    let LIMIT = 1000;
    let startTime = Date.now();
    let numMsg = 0;
    let keys = [];  // for memory-array
    let insertStatement : sqlite.Statement | null = null;
    if (db) {
        insertStatement = db.prepare(`
            INSERT INTO msgs (key) VALUES (?);
        `);
    }

    let onEach = (msg : any) : void => {
        if (numMsg % 10000 === 0) {
            log(`onEach: ${numMsg} / ${LIMIT}`);
        }
        numMsg += 1;

        //log('-------------------------------');
        //log(msg);

        if (insertStatement) {
            insertStatement.run(msg.key);
        } else if (MODE === 'memory-array') {
            keys.push(msg.key);
        }
    }

    let onDone = (err : any) : void => {
        let endTime = Date.now();
        let seconds = (endTime - startTime) / 1000;
        log(`onDone.  ${seconds} seconds.  ${numMsg} messages.`);
        log(`${numMsg / seconds} msgs / second`);
        log(`${seconds / numMsg * 1000} ms / msg`);
        if (err) throw err;
        log('onDone: closing ssb...')
        ssb.close();
        log('...closed');

        let used : any = process.memoryUsage();
        for (let key in used) {
            console.log(
                `${key} ${Math.round((used[key] / 1024 / 1024) * 100) / 100} MB`
            );
        }

        log('MODE: ' + MODE);
        log('===================== DONE ==================');
    }

    log('starting stream');
    pull(
        ssb.createLogStream({ limit: LIMIT }),
        pull.drain(onEach, onDone)
    );
}
main();

