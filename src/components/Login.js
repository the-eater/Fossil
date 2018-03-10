import React, {Component, Fragment} from 'react';
import {JID} from 'stanza.io';

export class Login extends Component {
  constructor(props) {
    super(props);

    this.fossil = props.fossil;
    this.state = {
      advancedCollapsed: false,
      errorMessage: null,
    }
  }

  onClick() {
    const connectObj = {
      jid: this.username.value,
      password: this.password.value,
    };

    if (this.transport.value !== '') {
      connectObj.transport = this.transport.value;
      if (connectObj.transport === 'bosh') {
        connectObj.boshURL = this.url.value;
      } else {
        connectObj.wsURL = this.url.value;
      }
    }

    let done = false;
    this.fossil.client.on('auth:success', () => {
      done = true;
      this.fossil.storage.setUser(connectObj);
    });

    this.fossil.client.on('auth:failed', () => {
      done = true;
      this.setState({
        errorMessage: 'Username or password are invalid',
      });
    });

    this.fossil.client.connect(connectObj);
    this.fossil.jid = new JID(this.username.value);
  }

  render() {
    return <div className="login-page">
      <div className="center">
        <div className="form">
          <h1>Fossil</h1>
          {this.state.errorMessage !== null ? <div className="error">{this.state.errorMessage}</div> : <Fragment />}
          <input ref={a => this.username = a} className="item" type="text" placeholder="Username"/>
          <input ref={a => this.password = a} className="item" type="password" placeholder="Password"/>
          <div
            onClick={() => this.setState({advancedCollapsed: !this.state.advancedCollapsed})}>{this.state.advancedCollapsed ? '-' : '+'} Advanced
          </div>
          <div className="advanced" style={{height: (this.state.advancedCollapsed ? 'auto' : '0px')}}>
            <select ref={a => this.transport = a} className="item" name="connection-type">
              <option value="">Automatic</option>
              <option value="bosh">BOSH</option>
              <option value="websocket">WebSocket</option>
              <option value="old-websocket">Old WebSocket</option>
            </select>
            <input type="text" ref={a => this.url = a} placeholder="Url" className="item"/>
          </div>
          <button onClick={this.onClick.bind(this)} className="item">Login</button>
        </div>
      </div>
    </div>
  }
}