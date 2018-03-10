import React, {Component, Fragment} from 'react';
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

    this.timeUpdate = setInterval(() => this.setState(this.fossil), 2000);
  }

  getWindow() {
    if (this.fossil.loggedIn) {
      const ac = this.fossil.activeContact;
      return (
        <Fragment>
          <ContactList onSelect={(jid) => this.fossil.activateContact(jid)} roster={this.state.roster}
                       active={ac ? ac.jid : null}/>
          <div className="window">
            {ac ? <Chat key={ac.jid.toString()} owner={this.fossil.jid} contact={ac}/> : null}
          </div>
        </Fragment>
      )
    } else {
      return <Login fossil={this.fossil} />
    }
  }

  render() {


    return <div className="app">
      {this.getWindow()}
    </div>;
  }
}

export default App;
