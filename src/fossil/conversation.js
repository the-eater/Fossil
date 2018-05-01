export default class Conversation {
  getDescription() {
    return ''
  }

  getTitle() {
    return '-'
  }

  getImage() {
    return 'data:,'
  }

  getType() {
    return 'none';
  }

  getId() {
    return this.getType() + '/' + this.getTitle();
  }

  getJSON() {
    return {};
  }

  getLastMessage() {
    return null;
  }

  static fromJSON(obj, fossil) {
    switch (obj.type) {

      case 'contact':
        let contact = fossil.findContact(obj.data);

        if (!contact) {
          fossil.roster.indexContact({
            jid: obj.data,
            phantom: true,
          });

          contact = fossil.findContact(obj.data)
        }

        return new ContactConversation({
          contact,
          client: fossil.client,
        });

      default:
        return null;
    }
  }
}

export class ContactConversation extends Conversation {
  constructor({ contact, client }) {
    super();

    this.contact = contact;
    this.client = client;
  }

  getType() {
    return 'contact';
  }

  getDescription() {
    return this.contact.jid.bare;
  }

  getTitle() {
    return this.contact.getDisplayName();
  }

  getImage() {
    return this.contact.getAvatar();
  }

  getId() {
    return 'contact/' + this.contact.jid.bare;
  }

  getJSON() {
    return this.contact.jid.bare;
  }

  getLastMessage() {
    return this.contact.getLastMessage();
  }
}