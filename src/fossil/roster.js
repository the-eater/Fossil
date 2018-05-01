import {FossilContact} from "./contact";
import {JID} from 'stanza.io'
import Fuse from 'fuse.js';

export class FossilRoster {

  constructor({client, onState, storage, owner}) {
    this.storage = storage;
    this.onState = onState;
    this.client = client;
    this.contacts = [];
    this.owner = owner;
    this.contactsByJid = {};
    this.version = this.storage.getRosterVersion();
    this.booted = false;

    for (const item of this.storage.getRoster()) {
      this.indexContact(item, true);
    }

    this.index();
  }

  getIndexingList() {
    return this.contacts.map(c => ({
      jid: c.jid.bare,
      display_name: c.getDisplayName(),
    }));
  }

  index() {
    this.fuse = new Fuse(this.getIndexingList(), {
      keys: ['jid', 'display_name']
    });
  }

  boot() {
    this.booted = true;

    this.contacts.forEach((c) => c.boot());
    this.fuse.setCollection(this.getIndexingList());
    this.client.getRoster((err, resp) => {
      if (err) {
        setTimeout(() => {
          this.client.getRoster((err, resp) => {
            if (err) {
              this.onState();
              return;
            }

            this.update(resp.roster)
          });
        }, 5000);
        return;
      }

      this.update(resp.roster)
    });
  }

  update({items = [], ver = null,}) {
    for (const item of items) {
      this.indexContact(item, true);
    }

    this.storage.setRosterVersion(ver);

    this.onState();
  }

  getFuse() {
    return this.fuse;
  }

  search(q) {
    return this.getFuse()
      .search(q)
      .map(c => this.contactsByJid[c.jid])
      .filter(a => !!a);
  }

  gotContact(jid) {
    const bareJid = typeof(jid) === 'string' ? new JID(jid) : jid;
    return bareJid.bare in this.contactsByJid;
  }

  getContacts() {
    return this.contacts;
  }

  removeContact(jid) {
    const sureJid = typeof(jid) === 'string' ? new JID(jid) : jid;

    if (sureJid.bare in this.contactsByJid) {
      this.contactsByJid[sureJid].inRoster = false;
    }

    this.updateContacts();
  }

  indexContact(item, inRoster = false) {
    const bareJid = typeof(item.jid) === 'string' ? new JID(item.jid) : item.jid;

    if (item.subscription === 'remove') {
      this.removeContact(bareJid);
      return;
    }

    const contact = new FossilContact({
      jid: bareJid,
      item,
      connection: this.client,
      onState: this.onState,
      storage: this.storage,
      owner: this.owner,
      inRoster
    });

    if (bareJid.bare in this.contactsByJid) {
      this.contactsByJid[bareJid.bare].updateItem(item);
      this.contactsByJid[bareJid.bare].inRoster = inRoster;

      this.updateContacts();
      return;
    }

    if (this.booted) {
      contact.boot();
    }

    this.contacts.push(contact);
    this.contactsByJid[bareJid.bare] = contact;
    this.updateContacts();
  }

  updateContacts() {
    if (this.booted) {
      this.fuse.setCollection(this.getIndexingList());
    }

    this.storage.setRoster(
      this.contacts
        .filter(contact => contact.inRoster)
        .map(contact => contact.item)
    );
  }
}