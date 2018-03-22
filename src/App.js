import React, {Component} from 'react';
import './App.css';
import {ContactList} from "./components/ContactList";
import {Fossil} from "./fossil";
import {Chat} from "./components/Chat";
import {Login} from "./components/Login";

class App extends Component {
  constructor(props) {
    super(props);

    this.fossil = new Fossil({
      onState: (state) => this.setState(state),
    });
    this.state = this.fossil;
  }

  componentDidMount() {
    this.fossil.start();

    // this.timeUpdate = setInterval(() => this.setState(this.fossil), 2000);
  }

  getWindow() {
    if (this.fossil.loggedIn) {
      const ac = this.fossil.activeContact;
      return (
        <div className={"chat-state" + (this.fossil.windowState.seeChat ? ' see-chat' : '')}>
          <ContactList onSelect={(jid) => this.fossil.activateContact(jid)} roster={this.state.roster}
                       active={ac ? ac.jid : null}/>
          <div className="window">
            {ac ? <Chat key={ac.jid.toString()} owner={this.fossil.jid} fossil={this.fossil} contact={ac}/> : null}
          </div>
        </div>
      )
    } else {
      return <Login fossil={this.fossil}/>
    }
  }

  render() {


    return <div className="app">
      {this.getWindow()}
    </div>;
  }
}

export default App;
