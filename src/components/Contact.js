import React, {Component} from 'react'

export class Contact extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <div onClick={this.props.onClick} className={'contact' + (this.props.active ? ' active' : '')}>
      <div className="avatar" style={{backgroundImage: `url(${this.props.contact.getAvatar()})`}} />
      <label className="name">{this.props.contact.getDisplayName()}</label>
      <label className="jid">{this.props.contact.jid.toString()}</label>
    </div>
  }
}