const fs = require('fs');

class ObjUtil {
    // whether get file
    isFile (dir) {
        return fs.statSync(dir).isFile();
    }

    // get user dir
    readFile (dir) {
        const all = fs.readFileSync(dir, 'utf-8');
        return all;
    }
}

module.exports = new ObjUtil()