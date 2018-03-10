import React, {Component} from 'react'
import {Message} from "./Message";
import {JID} from 'stanza.io';

export class Chat extends Component {
  constructor(props) {
    super(props);
    this.contact = props.contact;
    this.forceBottom = true;
  }

  componentWillUpdate() {
    this.forceBottom = !(this.messageList && this.messageList.scrollHeight !== (this.messageList.scrollTop + this.messageList.offsetHeight))
  }

  componentDidMount() {
    this.messageList.scrollTop = this.messageList.scrollHeight - this.messageList.offsetHeight;
  }

  componentDidUpdate() {
    if (this.forceBottom) {
      this.messageList.scrollTop = this.messageList.scrollHeight - this.messageList.offsetHeight;
    }
  }

  handleInput(e) {
    if (e.keyCode === 13) {
      this.contact.send(this.inputBox.value);
      this.inputBox.value = "";
    }
  }

  render() {
    return <div className="chat-window">
      <div className="message-list" ref={(item) => this.messageList = item}>
        {this.contact.getTimelineItems()
          .filter((message) => !!message.body)
          .map((message) => {
          const messageJid = typeof(message.message.from) === 'string' ? new JID(message.message.from) : message.message.from;

          return <Message isSelf={messageJid.bare === this.props.owner.bare} key={message.id} message={message}/>
        })}
      </div>
      <div className="composer">
        <input ref={(a) => this.inputBox = a} onKeyDown={this.handleInput.bind(this)} type="text"/>
      </div>
    </div>
  }
}