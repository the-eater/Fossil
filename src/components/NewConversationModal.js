import React, {Component} from 'react';
import {FossilModal} from "./FossilModal";
import {ContactList} from "./ContactList";
import {JID} from 'stanza.io'
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

class NewConversationModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchValue: false,
      quickContact: false,
      isOpen: false,
    };
  }

  updateSearch() {
    this.setState({
      searchValue: this.search.value,
      quickContact: /.+@.+/.test(this.search.value),
    });
  }

  onQuickContact() {
    let bare = new JID(this.state.searchValue.trim()).bare;

    this.props.fossil.roster.indexContact({
      jid: bare,
      phantom: true,
    });

    this.props.fossil.activateContact(bare);

    this.close();
  }

  onContactSelect(jid) {
    this.props.fossil.activateContact(jid);
    this.close();
  }

  open() {
    this.setState({
      isOpen: true,
    })
  }

  close() {
    this.setState({
      isOpen: false,
      searchValue: '',
      quickContact: false,
    })
  }

  render() {
    return <FossilModal className="new-convo-modal" onRequestClose={() => this.close()} isOpen={this.state.isOpen}>
      <div className="quick-search">
        <input ref={a => this.search = a} onKeyUp={() => this.updateSearch()} type="text" placeholder="Search..."/>
      </div>
      { this.state.quickContact && !this.props.fossil.roster.gotContact(this.state.searchValue.trim())
        ? <div onClick={() => this.onQuickContact()} className="quick-add">
          <span className="text">Contact {new JID(this.state.searchValue).bare}</span>
          <FontAwesomeIcon icon="comment" />
        </div>
        : null
      }
      <ContactList onSelect={jid => this.onContactSelect(jid)} filter={this.state.searchValue} roster={this.props.fossil.roster}/>
    </FossilModal>
  }
}

export default NewConversationModal