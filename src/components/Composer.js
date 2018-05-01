import React, {Component} from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';
import {ContactConversation} from "../fossil/conversation";

export class Composer extends Component {
  constructor(props) {
    super(props);

    this.fossil = props.fossil;
    this.chat = props.chat;
    this.state = {
      hoverEncryption: false,
      changingEncryptionState: false,
    };
  }

  onTextInput(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      this.chat.send(this.textInput.value);
      this.fossil.indexConversation(new ContactConversation({ client: this.fossil.client, contact: this.chat }));
      this.textInput.value = "";
    }
  }

  async toggleOmemo() {
    this.setState({
      changingEncryptionState: true,
    });
    try {
      await this.chat.toggleOmemo();
    } catch (e) {
      console.log(e);
    }
    this.setState({
      changingEncryptionState: false,
    });
  }

  render() {
    return (
      <div className="composer">
        <div className="text-input">
          <input onKeyDown={this.onTextInput.bind(this)} ref={a => this.textInput = a} type="text"/>
        </div>
        <div onMouseEnter={() => this.chat.omemoAvailable && this.setState({hoverEncryption: true})}
             onMouseLeave={() => this.chat.omemoAvailable && this.setState({hoverEncryption: false})}
             onClick={() => this.toggleOmemo()}
             className="encryption-switch">
          {this.state.changingEncryptionState ? <FontAwesomeIcon icon="circle-notch" spin/> :
            (this.chat.omemoEnabled !== this.state.hoverEncryption ? (
            <FontAwesomeIcon icon='lock' className="safe"/>
          ) : (
            <FontAwesomeIcon icon='lock-open' className={this.chat.omemoAvailable ? "unsafe": ""}/>
          ))}
        </div>
      </div>
    )
  }
}