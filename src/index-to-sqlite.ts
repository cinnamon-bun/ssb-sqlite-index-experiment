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
        );
    `).run();
    db.prepare(`
        CREATE TABLE IF NOT EXISTS authors (
            key TEXT NOT NULL PRIMARY KEY,
            name TEXT,
            description TEXT,
            image TEXT
        );
    `).run();

    // set up data source
    const fileStream = fs.createReadStream('log.jsonl');
    const lines = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    // 
    let insertMsgSt = db.prepare(`
        INSERT OR REPLACE INTO msgs (
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
    let getAuthorSt = db.prepare(`
        SELECT * FROM authors WHERE key = ?;
    `);
    let insertAuthorSt = db.prepare(`
        INSERT OR REPLACE INTO authors (
            key,
            name,
            description,
            image
        ) VALUES (
            ?, -- key
            ?, -- name
            ?, -- description
            ? -- image
        );
    `);
    let beginSt = db.prepare(`BEGIN IMMEDIATE;`);
    let commitSt = db.prepare(`COMMIT;`);

    let ingestMsg = (msg : SSBMessage) : void => {
        // msgs table
        insertMsgSt.run(
            msg.key,
            msg.value.previous,
            msg.value.author,
            JSON.stringify(msg.value.content),
            msg.timestamp,  // received
            msg.value.timestamp,  // asserted
        );

        // authors table
        if (msg.value.content.type === 'about') {
            let content = msg.value.content;
            if (typeof content.about === 'string') {
                // first fetch existing about row, if there is one
                let result = getAuthorSt.get(content.about);
                // otherwise start with a default
                if (result === undefined) {
                    result = {
                        key: content.about,
                        name: '',
                        description: '',
                        image: ''
                    };
                }

                // update the row with new values
                if (typeof content.name === 'string' && content.name !== '') {
                    result.name = content.name;
                }

                if (typeof content.description === 'string' && content.description !== '') {
                    result.description = content.description;
                }

                if (content.image !== null && typeof content.image === 'object' && typeof content.image.link === 'string' && content.image.link !== '') {
                    result.image = content.image.link;
                } else if (typeof content.image === 'string' && content.image !== '') {
                    result.image = content.image;
                }

                // insert-or-replace it back to the database
                try {
                    insertAuthorSt.run(
                        result.key,
                        result.name,
                        result.description,
                        result.image
                    )
                } catch (e) {
                    log('weird about message:');
                    log(content);
                    log(e)
                    log('-----------------');
                    log('-----------------');
                    log('-----------------');
                }
            }
        }
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

    let numAuthors = db.prepare('SELECT COUNT(*) as count FROM authors;').get().count;

    let seconds = (endTime - startTime) / 1000;
    //log();
    log(`commit transaction every ${commitEvery} messages`);
    log(`${ii} total messages`);
    log(`${Math.round(seconds*10)/10} seconds`);
    log(`${Math.round(ii/seconds*10)/10} messages per second`);
    log(`${Math.round(seconds/ii*1000*1000)/1000} ms per message`);
    log(`${numAuthors} authors in table`);
}
main();

