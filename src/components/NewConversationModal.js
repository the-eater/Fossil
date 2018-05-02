import React, {Component, Fragment} from 'react';
import {FossilModal} from "./FossilModal";
import {ContactList} from "./ContactList";
import {JID} from 'stanza.io'
import FontAwesomeIcon from "@fortawesome/react-fontawesome";

class NewConversationModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchValue: '',
      quickContact: false,
      quickJoin: false,
      quickCreate: false,
      isOpen: false,
    };

    this.isMucCache = new Map();
    this.lookupTimer = false;
  }

  updateSearch() {
    this.setState({
      searchValue: this.search.value
    });

    if (this.lookupTimer) {
      clearTimeout(this.lookupTimer);
    }

    if (/.+@.+/.test(this.search.value)) {
      this.lookupTimer = setTimeout(() => this.checkRoom(this.search.value), 50);
    }
  }

  async isMucServer(jid) {
    let domain = new JID(jid).domain;

    if (!this.isMucCache.has(domain)) {
      this.isMucCache.set(domain, await this.isMuc(domain));
    }

    return this.isMucCache.get(domain);
  }

  async isMuc(jid) {
    try {
      const info = await this.props.fossil.client.getDiscoInfo(jid);
      if (info.discoInfo.features.indexOf('http://jabber.org/protocol/muc') === -1) {
        return false;
      }
    } catch (e) {
      return false;
    }

    return true;
  }

  async checkRoom(val) {
    if (val !== this.state.searchValue) {
      return;
    }

    let isMuc = await this.isMucServer(val);

    if (val !== this.state.searchValue) {
      return;
    }

    this.setState({
      quickJoin: isMuc,
      quickCreate: false,
      quickContact: !isMuc,
    });

    if (!isMuc) {
      return;
    }

    let exists = await this.isMuc(val);

    if (val !== this.state.searchValue) {
      return;
    }

    this.setState({
      quickJoin: exists,
      quickCreate: !exists,
      quickContact: !isMuc,
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

  onQuickJoin() {
    let bare = new JID(this.state.searchValue.trim()).bare;


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
    const bare = new JID((this.state.searchValue || "").trim()).bare;

    return <FossilModal className="new-convo-modal" onRequestClose={() => this.close()} isOpen={this.state.isOpen}>
      <div className="quick-search">
        <input ref={a => this.search = a} onKeyUp={() => this.updateSearch()} type="text" placeholder="Search..."/>
      </div>
      {this.state.quickContact && !this.props.fossil.roster.gotContact(bare)
        ? (
          <div onClick={() => this.onQuickContact()} className="quick-add">
            <span className="text">Contact {bare}</span>
            <FontAwesomeIcon icon="comment"/>
          </div>
        )
        : null
      }

      {(this.state.quickJoin || this.state.quickCreate) ? (
        <div onClick={() => this.onQuickJoin()} className="quick-join">
          <span className="text">{this.state.quickCreate ? 'Create room': 'Join'} {bare}</span>
          <FontAwesomeIcon icon="comments"/>
        </div>
      ) : null}
      <ContactList onSelect={jid => this.onContactSelect(jid)} filter={this.state.searchValue}
                   roster={this.props.fossil.roster}/>
    </FossilModal>
  }
}

export default NewConversationModal