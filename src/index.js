import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

const ws = new WebSocket("ws://localhost:5353")
let assoc = {}

let get = (x, i) => {
  let reqbody = {};
  reqbody.action = "get";
  reqbody.table = x;
  reqbody.page = i;
  reqbody.sql = `select * from ${x} limit ${(i-1)*50}, 50`;
  ws.send(JSON.stringify(reqbody));
  reqbody = {};
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
  renderMenuItems(a, b){
    return <MenuItem 
      value = {[a,b]}
      tableClicked = {this.props.tableClicked}
    />
  }
  render() {
    return (
      <ul className="submenu">
        {this.renderMenuItems("people", "Личный состав")}
        {this.renderMenuItems("access", "Пользовательский доступ")}
      </ul>
    );
  }
}

class Header extends React.Component {

  renderMenu(){
    return <Menu 
      tableClicked = {this.props.tableClicked}
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
  render(){
    return(
      <div id = "maindata" style={{height: "90vh", overflow: "auto"}}>
        <div id = "shapbtns">
          <button id ="addbtn" onClick = {this.props.editing}>Добавить</button>
        </div>
        <div className = "data" id = {this.props.table}>
          <div className = "table">
            {this.props.headers.map((i) => <div className="tablehead" key={i} id={i}>{assoc[i]}</div>)}
            {this.props.rows.map((v,i) => <div className = "row" id={"row"+i} key={"row"+i}>
              {v.map((v,j) => <div className="rowEl" id={"row"+i+this.props.headers[j] } style={{width: document.getElementById(this.props.headers[j]).offsetWidth}}>
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
        <div className = "pages" id = {this.props.table}>{this.props.pages.map((i) => <div className = "page" id={`page`+{i}} key={`page`+{i}}>{i}</div>)}</div>
      </div>
    );
  }
}

class Editor extends React.Component {
  render(){
    return(
      <div>
        <button onClick = {this.props.editing}>Отмена</button>
      </div>
    );
  }
}

class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      page: 0,
      table: "",
      headers: [],
      rows: [],
      pages: [],
      editing: false
    }
    this.tableClicked = this.tableClicked.bind(this);
  }

  tableClicked = (event) => {
    get(event.target.id, 0)
    get(event.target.id, 1)
    this.setState({pages: [], rows: [], headers: [], table: event.target.id})
  }

  editing = (event) => {
    this.setState({editing: !this.state.editing})
  }

  componentDidMount() {
    ws.onopen = () => {
      
    }
    ws.onmessage = (d) => {
      let data = JSON.parse(d.data)
      if (data.action === "assoc") {
        for (let i in data.content) {
          assoc[data.content[i].name] = data.content[i].value
        }
      }
      else if (data.action === "pages") {
        for (let i = 1; i <= Math.ceil(data.content.length / 50); i++) {
          this.setState({pages: [...this.state.pages, i]})
        }
      }
      else if (data.action === "rows") {
        for (let i in data.content[0]) {
          this.setState({headers: [...this.state.headers, i]})
        }
        for (let i in data.content) {
          this.setState({rows: [...this.state.rows, Object.values(data.content[i])]})
        }
      }
    }
  }
  renderHeader() {
    return <Header tableClicked = {this.tableClicked}/>;
  }
  renderMainData() {
    return <MainData 
      table={this.state.table} 
      headers={this.state.headers}
      rows={this.state.rows}
      editing = {this.editing}
    />
  }
  renderPages() {
    return <Pages 
      table={this.state.table} 
      pages={this.state.pages}
    />
  }
  renderEditor() {
    return <Editor editing = {this.editing}/>
  }
  render() {
    if (this.state.editing) {
      return (
        <div className="App">
          {this.renderEditor()}
        </div>
      );
    }
    else {
      return (
        <div className="App">
          {this.renderHeader()}
          <div id = "main">
            {this.renderMainData()}
            {this.renderPages()}
          </div>
        </div>
      );
    }
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
