import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

const ws = new WebSocket("ws://localhost:8081")

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
          <button id ="addbtn">Добавить</button>
        </div>
        <div className = "data" id = {this.props.table}>{this.props.table}</div>
      </div>
    );
  }
}

class Pages extends React.Component {
  render() {
    return(
      <div id = "pages" style={{height: "5vh", overflow: "auto"}}>
        <div className = "pages" id = {this.props.table}>{this.props.pages.map((i) => <div class = "page" id = {`page`+{i}}>{i}</div>)}</div>
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
      pages: []
    }
    this.tableClicked = this.tableClicked.bind(this);
  }

  tableClicked = (event) => {
    this.setState({table: event.target.id})
  }

  componentDidMount() {
    ws.onopen = () => {
      get('people', this.state.page)
      get('access', this.state.page)
    }
    ws.onmessage = (d) => {
      
    }
  }
  renderHeader() {
    return <Header tableClicked = {this.tableClicked}/>;
  }
  renderMainData() {
    return <MainData table = {this.state.table} />
  }
  renderPages() {
    return <Pages 
      table={this.state.table} 
      pages = {this.state.pages}
    />
  }
  render() {
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

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
