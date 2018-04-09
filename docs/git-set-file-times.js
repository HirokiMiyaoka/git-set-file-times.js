"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const child_process = require("child_process");
const readline = require("readline");
const fs = require("fs");
function exec(command, args) {
    const proc = child_process.spawn(command, args);
    return { out: readline.createInterface({ input: proc.stdout }), in: proc };
}
let utime = (file, date) => { fs.utimesSync(file, date, date); };
class GitSetFileTimes {
    constructor(option) {
        if (typeof option !== 'object') {
            option = {};
        }
        this.debug = option.debug === true;
        if (option.dryrun) {
            if (this.debug) {
                utime = (file, date) => { console.log('utimes:', file, date); };
            }
            else {
                utime = (file, date) => { };
            }
        }
        else if (this.debug) {
            const _utime = utime;
            utime = (file, date) => {
                console.log('utimes:', file, date);
                _utime(file, date);
            };
        }
        this.argv = process.argv.slice(2);
        if (this.argv.length <= 0) {
            return;
        }
        const m = this.argv[0].match(/^\-\-prefix\=(.+)$/);
        if (!m) {
            return;
        }
        this.prefix = m[1] || '';
        this.argv.shift();
    }
    start() {
        if (process.env['GIT_DIR']) {
            try {
                process.chdir(path.join(process.env['GIT_DIR'], '../'));
            }
            catch (e) {
                return Promise.reject(e);
            }
        }
        return this.ls().then((list) => {
            if (this.debug) {
                console.log(list);
            }
            return this.changeTime(list);
        }).then(() => { });
    }
    ls() {
        return new Promise((resolve, reject) => {
            const ls = [];
            const readline = exec('git', ['ls-files', '-z']).out;
            readline.on('line', (line) => { ls.push(...line.split('\0').filter((f) => { return !!f; })); });
            readline.on('close', () => { resolve(ls); });
        });
    }
    changeTime(files) {
        return new Promise((resolve, reject) => {
            const readline = exec('git', ['log', '-m', '-r', '--name-only', '--no-color', '--pretty=raw', '-z', ...this.argv]);
            let ctime = new Date();
            readline.out.on('line', (line) => {
                if (files.length <= 0) {
                    readline.in.stdout.destroy();
                    return;
                }
                const m = line.match(/^committer .*? (\d+) (?:[\-\+]\d+)$/);
                if (m) {
                    ctime = new Date(parseInt(m[1]) * 1000);
                    return;
                }
                const m1 = line.match(/(.+)\0\0commit [a-f0-9]{40}( \(from [a-f0-9]{40}\))?$/);
                const m2 = line.match(/(.+)\0$/);
                const list = (m1 ? m1[1] : (m2 ? m2[1] : '')).split(/\0/);
                if (list.length <= 0) {
                    return;
                }
                list.forEach((updfile) => {
                    if (!updfile) {
                        return;
                    }
                    const index = files.indexOf(updfile);
                    if (index < 0) {
                        return;
                    }
                    utime(updfile, ctime);
                    files.splice(index, 1);
                });
            });
            readline.out.on('close', () => { resolve(); });
        });
    }
}
exports.GitSetFileTimes = GitSetFileTimes;
if (require.main === module) {
    const git = new GitSetFileTimes({ debug: true });
    git.start();
}
