import React, {Component} from 'react';
import './App.css';
import {Fossil} from "./fossil";
import {Chat} from "./components/Chat";
import {Login} from "./components/Login";
import {ConversationList} from "./components/ConversationList";
import Modal from 'react-modal';

Modal.setAppElement("#root");
Modal.portalClassName = "modal-portal";

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

  activateConversation(convoId) {
    const [type, id = ""] = convoId.split("/", 2);
    if (type === 'contact') {
      this.fossil.activateContact(id);
    }
  }

  getWindow() {
    if (this.fossil.loggedIn) {
      const ac = this.fossil.activeContact;
      return (
        <div className={"chat-state" + (this.fossil.windowState.seeChat ? ' see-chat' : '')}>
          <ConversationList fossil={this.fossil} onSelect={(jid) => this.activateConversation(jid)} conversations={this.state.conversations}
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
