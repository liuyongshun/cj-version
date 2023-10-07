const fs = require('fs');
const findUp = require('find-up');
const checkJson = require('../util/checkjson.js');

const configPath = findUp.sync(['.checkjson', '.checkjson.json']);
const config = configPath ? JSON.parse(fs.readFileSync(configPath)) : {};

module.exports = {
    command: 'check',
    aliases: ['check', 'c'],
    desc: 'diff package.json version',
    builder: (yargs) => {
        return yargs
            .config(config || {})
            .option('dir', {
                describe: '解析文件的目录',
                default: `${process.cwd()}/package.json`
            })
            .option('field', {
                describe: '字段列表',
                default: ['version', 'homepage']
            })
            .help('h')
    },
    handler: (argv) => {
        let obj = checkJson.getParams(argv);
        checkJson.genDiff(obj);
    }
}
