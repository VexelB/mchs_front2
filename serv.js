const fs = require('fs');
const sqlite3 = require("sqlite3")
const WebSocket = require( "ws");
const wss = new WebSocket.Server({port: 5353});

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
        db.all(`select * from options`, (err, rows) => {
            ws.send(JSON.stringify({action: "options", content: rows}))
        })
        db.all(`SELECT name FROM sqlite_master WHERE type='table';`, (err,rows) => {
            ws.send(JSON.stringify({action: "tables", content: rows}))
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
                    let sql = `select * from ${d.table} limit ${(d.page-1)*50}, 50`
                    db.all(sql, (err,rows) => {
                        ws.send(JSON.stringify({action: "rows", content: rows}))
                    })
                })
            }
            db.close();
        }
        else if (d.action == "put") {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message, d);
                }
            });
            let sql = `INSERT INTO ${d.table} VALUES (`
            d.values.map((a)=>{sql += `'${a}',`})
            sql = sql.slice(0,sql.length-1) + ');'
            db.run(sql);
            db.close();
        }
        else if (d.action == 'delete') {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message);
                }
            });
            db.serialize(() => {
                db.run(`DELETE FROM ${d.table} where id = '${d.id}'`)
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
                let sql = `update ${d.table} set `
                for (let i in d.headers) {
                    sql += `'${d.headers[i]}' = '${d.values[i]}',`
                }
                sql = sql.slice(0, sql.length-1) + ` where ${d.headers[0]} = '${d.oldid}'`
                db.run(sql)
            })
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
    })
})