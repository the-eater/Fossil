import {OmemoStorage, OmemoUtils} from "./stanzaio/omemo";

export class FossilStorage {
  constructor(storeArray) {
    this.store = storeArray || new FossilLocalStorageStore();
  }

  hasUser() {
    return this.store.has(`user`);
  }

  getUser() {
    return this.store.get(`user`);
  }

  setUser(user) {
    const copy = Object.assign({}, user);

    if (typeof copy.jid !== 'string') {
      copy.jid = copy.jid.full;
    }

    this.store.set(`user`, copy);
  }

  getResource() {
    const result = this.store.get('resource', `fossil/${("000" + Math.floor(Math.random() * 65536).toString(16)).substr(-4).toUpperCase()}`);
    this.store.set('resource', result);
    return result;
  }

  setResource(resource) {
    this.store.set('resource', resource);
  }

  getTimelineItems(jid) {
    return this.store.get(`contact/${jid}/timeline/items`, []);
  }

  setTimelineItems(jid, items) {
    return this.store.set(`contact/${jid}/timeline/items`, items);
  }

  setName(jid, name) {
    return this.store.set(`contact/${jid}/name`, name);
  }

  getName(jid) {
    return this.store.get(`contact/${jid}/name`);
  }

  setRoster(contacts) {
    return this.store.set('roster', contacts);
  }

  getRoster() {
    return this.store.get('roster', []);
  }

  getRosterVersion() {
    return this.store.get('roster/version')
  }

  setRosterVersion(version) {
    return this.store.set('roster/version', version);
  }

  getAvatar(jid) {
    return this.store.get(`contact/${jid}/avatar`);
  }

  setAvatar(jid, avatar) {
    return this.store.set(`contact/${jid}/avatar`, avatar);
  }

  setActiveContact(jid) {
    return this.store.set('active-contact', jid);
  }

  getActiveContact() {
    return this.store.get('active-contact');
  }

  getContactOmemoEnabled(jid) {
    return this.store.get(`contact/${jid}/omemo-enabled`, false);
  }

  setContactOmemoEnabled(jid, enabled) {
    this.store.set(`contact/${jid}/omemo-enabled`, enabled);
  }
}

export class FossilOmemoStorage extends OmemoStorage {
  constructor(store) {
    super();

    this.store = new FossilNamespacedStore('omemo/', store);
  }

  async getDeviceIds(jid) {
    return new Set(this.store.get(`contact/${jid}/device-ids`));
  }

  async hasDeviceIds(jid) {
    return this.store.has(`contact/${jid}/device-ids`);
  }

  async storeDeviceIds(jid, deviceIds) {
    this.store.set(`contact/${jid}/device-ids`, Array.from(deviceIds));
  }

  async storeWhisper(address, id, whisper) {
     this.store.set(`whisper/${address}/${id}`, OmemoUtils.arrayBufferToBase64String(whisper));
  }

  async getWhisper(address, id) {
    const whipser = this.store.get(`whisper/${address}/${id}`);

    if (whipser === null) {
      return undefined;
    }

    return OmemoUtils.base64StringToArrayBuffer(whipser);
  }

  async getLocalRegistrationId() {
    const id = this.store.get('registration-id');

    if (id === null) {
      return undefined;
    }

    return parseInt(id, 10);
  }

  async storeLocalRegistrationId(id) {
    return this.store.set('registration-id', id);
  }

  async getIdentityKeyPair() {
    const identity = this.store.get('identity');

    if (identity === null) {
      return undefined;
    }

    return {
      pubKey: OmemoUtils.base64StringToArrayBuffer(identity.pubKey),
      privKey: OmemoUtils.base64StringToArrayBuffer(identity.privKey),
    }
  }

  async storeIdentityKeyPair(keyPair) {
    this.store.set('identity', {
      pubKey: OmemoUtils.arrayBufferToBase64String(keyPair.pubKey),
      privKey: OmemoUtils.arrayBufferToBase64String(keyPair.privKey),
    });
  }

  async isTrustedIdentity(identity, identityKey, direction) {
    return true;
  }

  async loadIdentityKey(identity) {
    const base64Key = this.store.get(`identity/${identity}`);

    if (!base64Key) {
      return undefined;
    }

    return OmemoUtils.base64StringToArrayBuffer(base64Key);
  }

  async saveIdentity(identity, identityKey) {
    this.store.set(`identity/${identity}`, OmemoUtils.arrayBufferToBase64String(identityKey));
  }

  async loadPreKey(keyId) {
    const preKey = this.store.get('prekey/' + keyId);

    if (!preKey) {
      return undefined;
    }

    return {
      privKey: OmemoUtils.base64StringToArrayBuffer(preKey.privKey),
      pubKey: OmemoUtils.base64StringToArrayBuffer(preKey.pubKey),
    };
  }

  async storePreKey(keyId, preKey) {
    this.store.set('prekey/' + keyId, {
      privKey: OmemoUtils.arrayBufferToBase64String(preKey.privKey),
      pubKey: OmemoUtils.arrayBufferToBase64String(preKey.pubKey),
    })
  }

  async removePreKey(keyId) {
    // Keep it in case of race condition
  }

  async loadSignedPreKey(keyId) {
    const signedPreKey = this.store.get('signed-prekey/' + keyId);

    if (!signedPreKey) {
      return undefined;
    }

    return {
      privKey: OmemoUtils.base64StringToArrayBuffer(signedPreKey.privKey),
      pubKey: OmemoUtils.base64StringToArrayBuffer(signedPreKey.pubKey),
    };
  }

  async storeSignedPreKey(keyId, signedPreKey) {
    this.store.set('signed-prekey/' + keyId, {
      privKey: OmemoUtils.arrayBufferToBase64String(signedPreKey.privKey),
      pubKey: OmemoUtils.arrayBufferToBase64String(signedPreKey.pubKey),
    })
  }

  async removeSignedPreKey(keyId) {
    this.store.remove(`signed-prekey/${keyId}`);
  }

  async loadSession(identifier) {
    const session = this.store.get(`session/${identifier}`);
    if (!session) {
      return undefined;
    }

    return session;
  }

  async storeSession(identifier, session) {
    this.store.set(`session/${identifier}`, session);
  }

  async removeSession(identifier) {
    this.store.remove(`session/${identifier}`);
  }

  async removeAllSessions(prefix) {
    return super.removeAllSessions(prefix);
  }
}

export class FossilNamespacedStore {
  constructor(prefix, store) {
    this.store = store;
    this.prefix = prefix;
  }

  buildKey(key) {
    return this.prefix + key;
  }

  get(key, default_ = null) {
    return this.store.get(this.buildKey(key), default_)
  }

  set(key, value) {
    this.store.set(this.buildKey(key), value);
  }

  remove(key) {
    this.store.remove(this.buildKey(key));
  }

  has(key) {
    return this.store.has(this.buildKey(key));
  }
}

export class FossilLocalStorageStore {
  constructor(prefix) {
    this.prefix = prefix || 'fossil/'
  }

  buildKey(key) {
    return this.prefix + key;
  }

  get(key, default_ = null) {
    const item = localStorage.getItem(this.buildKey(key));

    if (item === null) {
      return default_;
    }

    try {
      return JSON.parse(item);
    } catch (e) {
      return default_;
    }
  }

  set(key, value) {
    localStorage.setItem(this.buildKey(key), JSON.stringify(value));
  }

  remove(key) {
    localStorage.removeItem(this.buildKey(key));
  }

  has(key) {
    return localStorage.getItem(this.buildKey(key)) !== null;
  }
}