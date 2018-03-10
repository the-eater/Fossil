import {TimelineItem} from "./timeline_item";

export class Message extends TimelineItem {
  constructor({date, message, body}) {
    super({date, type: 'message'});

    this.id = message.id;
    this.message = message;
    this.receipt = {
      received: false,
    };

    this.body = body;
    this.encrypted = false;
  }

  async boot(client, onState) {
    if (this.message.encrypted && client.omemo) {
      const body = await client.omemo.decryptMessage(this.message);
      if (body !== null) {
        this.body = (new TextDecoder()).decode(body);
        this.encrypted = true;
      }
    }

    onState();
  }
}