import React, {Component} from 'react'
import {Message} from "./Message";
import {JID} from 'stanza.io';
import {Composer} from "./Composer";
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

export class Chat extends Component {
  constructor(props) {
    super(props);
    this.contact = props.contact;
    this.fossil = props.fossil;
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

  openContacts() {
    this.fossil.windowState.seeChat = false;
    this.fossil.onState(this.fossil);
  }

  async addContact() {
    await this.fossil.client.acceptSubscription(this.contact.jid);
    await this.fossil.client.subscribe(this.contact.jid);

  }

  async blockContact() {
    this.fossil.client.block(this.contact.jid);
  }

  render() {
    return <div className="chat-window">
      <div className="top-bar">
        <div className="menu-button" onClick={() => this.openContacts()}>
          <FontAwesomeIcon icon="align-justify"/>
        </div>
        <div className="contact-info">
          <div className="name">{this.contact.getDisplayName()}</div>
          <div className="jid">{this.contact.jid.bare}</div>
        </div>
      </div>
      { this.contact.inRoster ? null : (
        <div className="roster-management">
          <label>{this.contact.jid.bare} is not in your contact list</label>
          <div className="buttons">
            <div onClick={() => this.addContact()} className="add">
              Add
            </div>
            <div onClick={() => this.blockContact()} className="block">
              Block
            </div>
          </div>
        </div>
      ) }
      <div className="message-list" ref={(item) => this.messageList = item}>
        {this.contact.getTimelineItems()
          .filter((message) => !!message.body)
          .map((message) => {
            const messageJid = typeof(message.message.from) === 'string' ? new JID(message.message.from) : message.message.from;

            return <Message isSelf={messageJid.bare === this.props.owner.bare} key={message.id} message={message}/>
          })}
      </div>
      <Composer fossil={this.fossil} chat={this.contact}/>
    </div>
  }
}