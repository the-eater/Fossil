import XMPP, {JID} from 'stanza.io'
import OMEMO from './fossil/stanzaio/omemo';
import Hints from './fossil/stanzaio/hints';
import {FossilRoster} from "./fossil/roster";
import {FossilOmemoStorage, FossilStorage} from "./fossil/storage";

export class Fossil {
  constructor({onState, storage = new FossilStorage()}) {
    window.fossil = this;

    this.storage = storage;
    this.onState = onState;

    this.jid = null;
    this.createClient();

    this.roster = new FossilRoster({
      storage: this.storage,
      onState: () => this.onState(this),
      client: this.client,
    });

    this.booted = false;
    this._loggedIn = false;
    this.activeContact = null;
    this.windowState = {
      seeChat: false,
    };
  }

  get loggedIn() {
    return this._loggedIn;
  }

  set loggedIn(value) {
    this._loggedIn = value;
    this.onState(this);
  }

  setResource(resource) {
    this.storage.setResource(resource);
    this.createClient();
  }

  createClient() {
    if (this.client) {
      this.client.disconnect();
    }

    this.client = XMPP.createClient({
      useStreamManagement: true,
      softwareVersion: {
        name: 'Fossil',
        version: 'v0.1.0',
        os: 'Web',
      },
      resource: this.storage.getResource(),
    });

    this.client.use(OMEMO);
    this.client.use(Hints);
    this.client.createOmemo(new FossilOmemoStorage(this.storage.store));

    this.client.on('session:started', () => this.boot());
    this.client.on('chat', (chat) => this.handleChat(chat));
    this.client.on('carbon:sent', (carbon) => this.handleChat(carbon.carbonSent.forwarded.message));
    this.client.on('message:sent', (message) => this.handleChat(message));
  }

  handleChat(chat) {
    let where = chat.to.bare;

    if (this.client.jid.bare === where) {
      where = chat.from.bare;
    }

    const contact = this.findContact(where);

    if (!contact) {
      // Ignore spam I guess
      return;
    }

    contact.timeline.indexMessage(new Date(), chat);
    this.onState(this);
  }

  findContact(jid) {
    return this.roster.contacts.find((a) => a.jid.toString() === jid.toString());
  }

  start() {
    if (this.storage.hasUser()) {
      this.loggedIn = true;
      this.jid = new JID(this.storage.getUser().jid);
      this.client.connect(this.storage.getUser());
    }

    this.activateContact(this.storage.getActiveContact());
  }

  boot() {
    if (this.booted) {
      return;
    }

    this.loggedIn = true;
    this.booted = true;
    this.jid = this.client.jid;
    this.client.sendPresence();
    this.client.enableCarbons();
    this.roster.boot();
    this.client.omemo.start();
  }

  activateContact(jid) {
    this.activeContact = this.findContact(jid);
    this.storage.setActiveContact(jid);
    this.windowState.seeChat = true;
    this.onState(this);
  }
}