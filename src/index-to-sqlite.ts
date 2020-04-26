import fs = require('fs');
import readline = require("readline");
import chalk = require('chalk');
//import pull = require('pull-stream');
import sqlite = require('better-sqlite3');

//import coolerModule = require('./ssb');

import { makeLogger } from './util';
import {
    SSBMessage,
} from './types';

let main = async () => {

    let log = makeLogger(chalk.cyan('indexer'), 0);

    // set up database
    const IN_MEMORY = false;
    const dbFn = IN_MEMORY ? ':memory:' : 'db.sqlite';

    if (!IN_MEMORY && fs.existsSync(dbFn)) {
        try {
            fs.unlinkSync(dbFn);
            fs.unlinkSync(dbFn + '-journal');
        } catch (e) {
        }
    }
    const db = new sqlite(dbFn);

    //log('preparing database');
    db.prepare(`
        CREATE TABLE IF NOT EXISTS msgs (
            key TEXT NOT NULL PRIMARY KEY,
            previousMessage TEXT,
            author TEXT,
            content TEXT,
            timestampReceived NUMBER,
            timestampAsserted NUMBER
            -- value TEXT,
            -- timestamp NUMBER
        );
    `).run();

    // set up data source
    const fileStream = fs.createReadStream('log.jsonl');
    const lines = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // 
    let insertStatement = db.prepare(`
        INSERT INTO msgs (
            key,
            previousMessage,
            author,
            content,
            timestampReceived,
            timestampAsserted
        ) VALUES (
            ?, -- key
            ?, -- previousMessage
            ?, -- author
            ?, -- content
            ?, -- timestampReceived
            ? -- timestampAsserted
        );
    `);
    let beginSt = db.prepare(`BEGIN IMMEDIATE;`);
    let commitSt = db.prepare(`COMMIT;`);

    let ingestMsg = (msg : SSBMessage) : void => {
        insertStatement.run(
            msg.key,
            msg.value.previous,
            msg.value.author,
            JSON.stringify(msg.value.content),
            msg.timestamp,  // received
            msg.value.timestamp,  // asserted
            //msg.key,
            //JSON.stringify(msg.value),
            //msg.timestamp
        );
    }

    // go
    let args = process.argv.slice(2);
    let limit = +(args[0] || '100000');
    let commitEvery = +(args[1] || '1000');

    let ii = 0;
    //let printEvery = 10000;
    //let commitEvery = 1000;
    let startTime = Date.now();
    beginSt.run();
    for await (const line of lines) {
        //if (ii % printEvery === 0) {
        //    log(`${ii} / ${limit} (${Math.round(ii/limit*100*10)/10} %)`);
        //}

        let msg = JSON.parse(line) as SSBMessage;
        ingestMsg(msg);

        ii += 1;
        if (ii >= limit) { break; }
        if (ii % commitEvery === 0) {
            commitSt.run();
            beginSt.run();
        }
    }
    commitSt.run();
    let endTime = Date.now();
    let seconds = (endTime - startTime) / 1000;
    //log();
    log(`commit transaction every ${commitEvery} messages`);
    log(`${Math.round(seconds*10)/10} seconds`);
    log(`${ii} messages`);
    log(`${Math.round(ii/seconds*10)/10} messages per second`);
    log(`${Math.round(seconds/ii*1000*1000)/1000} ms per message`);



    /*
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
    */
}
main();

