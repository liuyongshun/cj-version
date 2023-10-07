var Table = require('cli-table');
var colors = require('colors');
const util = require('./index.js');
const exec = require('child_process').exec;

let table = null;

// genrator new table
const genNewTable = (options) => {
    const {field} = options;
    const arr = field.map(n => n);
    // if has version field, we will append newVersion to it
    if (arr.includes('version')) {
        arr.unshift('use version');
    }
    // every dependency name
    arr.unshift('name');
    return new Table({
        head: arr
    });
}

// deal params
const getParams = (obj, exc = ['_', '$0']) => {
    let data = {};
    Object.keys(obj).forEach(n => {
        if (!exc.includes(n)) data[n] = obj[n];
    })
    return data;
}

// exectute shell command
const execShellFn = (item, field) => {
    const cmdStr = `npm view ${item[0]} ${field.join(' ')}`;
    return new Promise((resolve, reject) => {
        exec(cmdStr, {
            encoding: 'utf8'
        }, (err, data) => {
            if (err) {
                reject(err)
            } else {
                resolve(data);
            }
        });
    });
}

// get current message
const getMsg = (res, field) => {
    return field.map(item => {
        let regVer = new RegExp(`(?<=${item}\\s=\\s\\')[^']+`, 'i');
        if (['engines'].includes(item)) {
            regVer = new RegExp(`(?<=${item}\\s=\\s*)\\{[^}]+\\}`, 'gims');
        }
        const result = res.match(regVer);
        return result? result[0] : '';
    })
}

// get current version first char
const checkStartChar = (char) => {
    const patt = /[0-9]/;
    if (patt.test(char)) {
        return 3;
    }
    if (char === '^') {
        return 1;
    }
    if (char === '~') {
        return 2;
    }
}

// check version
const checkVersion = (lowerVersion = [], currVersion = [], diffLen = 3) => {
    let canDo = true;
    const versionList = currVersion;
    if (versionList && versionList.length) {
        // 比较每一位版本，如果相等继续循环，如果能区分大小则跳出循环结束
        for (let i = 0; i < diffLen; i++) {
            if (Number(versionList[i]) > lowerVersion[i]) {
                canDo = true;
                break;
            }
            if (Number(versionList[i]) < lowerVersion[i]) {
                canDo = false;
                break;
            }
        }
    }
    return canDo;
};

// diff version by byte
const diffVersion =  (curVer, lastVer) => {
    // if first word is number, that means the version is same always
    const startChar = checkStartChar(curVer[0]);
    const patt = /[0-9.]+/;
    const matRes = curVer.match(patt);
    const realCurrVer = matRes[0];
    const lastVerList = lastVer.split('.').map(n => Number(n));
    const currVerList = realCurrVer.split('.').map(n => Number(n));
    return checkVersion(lastVerList, currVerList, startChar);
}

const fnInit = (options) => {
    const {field} = options;
    let total = 0;
    return (list, dataJson, nameSpace) => {
        total += list.length;
        dataJson[nameSpace] = {}
        return Promise.all(list.map(item => {
            if (item[1].includes('http')) {
                const pattMatVer = /(~|\^)?\d+\.\d+\.\d+/;
                const matResVer = item[1].match(pattMatVer);
                item[1] = matResVer ? matResVer[0] : '';
            }
            const tableLine = [...item];
            return execShellFn(item, field).then(res => {
                const msgData = getMsg(res, field);
                const index = field.findIndex(n => n === 'version');
                // version not last
                if (!diffVersion(item[1], msgData[index])) {
                    tableLine[0] = colors.yellow(tableLine[0]);
                }
                tableLine.push(...msgData);
            }).catch(() => {
                tableLine.push(...new Array(field.length).fill('fail'));
            }).finally(() => {
                if (table) {
                    table.push(tableLine);
                }
            })
        })).then(() => {
            console.info(colors.green(`${nameSpace} 完成 ${list.length} 个；总数完成 ${total} 个；`));
        })
    }
}

async function genDiff (options = {}) {
    if (!util.isFile(options.dir)) return;
    try {
        if (typeof options.field === 'string') {
            options.field = JSON.parse(options.field)
        }
    } catch (error) {
        console.error(error);
    }
    let fileData = util.readFile(options.dir);
    try {
        const dataJson = {};
        table = genNewTable(options);
        const packageJson = JSON.parse(fileData);
        const {dependencies, devDependencies} = packageJson;
        const dependenciesList = Object.entries(dependencies);
        const devDependenciesList = Object.entries(devDependencies);
        const dealData = fnInit(options);
        console.info('========== package.json依赖 当前版本和最新版本比较 start ==========');
        await Promise.all([
            dealData(dependenciesList, dataJson, 'dependencies'),
            dealData(devDependenciesList, dataJson, 'devDependencies')
        ]);
        console.info(table.toString());
        console.info(colors.green('黄色代表当前版本，低于最新版本，rc，alpha版本暂时无法兼容比较'));
        console.info(colors.cyan('1、以^开头，只对比第一位版本号；2、以~开头，对比前两位版本号；3、锁定版本的，对比三位版本号'));
        console.info('========== package.json依赖 当前版本和最新版本比较 end ==========');
    } catch (error) {
        console.error(error);
    }
}

module.exports = {
    genDiff,
    getParams
}