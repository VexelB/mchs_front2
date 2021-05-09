import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

const ws = new WebSocket("ws://192.168.0.132:5353");
let assoc = {};
let datas = [];

let get = (x, i) => {
  let reqbody = {};
  reqbody.action = "get";
  reqbody.table = x;
  reqbody.page = i;
  ws.send(JSON.stringify(reqbody));
  reqbody = {};
}

let vac = () => {
  let result = []
  let all = document.querySelectorAll(`#data .input`)
  for (let i in all){
    if (all[i].value !== undefined){
      result.push(all[i].value === "" ? "-": all[i].value)
    }
  }
  return result
}

class MenuItem extends React.Component {
  render() {
    return <li className="tables">
      <div 
        className="btns" 
        onClick={this.props.tableClicked}
        id={this.props.value[0]}
      >
        {this.props.value[1]}
      </div>
    </li>
  }
}

class Menu extends React.Component {
  render() {
    return (
      <ul className="submenu">
        {this.props.tables.map((a) => (<MenuItem key={a} value={[a, assoc[a]]} tableClicked={this.props.tableClicked}></MenuItem>))}
      </ul>
    );
  }
}

class Header extends React.Component {

  renderMenu(){
    return <Menu 
      tableClicked = {this.props.tableClicked}
      tables = {this.props.tables}
    />;
  }

  render() {
    return (
      <div id = "header">
        <div id="menu">
          <div id = "tables" className = "btns">Таблицы
              {this.renderMenu()}
          </div>
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
      <div id = "maindata" key = "maindata" style={{height: "90vh", overflow: "auto"}}>
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
        output.push(<div key={v}>{assoc[v]} <input className="input" defaultValue={this.props.data[i]} placeholder={assoc[v]} list={"options"+v} id={"input"+v} />
        <datalist id={"options"+v}>{this.props.options[v].map((i) => <option key={i}>{i}</option>)}</datalist>
        </div>)
      }
      else if (v.includes('date')){
        output.push(<div key={v}>{assoc[v]} <input className="input" type="date" placeholder={assoc[v]} defaultValue={this.props.data[i]}/></div>)
      }
      else {
        output.push(<div key={v}>{assoc[v]} <input className="input" id={"input"+v} key={"input"+v} defaultValue={this.props.data[i]} /></div>)
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
              <button id="del" key="del" onClick = {this.props.editing}>Удалить</button>
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
      page: 0,
      table: "",
      headers: [],
      headwidth: [],
      rows: [],
      pages: [],
      data: [],
      options: {},
      oldid: "",
      editing: false
    }
  }

  tableClicked = (event) => {
    get(event.target.id, 0)
    get(event.target.id, 1)
    this.setState({table: event.target.id, page: 1})
  }

  valueChange = (event) => {
    this.setState({data: event.target.value})
  }

  editing = (event) => {
    if (event.target.id === 'close'){
      this.setState({editing: !this.state.editing, data: [], oldid: ""})
      return
    }
    if (event.target.id === "addclose") {
      if (vac()[0] === '-') {
        this.setState({editing: !this.state.editing, data: [], oldid: ""})
        return
      }
      else if (this.state.oldid === "") {
        ws.send(JSON.stringify({"action": "put", "table": this.state.table, "values": vac()}));
      } else {
        ws.send(JSON.stringify({"action": "change", "table": this.state.table, "oldid": this.state.oldid, "values": vac(), "headers": this.state.headers}))
      }
    }
    this.setState({editing: !this.state.editing, data: [], oldid: ""})
    if (event.target.className === "rowEl") {
      this.setState({data: this.state.rows[event.target.parentElement.id], oldid: event.target.parentElement.firstChild.innerHTML})
    }
    if (event.target.id === "del") {
      ws.send(JSON.stringify({action: "delete", table: this.state.table, id: vac()[0]}))
    }
    setTimeout(()=>{get(this.state.table, this.state.page); get(this.state.table, 0)}, 500) 
  }

  pageClick = (event) => {
    this.setState({page: event.target.id})
    get(this.state.table, event.target.id)
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
      else if (data.action === "options"){
        let temp = this.state.options
        data.content.forEach((a) => {
          temp[a.name] = []
        })
        data.content.forEach((a) => {
          temp[a.name] = [...temp[a.name], a.value]
        })
        this.setState({options: temp})
      }
      else if (data.action === "tables"){
        let temp = this.state.options
        data.content.forEach((a) => {
          temp["table"] = []
        })
        data.content.forEach((a) => {
          if (a.name !== 'assoc' && a.name !== 'datas' && a.name !== 'options'){
            this.setState({tables: [...this.state.tables, a.name]})
            temp["table"] = [...temp["table"], assoc[a.name]]
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
        this.setState({pages: []})
        for (let i = 1; i <= Math.ceil(data.content.length / 50); i++) {
          this.setState({pages: [...this.state.pages, i]})
        }
      }
      else if (data.action === "rows") {
        this.setState({headers: [], rows: []})
        for (let i in data.content[0]) {
          this.setState({headers: [...this.state.headers, i], headwidth: [...this.state.headwidth, 1]})
        }
        for (let i in data.content) {
          this.setState({rows: [...this.state.rows, Object.values(data.content[i])]})
        }
        for (let i in this.state.headers) {
          let items = []
          items.push(document.querySelector(`#${this.state.headers[i]}`))
          for (let j in this.state.rows) {
            items.push(document.querySelector(`#row${j}${this.state.headers[i]}`))
          }
          let b = []
          console.log(items)
          items.forEach((a)=>{b.push(a.offsetWidth)})
          items.forEach((i) => {
            i.setAttribute("style", `width: ${Math.max(...b)}px`)
          })
        }
      }
      
    }
  }
  renderHeader() {
    return <Header 
      tableClicked = {this.tableClicked}
      tables = {this.state.tables}
    />;
  }
  renderMainData() {
    return <MainData 
      table={this.state.table} 
      headers={this.state.headers}
      headwidth={this.state.headwidth}
      rows={this.state.rows}
      editing = {this.editing}
    />
  }
  renderPages() {
    return <Pages 
      table={this.state.table} 
      pages={this.state.pages}
      pageClick={this.pageClick}
    />
  }
  renderEditor() {
    if (this.state.editing) {
      return <Editor 
        editing = {this.editing} 
        headers = {this.state.headers} 
        data = {this.state.data}
        options = {this.state.options}
      />
    }
  }
  render() {
    return (
      <div className="App">
        {this.renderHeader()}
        <div id = "main">
          {this.renderEditor()}
          {this.renderMainData()}
          {this.renderPages()}
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
