import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import reportWebVitals from './reportWebVitals';
import logo from './logo.svg';

class MenuItem extends React.Component {
  render() {
    return <li className="tables">
      <div 
        className="btns" 
        onClick={() => {alert(`click ${this.props.value[0]}`)}}  
        id={this.props.value[0]}
      >
          {this.props.value[1]}
      </div>
    </li>
  }
}

class Menu extends React.Component {
  renderMenuItems(a, b){
    return <MenuItem value = {[a,b]}/>
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
  renderMenu(a){
    return <Menu value={a} />;
  }
  render() {
    return (
      <div id = "header">
        <div id="menu">
            <div id = "tables" className = "btns">Таблицы
                {this.renderMenu('mda')}
            </div>
            <div id = "shapbtns">
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
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/index.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
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
