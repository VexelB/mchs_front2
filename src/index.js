import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

const ws = new WebSocket("wss://78.140.214.186:5454");
let assoc = {};
let datas = [];
let ignore = ['Attvalid', 'Result', 'rtp', "worklife"];

class Menu extends React.Component {
  render() {
    return (
      <ul className="submenu">
        {this.props.tables.map((a) => (<li
          className="tables" 
          onClick={this.props.tableClicked}
          id={a}
        >
          {assoc[a]}
        </li>))}
      </ul>
    );
  }
}

class Header extends React.Component {

  render() {
    return (
      <div id = "header">
        <div id="menu">
          <div id = "tables" className = "btns">Таблицы
              <Menu 
                tableClicked = {this.props.tableClicked}
                tables = {this.props.tables}
              />
          </div>
          <div id = "reports" className = "btns">Отчеты
          </div>
          <div id = "options" className = "btns">Настройки
              <Menu 
                tableClicked = {this.props.tableClicked}
                tables = {this.props.otables}
              />
          </div>
          <div id = "exit" className = "btns" onClick = {() => {window.location.href = window.location.href}}>Выход</div>
        </div>
    </div>
    );
  }
}

class MainData extends React.Component {
  renderShap(){
    if (this.props.table !== ""){
      return (
        <div id = "shapbtns">
          <button id ="addbtn" onClick = {this.props.editing}>Добавить</button>
        </div>
      );
    }
  }
  render(){
    return(
      <div id = "maindata" key = "maindata" style={{height: "92vh", overflow: "auto"}}>
        {this.renderShap()}
        <div className = "data" id = {this.props.table} key = {this.props.table}>
          <div className = "table">
            {this.props.headers.map((i, v) => <div className="tablehead" key={i} id={i}>{assoc[i]}</div>)}
            {this.props.rows.map((v,i) => <div className = "row" id={i} key={i} onClick={this.props.editing}>
              {v.map((v,j) => <div className="rowEl" key={"row"+i+this.props.headers[j]} id={"row"+i+this.props.headers[j]}>
                {v}
              </div>)}
            </div>)}
          </div>
        </div>
      </div>
    );
  }
}

class Pages extends React.Component {
  render() {
    return(
      <div id = "pages" style={{height: "5vh", overflow: "auto"}}>
        <div className = "pages" id={this.props.table}>
          {this.props.pages.map((i) => <div 
            onClick={this.props.pageClick}
            className="page" 
            id={i} 
            key={i}>
              {i}
            </div>)}
        </div>
      </div>
    );
  }
}

class Editor extends React.Component {
  renderInputs(){
    let output = []
    for (let i in this.props.headers) {
      let v = this.props.headers[i]
      if (Object.keys(this.props.options).includes(v)) {
        // output.push(<div key={v}>{assoc[v]} <input className="input" defaultValue={this.props.data[i]} placeholder={assoc[v]} list={"options"+v} id={v} />
        // <datalist id={"options"+v}>{this.props.options[v].map((i) => <option key={i[0]}>{i[0]}</option>)}</datalist>
        // </div>)
        let opt = []
        output.push(<div key={v}>{assoc[v]} <select className="input" defaultValue={this.props.data[i]} placeholder={assoc[v]} list={"options"+v} id={v}>
        {this.props.options[v].forEach((q) => {
          if (q === this.props.data[i]) {opt.push(<option key={q} selected="selected">{q}</option>)} else {opt.push(<option key={q}>{q}</option>)} 
          })}
        {opt}
        </select>
        </div>)
      }
      else if (v.includes('date')){
        output.push(<div key={v}>{assoc[v]} <input className="input" id={v} type="date" placeholder='ГГГГ-ММ-ДД' defaultValue={this.props.data[i]}/></div>)
      }
      else if (v === 'id') {
        if (this.props.data[i]) {
          output.push(<div key={v}>{assoc[v]} <input readOnly className="input" id={v} key={"input"+v} defaultValue={this.props.rows.length+1} /></div>)
        } else {
          output.push(<div key={v}>{assoc[v]} <input readOnly className="input" id={v} key={"input"+v} defaultValue={this.props.data[i]} /></div>)
        }
      }
      else {
        output.push(<div key={v}>{assoc[v]} <input className="input" id={v} key={"input"+v} defaultValue={this.props.data[i]} /></div>)
      }
    }
    return output
  }
  render(){
    return(
      <div id="myModal" className="modal" key="myModal">
          <div className = "modal-content" key="modal-content">
            <div>
              <button id="addclose" key="addclose" onClick = {this.props.editing}>Сохранить</button>
              <button id="del" key="del" onClick = {this.props.editing} style = {{color: "red"}}>Удалить</button>
              <button id="close" key="close" onClick = {this.props.editing}>Закрыть</button><br />
              <div id="data" key="data">
                {this.renderInputs()}
              </div>
            </div>
          </div>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      tables: [],
      table: "",
      page: 0,
      headers: [],
      headwidth: [],
      rows: [],
      pages: [],
      data: [],
      options: {},
      oldid: "",
      ids: {},
      pass: {},
      otables: [],
      editing: false
    }
  }
  get = (x) => {
    let reqbody = {};
    reqbody.action = "get2";
    reqbody.table = x;
    let jointables = []
    if (reqbody.table === this.state.table && reqbody.page !== 0) {
      reqbody.sql = `select ${this.state.headers.map((a)=>{
        if (datas.map((a)=>{return a.rowname}).includes(a)) {
          for (let i in datas) {
            if (datas[i].rowname === a) {
              jointables.push(datas[i].tablename)
              return `${datas[i].tablename.split('.')[0]}.${datas[i].tablerowname} as ${a}`
            }
          }
        }
        return `${reqbody.table}.${a}`
      })} from ${reqbody.table}`
      for (let i in jointables) {
        for (let j in datas) {
          if (jointables[i] === datas[j].tablename) {
            reqbody.sql += ` INNER JOIN ${jointables[i].split('.')[0]} on ${datas[j].rowname} = ${jointables[i]}`
          }
        }
      }
    }
    reqbody.sql += ` order by ${this.state.table}.${this.state.headers[0]} LIMIT ${50 * (this.state.page - 1)}, 50`
    ws.send(JSON.stringify(reqbody));
    reqbody = {};
  }
  vac = () => {
    let result = []
    let all = document.querySelectorAll(`#data .input`)
    for (let i in all){
      if (all[i].value !== undefined){
        let val = all[i].value.trim()
        if (datas.map((a)=>{return a.rowname}).includes(all[i].id)) {
          result.push(val === "" ? "-": this.state.ids[all[i].id][val])
        }
        else if (all[i].id === "password"){
          result.push(val === "*****" ? this.state.pass[result[0]] : val)
        }
        else {
          result.push(val === "" ? "-": val)
        }
      }
    }
    return result
  }
  tableClicked = (event) => {
    this.setState({table: event.target.id, page: 1})
    setTimeout(()=>{
      
    },10)
    ws.send(JSON.stringify({action: "get", table: event.target.id}))
  }
  valueChange = (event) => {
    this.setState({data: event.target.value})
  }
  editing = (event) => {
    if (this.state.editing === false){
      for (let i in datas){
        if (this.state.headers.includes(datas[i].rowname)){
          ws.send(JSON.stringify({action: "getopt", table: this.state.table, sql: `SELECT id, '${datas[i].rowname}' as name, ${datas[i].tablerowname} as value from ${datas[i].tablename.split('.')[0]}`}))
        }
      }
    }
    if (event.target.id === 'close'){
      this.setState({editing: !this.state.editing, data: [], oldid: ""})
      return
    }
    else if (event.target.id === "addclose"){
      if (this.vac()[0] === '-'){
        this.setState({editing: !this.state.editing, data: [], oldid: ""})
        return
      }
      else if (this.state.oldid === ""){
        ws.send(JSON.stringify({"action": "put", "table": this.state.table, "values": this.vac()}));
      } else {
        ws.send(JSON.stringify({"action": "change", "table": this.state.table, "oldid": this.state.oldid, "values": this.vac(), "headers": this.state.headers}))
      }
      // this.setState({editing: !this.state.editing})
      setTimeout(()=>{ws.send(JSON.stringify({action: "get", table: this.state.table}))}, 10) 
    }
    else if (event.target.className === "rowEl"){
      this.setState({editing: !this.state.editing, data: this.state.rows[event.target.parentElement.id], oldid: event.target.parentElement.firstChild.innerHTML})
    }
    else if (event.target.id === "del"){
      if (this.vac()[0] !== "-"){
        let reqbody = {}
        reqbody.action = "delete"
        reqbody.sql = `DELETE FROM ${this.state.table} where ${this.state.headers[0]} = '${this.vac()[0]}'`
        let check = window.confirm("Точно удалить?")
        if (check) {
          ws.send(JSON.stringify(reqbody))
          setTimeout(()=>{ws.send(JSON.stringify({action: "get", table: this.state.table}))}, 10) 
        }
      }
      // this.setState({editing: !this.state.editing})
    }
    else {
      this.setState({editing: !this.state.editing, data: [], oldid: ""})
    }
  }
  pageClick = (event) => {
    this.setState({page: event.target.id})
    ws.send(JSON.stringify({action: "get", table: this.state.table}))
  }
  componentDidMount() {
    ws.onclose = () => {
      alert('Соединение с сервером потеряно!');
    }
    ws.onmessage = (d) => {
      let data = JSON.parse(d.data)
      if (data.action === "assoc") {
        for (let i in data.content) {
          assoc[data.content[i].name] = data.content[i].value
        }
      }
      else if (data.action === "message") {
        alert(data.content)
      }
      else if (data.action === "success") {
        this.setState({editing: !this.state.editing, data: [], oldid: ""})
      }
      else if (data.action === "options"){
        let temp = this.state.options
        data.content.forEach((a) => {
          if (a.id) {
            let temp = this.state.ids
            temp[a.name] = {}
            this.setState({ids: temp})
          } 
          temp[a.name] = []
        })
        data.content.forEach((a) => {
          if (a.id) {
            let temp = this.state.ids
            temp[a.name][a.value] = a.id
            this.setState({ids: temp})
          }
          temp[a.name] = [...temp[a.name], a.value]
        })
        this.setState({options: temp})
      }
      else if (data.action === "tables"){
        let temp = this.state.options
        data.content.forEach((a) => {
          temp["tables"] = []
        })
        data.content.forEach((a) => {
          if (!ignore.includes(a.name)){
            if (a.name === 'apparat' || a.name === "balloon" || a.name === "passedapprovals" || a.name === "people" || a.name === "section"){
              this.setState({tables: [...this.state.tables, a.name]})
              temp["tables"] = [...temp["tables"], assoc[a.name]]
            } else {
              this.setState({otables: [...this.state.otables, a.name]})
              // temp["tables"] = [...temp["tables"], [assoc[a.name], '-']]
            }
          }
        })
        this.setState({options: temp})
      }
      else if (data.action === "datas"){
        data.content.forEach((a) => {
          let temp = {}
          for (let i in a) {
            temp[i] = a[i]
          }
          datas.push(temp)
        })
      }
      else if (data.action === "pages") {
        this.setState({headers: [], pages: [], rows: []})
        for (let i in data.content[0]) {
          this.setState({headers: [...this.state.headers, i], headwidth: [...this.state.headwidth, 1]})
        }
        for (let i = 1; i <= Math.ceil(data.content.length / 50); i++) {
          this.setState({pages: [...this.state.pages, i]})
        }
        setTimeout(()=>{this.get(this.state.table)},10)
        
      }
      else if (data.action === "rows") {
        for (let i in data.content) {
          let temp = []
          if (this.state.headers.includes("password")){
            let temp1 = this.state.pass
            temp1[data.content[i].id] = data.content[i].password
            this.setState({pass: temp1})
            temp.push(Object.values(data.content[i]).map((a)=>{
              if (Object.keys(data.content[i]).find(key => data.content[i][key] === a) === "password"){
                return "*****"
              }
              else {
                return a
              }
            }))
            this.setState({rows:  temp})
          }
          else {
            this.setState({rows: [...this.state.rows, Object.values(data.content[i])]})
          }
        }
        for (let i in this.state.headers) {
          let items = []
          items.push(document.querySelector(`.table #${this.state.headers[i]}`))
          for (let j in this.state.rows) {
            items.push(document.querySelector(`#row${j}${this.state.headers[i]}`))
          }
          let b = []
          items.forEach((a)=>{b.push(a.offsetWidth)})
          items.forEach((i) => {
            i.setAttribute("style", `width: ${Math.max(...b)}px`)
          })
        }
      }
      
    }
  }
  renderEditor() {
    if (this.state.editing) {
      return <Editor 
        editing = {this.editing} 
        headers = {this.state.headers} 
        data = {this.state.data}
        options = {this.state.options}
        ids = {this.state.ids}
        rows = {this.state.rows}
      />
    }
  }
  render() {
    return (
      <div className="App">
        <Header 
          tableClicked = {this.tableClicked}
          tables = {this.state.tables}
          otables = {this.state.otables}
        />
        <div id = "main">
          {this.renderEditor()}
          <MainData 
            table={this.state.table} 
            headers={this.state.headers}
            headwidth={this.state.headwidth}
            rows={this.state.rows}
            editing = {this.editing}
          />
          <Pages 
            table={this.state.table} 
            pages={this.state.pages}
            pageClick={this.pageClick}
          />
        </div>
      </div>
    );
  }
}

ReactDOM.render(
  
  <App />,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
