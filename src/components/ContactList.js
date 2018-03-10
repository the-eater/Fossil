import React, {Component} from 'react'
import {Contact} from './Contact.js';

export class ContactList extends Component {
  constructor(props) {
    super(props);

    this.onSelect = props.onSelect;
  }

  handleSelect(jid) {
    this.onSelect && this.onSelect(jid);
  }

  render() {
    return <div className="contact-list">
      {this.props.roster.getContacts().map((contact) => <Contact onClick={() => this.handleSelect(contact.jid)} active={contact.jid === this.props.active} key={contact.jid} contact={contact} />)}
    </div>
  }
}