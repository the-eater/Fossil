import React, {Component} from 'react'

export class ConversationItem extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <div onClick={this.props.onClick} className={'contact' + (this.props.active ? ' active' : '')}>
      <div className="avatar" style={{backgroundImage: `url(${this.props.conversation.getImage()})`}} />
      <label className="name">{this.props.conversation.getTitle()}</label>
      <label className="jid">{this.props.conversation.getDescription()}</label>
    </div>
  }
}