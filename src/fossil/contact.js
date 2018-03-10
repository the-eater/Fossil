import {FossilTimeline} from "./timeline";
import * as uuid from 'uuid/v4';

export class FossilContact {
  constructor({jid, connection, item, onState, storage, owner}) {
    this.storage = storage;
    this.onState = onState;
    this.jid = jid;
    this.client = connection;
    this.item = item;
    this.timeline = new FossilTimeline({jid, connection, storage, owner, onState});
    this.booted = false;
    this.omemoEnabled = this.storage.getContactOmemoEnabled(jid);
  }

  boot() {
    if (this.booted) {
      return;
    }

    this.booted = true;
    this.client.getVCard(this.jid, (err, vcard) => (err || this.setVCard(vcard)));
    this.timeline.boot();
  }

  async send(text) {
    if (this.omemoEnabled) {
      const id = uuid();

      await this.client.omemo.sendMessage({
        id,
        to: this.jid,
        from: this.client.jid,
        body: text,
        type: 'chat',
      });

      this.timeline.updateMessage(id, {
        encrypted: true,
        body: text
      });
      return;
    }

    this.client.sendMessage({
      to: this.jid,
      from: this.client.jid,
      body: text,
      type: 'chat',
    });
  }

  async toggleOmemo() {
    if (this.omemoEnabled) {
      this.omemoEnabled = false;
      this.storage.setContactOmemoEnabled(this.jid.bare, false);
      this.onState();
    }

    const ids = await this.client.omemo.getAnnouncedDeviceIds(this.jid.bare);

    if (ids.size > 0) {
      this.omemoEnabled = true;
      this.storage.setContactOmemoEnabled(this.jid.bare, true);
      this.onState();
    }
  }

  getTimelineItems() {
    return this.timeline.getItems();
  }

  updateItem(item) {
    this.item = item;
  }

  setVCard(vcard) {
    this.vcard = new FossilvCard({vcard: vcard.vCardTemp, jid: this.jid});
    this.onState();
  }

  getAvatar() {
    let avatar;

    if (this.vcard) {
      avatar = this.vcard.getAvatarUri();
    }

    if (!avatar) {
      return this.storage.getAvatar(this.jid);
    } else {
      this.storage.setAvatar(this.jid, avatar);
    }

    return avatar;
  }

  getDisplayName() {
    const name = this.getRawDisplayName();

    this.storage.setName(this.jid, name);

    return name;
  }

  getRawDisplayName() {
    if (this.vcard) {
      const name = this.vcard.getName();

      if (name) {
        return name;
      }
    }

    const storedName = this.storage.getName(this.jid);
    if (storedName) {
      return storedName;
    }

    if (this.item.name) {
      return this.item.name
    }

    return this.jid.toString();
  }
}

export class FossilvCard {
  constructor({jid, vcard}) {
    this.jid = jid;
    this.vcard = vcard;
  }

  getAvatarUri() {
    if (this.vcard.photo) {
      return 'data:' + this.vcard.photo.type + ';base64,' + this.vcard.photo.data;
    }

    return 'data:,'
  }

  getName() {
    if (this.vcard.fullName) {
      return this.vcard.fullName;
    }

    return null;
  }
}