import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';

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
  constructor(props) {
    super(props)
    this.state = {
      pages: [],
      items: [],
      table: ""
    }
    this.tableClicked = this.tableClicked.bind(this);
  }

  tableClicked = (event) => {
    this.setState({table: event.target.id})
  }

  renderMenu(){
    return <Menu 
      tableClicked = {this.tableClicked}
    />;
  }

  render() {
    return (
      <div id = "header">
        <div id="menu">
            <div id = "tables" className = "btns">Таблицы
                {this.renderMenu()}
            </div>
            <div id = "shapbtns" style={{display: "none"}}>
                <button id ="addbtn">Добавить</button>
            </div>
        </div>
    </div>
    );
  }
}

class App extends React.Component {
  renderHeader() {
    return <Header />;
  }
  render() {
    return (
      <div className="App">
        {this.renderHeader()}
        <div id = "main">
          <div id = "maindata" style={{height: "90%", overflow: "auto"}}>
              <div className = "data" id = "people" style = {{display: "none"}}>Пользователи</div>
              <div className = "data" id = "access" style = {{display: "none"}}>Пользовательский доступ</div>
          </div>
          <div id = "pages" style={{height: "5%", overflow: "auto"}}>
              <div className = "pages" id = "people" style = {{display: "none"}}></div>
              <div className = "pages" id = "access" style = {{display: "none"}}></div>
          </div>
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
