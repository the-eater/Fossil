import React, {Component, Fragment} from 'react'
import {JID} from 'stanza.io';

export class ConversationItem extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let lastItem = this.props.conversation.getLastMessage();

    return <div onClick={this.props.onClick} className={'conversation' + (this.props.active ? ' active' : '')}>
      <div className="avatar" style={{backgroundImage: `url(${this.props.conversation.getImage()})`}}/>
      <label className="name">{this.props.conversation.getTitle()}</label>
      <span className="last-item">
        {this.props.conversation.getType() === 'contact' ? (
          <Fragment>
            {this.props.conversation.contact.jid.bare === new JID(lastItem.message.to).bare ? <span className="user">You: </span> : null}

            {(lastItem.body||"").split("\n").shift().substr(0, 100)}
          </Fragment>
        ) : (
          <Fragment>

          </Fragment>
        )}
      </span>
    </div>
  }
}