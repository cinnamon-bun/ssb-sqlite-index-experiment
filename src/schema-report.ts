import fs = require('fs');
import readline = require("readline");
import chalk = require('chalk');
import sqlite = require('better-sqlite3');

import {
    getTypeo,
    makeLogger,
    typeo,
} from './util';
import {
    SSBMessage,
} from './types';

class Histogram {
    data : {[value:string]: number};
    name : string;
    constructor(name : string) {
        this.data = {};
        this.name = name;
    }
    add(value : string) : void {
        this.data[value] = (this.data[value] || 0) + 1;
    }
    reportBy(reportStyle : 'alpha' | 'num', threshold: number = 0) : string {
        // threshold is a fraction between 0 and 1
        // ignore any values which make up less than that fraction of the total
        let pairs : [string, number][] = Object.keys(this.data)
            .map(k => [k, this.data[k]]);
        let sortAlpha = (a : [string, number], b : [string, number]) : number => {
            if (a[0] === b[0]) { return 0; }
            return a[0] > b[0] ? 1 : -1;
        }
        let sortNum = (a : [string, number], b : [string, number]) : number => {
            if (a[1] === b[1]) { return sortAlpha(a, b); }
            return a[1] < b[1] ? 1 : -1;
        }
        let sortFn = reportStyle === 'alpha' ? sortAlpha : sortNum;
        pairs.sort(sortFn);
        let total = Object.values(this.data).reduce((a, b) => a+b, 0);
        let report : string[] = pairs
            .filter(([s, n]) => n/total > threshold)
            .map(([s, n]) => {
                let pct = '' + Math.round(n / total * 100);
                return `${(''+n).padStart(8)}   ${pct.padStart(5)} %: ${s}`;
            });
        report.unshift(`${(''+total).padStart(8)}  total`);
        report.unshift(`== ${this.name} (by ${reportStyle}) ==`);
        report.push('');
        return report.join('\n');
    }
}

let main = async () => {

    let log = makeLogger(chalk.cyan('indexer'), 0);

    let args = process.argv.slice(2);
    let fn = args[0];
    let limit = +(args[1] || '10000000000');
    if (!fn || fn === '-h' || fn === '--help') {
        console.log('usage: fn [limit]');
        process.exit(-1);
    }

    const fileStream = fs.createReadStream(fn);
    const lines = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    let keyTypeH = new Histogram('typeof key');
    let valueTypeH = new Histogram('typeof value');
    let receivedTimestampH = new Histogram('typeof timestamp (received)');

    let previousH = new Histogram('typeof value.previous');
    let authorH = new Histogram('typeof value.author');
    let sequenceH = new Histogram('typeof value.sequence');
    let assertedTimestampH = new Histogram('typeof value.timestamp (asserted)');
    let hashH = new Histogram('value.hash');
    let contentH = new Histogram('typeof value.content');
    let signatureH = new Histogram('typeof value.signature');

    let typeoTypeH = new Histogram('typeof value.content.type');
    let typeH = new Histogram('value.content.type');

    let ii = 0;
    for await (const line of lines) {
        let msg = JSON.parse(line) as SSBMessage;

        keyTypeH.add(getTypeo(msg, 'key'));
        valueTypeH.add(getTypeo(msg, 'value'));
        receivedTimestampH.add(getTypeo(msg, 'timestamp'));

        previousH.add(getTypeo(msg.value, 'previous'));
        authorH.add(getTypeo(msg.value, 'author'));
        sequenceH.add(getTypeo(msg.value, 'sequence'));
        assertedTimestampH.add(getTypeo(msg.value, 'timestamp'));
        hashH.add(JSON.stringify(msg.value?.hash));
        contentH.add(getTypeo(msg.value, 'content'));
        signatureH.add(getTypeo(msg.value, 'signature'));

        typeoTypeH.add(getTypeo(msg.value?.content, 'type'));
        typeH.add(JSON.stringify(msg.value?.content?.type));

        ii++;
        if (ii >= limit) { break; }
    }
    console.log(keyTypeH.reportBy('num', 0));
    console.log(valueTypeH.reportBy('num', 0));
    console.log(receivedTimestampH.reportBy('num', 0));

    console.log(previousH.reportBy('num', 0));
    console.log(authorH.reportBy('num', 0));
    console.log(sequenceH.reportBy('num', 0));
    console.log(assertedTimestampH.reportBy('num', 0));
    console.log(hashH.reportBy('num', 0));
    console.log(contentH.reportBy('num', 0));
    console.log(signatureH.reportBy('num', 0));

    console.log(typeoTypeH.reportBy('num', 0));
    console.log(typeH.reportBy('num', 0)); //0.005 / 100));
}
main();