import fs from 'fs';

export let sleep = async (ms : number) : Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, ms);
    });
}

export let rand = (lo : number, hi : number) : number =>
    Math.random() * (hi-lo) + lo;

export let replaceAll = (s : string, ch : string, ch2 : string) : string => {
    return s.split(ch).join(ch2);
}

export let ensureNoTrailingSlash = (path : string) : string => {
    while (path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return path;
}

export let ensureTrailingSlash = (path : string) : string =>
    path.endsWith('/') ? path : path + '/';

export let ensureDirExists = (path : string) : void => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path);
    }
}

export type LoggerFn = (...args : any[]) => void;
export let makeLogger = (tag : string, level: number) : LoggerFn =>
    (...args : any[]) =>
        console.log(`  ${(' '.repeat(level*2) + tag).padEnd(24, ' ')} | `, ...args);
export let nopLogger : LoggerFn = () => {}

export let saveJson = (json : any, path : string) : void => {
    let tmpPath = path + '.tmp';
    fs.writeFileSync(tmpPath, JSON.stringify(json, null, 4), {encoding: 'utf-8'});
    fs.renameSync(tmpPath, path);
}

export let readJson = (path : string) : any => {
    return JSON.parse(fs.readFileSync(path, {encoding: 'utf8'}));
}
