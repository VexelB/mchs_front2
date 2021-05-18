const fs = require('fs');
const WebSocket = require( "ws");
const express = require("express");
const app = new express();
const https = require('https')
const http = express();
const path = require("path")
const sqlite3 = require("sqlite3")
const server = https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app)
const wss = new WebSocket.Server({ server });
let clients = []

let passcheck = (row, req, res) => {
    if (row.password === req.body.pass) {
        clients.push(req.connection.remoteAddress);
        res.sendFile(path.join(__dirname,'build/loged.html'))
        // setTimeout(() => {clients.splice(clients.indexOf(req.connection.remoteAddress, 1))}, 1000)
    } else {
        res.sendFile(path.join(__dirname, 'build/index.html'));
    }
}
app.use('/', express.static(__dirname + "/build"))
app.use(express.urlencoded());

app.post('/*', (req, res) => {
    let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
        if (err) {
          console.error(err.message);
        }
    });
    db.each(`SELECT * from users where username = '${req.body.login}'`, (err, row)=>{
        // console.log(row)
        passcheck(row, req, res)
    })
    db.close();
    // if (req.body.pass == password) {
    //     clients.push(req.connection.remoteAddress);
    //     res.sendFile(path.join(__dirname, 'index.html'))
    //     setTimeout(() => {clients.splice(clients.indexOf(req.connection.remoteAddress, 1))}, 1000)
    // }
    // else {
    //     res.sendFile(path.join(__dirname, 'login.html'));
    // }
})
// app.get('/*', (req, res) => {
//     if (clients.includes(req.ip)) {
//         res.sendFile(path.join(__dirname, 'loged.html'))
//     }
//     else {
//         res.sendFile(path.join(__dirname, 'index.html'));
//     }
// })
// app.get('/*.*', (req, res) => {
//     if (clients.includes(req.ip)) {
//         res.sendFile(path.join(__dirname, req.path))
//     }
// })

server.listen(5454, function () {
    console.log('Example app listening on port 3000!')
})
http.get('*', (req,res) => {
    res.redirect('https://' + req.headers.host + req.url);
})
.listen(8181);

wss.on('connection', (ws, req) => {
    console.log(req.connection.remoteAddress, clients)
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
        db.all(`SELECT name FROM sqlite_master WHERE type='table' ORDER by name`, (err,rows) => {
            ws.send(JSON.stringify({action: "tables", content: rows}))
        })
    })
    db.close();

    ws.on('close', () => {

    })
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
            db.all(`SELECT * from ${d.table}`, (err,rows) => {
                ws.send(JSON.stringify({action: "pages", content: rows}))
            })
            db.close();
        }
        else if (d.action == "getopt") {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message, d);
                }
            });
            db.all(d.sql, (err,rows) => {
                ws.send(JSON.stringify({action: "options", content: rows}))
            })
            db.close();
        }
        else if (d.action == "get2") {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                  console.error(err.message, d);
                }
            });
            db.all(d.sql, (err,rows) => {
                ws.send(JSON.stringify({action: "rows", content: rows}))
            })
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
            db.run(sql, (err) => {
                if (err) {
                    if (err.errno === 19){
                        let sql = `INSERT INTO ${d.table} VALUES ((select count(*) from ${d.table}) + 1,`
                        d.values.shift()
                        d.values.map((a)=>{sql += `'${a}',`})
                        sql = sql.slice(0,sql.length-1) + ');'
                        db.run(sql, (err) => {
                            if (err) {
                                ws.send(JSON.stringify({action: "message", content: "Был введен неуникальный ID, однако автоматически его поправить не удалось, что-то пошло не так."}))
                                return
                            }
                        })
                        ws.send(JSON.stringify({action: "message", content: "Был введен неуникальный ID, ID заменен автоматически."}))
                    }
                }
            });
            ws.send(JSON.stringify({action: "success"}))
            db.close();
        }
        else if (d.action == 'delete') {
            let db = new sqlite3.Database('sqlite.db', sqlite3.OPEN_READWRITE, (err) => {
                if (err) {
                    console.error(err.message);
                }
            });
            db.run(d.sql, (err) => {
                if (err) {
                    console.error(err.message)
                }
            })
            ws.send(JSON.stringify({action: "success"}))
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
            ws.send(JSON.stringify({action: "success"}))
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