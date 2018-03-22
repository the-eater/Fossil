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

  static knownMap = {
    'kode.im': {
      transport: 'bosh',
      boshURL: 'https://im.koderoot.net/http-bind'
    }
  };

  onClick() {
    const connectObj = {
      jid: this.username.value,
      password: this.password.value,
    };

    this.fossil.setResource(this.resource.value);

    if (this.transport.value !== '') {
      connectObj.transport = this.transport.value;
      if (connectObj.transport === 'bosh') {
        connectObj.boshURL = this.url.value;
      } else {
        connectObj.wsURL = this.url.value;
      }
    }

    const jid = new JID(this.username.value);
    if (jid.domain in Login.knownMap) {
      Object.assign(connectObj, Login.knownMap[jid.domain]);
    }

    this.fossil.client.once('auth:success', () => {
      this.fossil.storage.setUser(connectObj);
    });

    this.fossil.client.once('auth:failed', () => {
      this.setState({
        errorMessage: 'Username or password are invalid',
      });
    });

    this.fossil.client.once('session:error', (e) => {
      this.setState({
        errorMessage: `Failed to connect to server: ${e.message}`,
      });
    });

    this.fossil.client.once('disconnected', () => {
      this.setState({
        errorMessage: `Failed to connect to server: No details known`,
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

          <input ref={a => this.resource = a} className="item" type="text" placeholder="Name of device"/>
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