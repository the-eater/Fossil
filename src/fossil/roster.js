import {FossilContact} from "./contact";
import {JID} from 'stanza.io'

export class FossilRoster {

  constructor({ client, onState, storage, owner}) {
    this.storage = storage;
    this.onState = onState;
    this.client = client;
    this.contacts = [];
    this.owner = owner;
    this.contactsByJid = {};
    this.version = this.storage.getRosterVersion();
    this.booted = false;

    for (const item of this.storage.getRoster()) {
      this.indexContact(item);
    }
  }

  boot() {
    this.booted = true;

    this.contacts.forEach((c) => c.boot());
    this.client.getRoster((err, resp) => this.update(resp.roster));
  }

  update(roster) {
    for (const item of roster.items) {
      this.indexContact(item);
    }

    this.storage.setRosterVersion(roster.ver);

    this.onState();
  }

  getContacts() {
    return this.contacts;
  }

  indexContact(item) {
    const bareJid = typeof(item.jid) === 'string' ? new JID(item.jid) : item.jid;
    const contact = new FossilContact({jid: bareJid, item, connection: this.client, onState: this.onState, storage: this.storage, owner: this.owner});

    if (bareJid in this.contactsByJid) {
      this.contactsByJid[bareJid].updateItem(item);
      return;
    }

    if (this.booted) {
      contact.boot();
    }

    this.contacts.push(contact);
    this.contactsByJid[bareJid] = contact;
    this.storage.setRoster(this.contacts.map((contact) => contact.item));
  }
}