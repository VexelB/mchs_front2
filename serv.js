const express = require("express");
const app = new express();
const fs = require('fs');
const https = require('https')
const http = express();
const path = require("path")
const sqlite3 = require("sqlite3")
const WebSocket = require( "ws");
const wss = new WebSocket.Server({port: 5353});
const password = '202020';
let clients = [];

wss.on('connection', (ws, req) => {
    let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
        }
    });
    db.serialize(() => {
        db.all(`select * from assoc`, (err,rows) => {
            ws.send(JSON.stringify({action: "assoc", content: rows}))
        })
        db.all(`select * from datas`, (err, rows) => {
            ws.send(JSON.stringify({action: "datas", content: rows}))
        })
    })
    db.close();
    ws.on('message', (d) => {
        d = JSON.parse(d)
        let d1 = new Date();
        let log = `${d1.getDate()}.${d1.getMonth()+1}.${d1.getFullYear()} ${d1.getHours()}:${d1.getMinutes()} - `;
        for (let i in d) {
            log += `${i}:${d[i]} `
        }
        log += '\n'
        fs.appendFileSync('log.txt', log)
        if (d.action == "get") {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message, d);
                }
            });
            if (d.page === 0) {
                db.serialize(() => {
                    db.all(`select * from ${d.table}`, (err,rows) => {
                        ws.send(JSON.stringify({action: "pages", content: rows}))
                    })
                })
            }
            else {
                db.serialize(() => {
                    db.all(d.sql, (err,rows) => {
                        ws.send(JSON.stringify({action: "rows", content: rows}))
                    })
                })
            }
            db.close();
        }
        else if (d.action == "pupilduty") {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message, d);
                }
            });
            db.serialize(() => {
                db.all(d.sql, (err,rows) => {
                    ws.send(JSON.stringify({action: d.action, content: rows, table: d.table}))
                })
            })
            db.close();
        }
        else if (d.action == "put") {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message, d);
                }
            });
            
            // db.run(d.sql, (err)=> {
            //     if (err) {
            //         console.error(err.message, d);
            //     }
            // });
            console.log(d)
            db.close();
        }
        else if (d.action == "book") {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message, d);
                }
            });
            db.serialize(() => {
                let d1 = new Date();
                if (d.subaction == 'take') {
                    db.run(`update books set own = 0 where invid = "${d.invid}" and own = 1`);
                    db.run(`update TakeHistory set return = '${d1.getDate()}.${d1.getMonth()+1}.${d1.getFullYear()}' where invid = ${d.invid} and return = '-' and pupil = '${d.pupil}'`, (err) => {
                        if (err) {
                            console.error(err.message, d);
                        }
                    })
                } else if (d.subaction == 'give'){
                    let d2 = new Date(Date.parse(d1)+1209600033)
                    db.run(`update books set own = 1 where invid = "${d.invid}" and own = 0`);
                    db.run(`INSERT INTO TakeHistory (id,pupil,invid,name,wwhen,qwhen,return) VALUES ((select count (*) from TakeHistory)+1,'${d.pupil}','${d.invid}',(select name from books where invid = '${d.invid}'),'${d1.getDate().toString().padStart(2,'0')}.${(d1.getMonth()+1).toString().padStart(2,'0')}.${d1.getFullYear()}','${d2.getDate().toString().padStart(2,'0')}.${(d2.getMonth()+1).toString().padStart(2,'0')}.${d2.getFullYear()}','-');`, (err) => {
                        if (err) {
                            console.error(err.message, d);
                        }
                    })
                    // console.log(`INSERT INTO TakeHistory (id,pupil,invid,name,wwhen,qwhen,return) VALUES ((select count (*) from TakeHistory)+1,'${d.pupil}','${d.invid}',(select name from books where invid = '${d.invid}'),'${d1.getDate()}.${d1.getMonth()+1}.${d1.getFullYear()}','${d2.getDate()}.${d2.getMonth()+1}.${d2.getFullYear()}','-');`)
                }
            })
            db.close();
        }
        else if (d.action == 'delete') {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
            });
            db.serialize(() => {
                db.run(d.sql);
            })
            db.close();
        }
        else if (d.action == 'change') {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
            });
            db.serialize(() => {
                // db.run(d.sql);
            })
            console.log(d)
            db.close();
        }
        else if (d.action == 'search') {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
            });
            db.serialize(() => {
                for (let i in d.fields) {
                    for (let j in d.fields[i]) {
                        db.all(`select * from ${i} where ${d.fields[i][j]} LIKE '%${d.search}%'`, (err, rows) => {
                            ws.send(JSON.stringify({action: d.action, content: rows, table: i, row: d.fields[i][j]}));
                        })
                    }
                }
            })
            db.close();
        }
        else if (d.action == 'dutyget') {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
            });
            db.serialize(() => {
                let d1 = new Date();
                db.all(`SELECT TakeHistory.id, TakeHistory.pupil, pupil.class, TakeHistory.invid, TakeHistory.name, TakeHistory.wwhen, TakeHistory.qwhen FROM TakeHistory INNER JOIN pupil on TakeHistory.pupil = pupil.FIO WHERE return = '-' `, (err, rows) => {
                    let i = 1
                    while (i < rows.length) {
                        if (rows[i].qwhen) {
                            let qwhen = rows[i].qwhen.split('.')
                            if (parseInt(qwhen[0]) > d1.getDate() && parseInt(qwhen[1]) >= d1.getMonth()+1 && parseInt(qwhen[2]) >= d1.getFullYear()) {
                                rows.splice(i,1)
                                i -= 1
                            }
                        }
                        i += 1
                    }
                    ws.send(JSON.stringify({action: 'rows', content: rows, table: 'duty'}));
                })
            })
            db.close();
        }
    })
})