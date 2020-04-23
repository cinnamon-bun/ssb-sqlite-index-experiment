import chalk = require('chalk');
import pull = require('pull-stream');
import debugModule = require('debug');
import sqlite = require('better-sqlite3');

import coolerModule = require('./ssb');

let main = async () => {

    let log = debugModule('indexer');
    log.enabled = true;

    let db

    log('instantiating cooler');
    const cooler = coolerModule({offline: true});
    log('...instantiated');

    log('opening cooler');
    let ssb = await cooler.open();
    log('...opened');


    let startTime = Date.now();
    let numMsg = 0;
    let LIMIT = 100000;
    let onEach = (msg : any) : void => {
        //log('onEach');
        if (numMsg % 10000 === 0) {
            log(`onEach: ${numMsg} / ${LIMIT}`);
        }
        numMsg += 1;
    }
    let onDone = (err : any) : void => {
        let endTime = Date.now();
        let seconds = (endTime - startTime) / 1000;
        log(`onDone.  ${seconds} seconds.  ${numMsg} messages.`);
        log(`${numMsg / seconds} msgs / second`);
        if (err) throw err;
        log('onDone: closing ssb...')
        ssb.close();
        log('...closed');
        log('===================== DONE ==================');
    }

    log('starting stream');
    pull(
        ssb.createLogStream({ limit: LIMIT }),
        pull.drain(onEach, onDone)
    );
}
main();

