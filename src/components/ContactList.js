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
    let contacts = this.props.roster.getContacts();

    if (this.props.filter) {

      contacts = this.props.roster.search(this.props.filter);
    }

    return <div className="contact-list">
        {contacts.map((contact) => <Contact onClick={() => this.handleSelect(contact.jid)}
                                            active={contact.jid === this.props.active} key={contact.jid}
                                            contact={contact}/>)}
    </div>
  }
}