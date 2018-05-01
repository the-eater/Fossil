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

    this.conversations = [];
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
    this.client.on('message', (chat) => this.handleMessage(chat));
    this.client.on('carbon:sent', (carbon) => this.handleMessage(carbon.carbonSent.forwarded.message));
    this.client.on('message:sent', (message) => this.handleMessage(message));
    this.client.on('roster:update', ev => this.roster.update(ev.roster));
  }

  handleMessage(chat) {
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
    if (!jid) {
      return null;
    }

    return this.roster.contacts.find((a) => a.jid.toString() === jid.toString());
  }

  indexConversation(conversation) {
    if (conversation.getId() in this.conversationsById) {
      return;
    }

    this.conversations.push(conversation);
    this.conversationsById[conversation.getId()] = conversation;
    this.storage.setConversations(this.conversations);
  }

  start() {
    if (this.storage.hasUser()) {
      this.loggedIn = true;
      this.jid = new JID(this.storage.getUser().jid);
      this.client.connect(this.storage.getUser());
    }

    this.conversations = this.storage.getConversations(this);
    this.conversationsById = this.conversations.reduce((carry, item) => {
      carry[item.getId()] = item;

      return carry;
    }, {});

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
    this.windowState.seeChat = !!jid;
    this.onState(this);
  }
}