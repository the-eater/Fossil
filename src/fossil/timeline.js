import {Message} from "./message";

export class FossilTimeline {
  constructor({owner, jid, connection, storage, onState}) {
    this.owner = owner;
    this.jid = jid;
    this.onState = onState;
    this.storage = storage;
    this.client = connection;
    this.items = storage.getTimelineItems(this.jid);
    this.reindexItems();

  }

  reindexItems() {
    this.itemsById = new Map();

    for (const item of this.items) {
      if (!item.id) {
        continue;
      }

      this.itemsById.set(item.id, item);
    }
  }

  getItems() {
    return this.items;
  }

  getLastTimelineItemDate() {
    if (this.items.length === 0) {
      return (new Date(0)).toISOString();
    }

    return new Date(this.items[this.items.length - 1].date).toISOString();
  }

  async boot() {
    const result = await this.client.searchHistory({
      with: this.jid.bare,
      rsm: {max: 50, before: true},
      complete: false
    });

    result.mamResult.items.forEach((item) => this.indexArchivedMessage(item.forwarded))
  }

  indexArchivedMessage(archivedMessage) {
    const date = new Date(archivedMessage.delay.stamp);
    this.indexMessage(date, archivedMessage.message);
  }

  async indexMessage(date, message) {
    if ('receipt' in message && this.itemsById.has(message.receipt)) {
      this.itemsById.get(message.receipt).receipt = {
        date: +date,
        received: true,
      };

      return;
    }

    if ('receipt' in message) {
      return;
    }

    if (this.itemsById.has(message.id)) {
      return;
    }

    const messageObj = new Message({
      date: +date,
      message: message,
      body: message.body,
    });

    this.itemsById.set(message.id, messageObj);
    this.items.push(messageObj);

    this.items.sort((a, b) => a.date - b.date);
    this.storage.setTimelineItems(this.jid, this.items);

    messageObj.boot && messageObj.boot(this.client, () => {
      this.onState();
      this.storage.setTimelineItems(this.jid, this.items);
    });

    this.onState();
  }
}