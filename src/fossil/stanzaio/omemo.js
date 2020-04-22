import {JID} from 'stanza.io';

const libsignal = window.libsignal;
const {KeyHelper, SignalProtocolAddress, SessionBuilder, SessionCipher, Curve} = libsignal;
const subtleCrypto = window.crypto.subtle;

export default function (client, stanzas) {
  const types = stanzas.utils;

  const NS = 'eu.siacs.conversations.axolotl';

  const Encrypted = stanzas.define({
    name: 'encrypted',
    element: 'encrypted',
    namespace: NS,
    fields: {
      payload: types.textSub(NS, 'payload')
    }
  });

  const Key = stanzas.define({
    element: 'key',
    namespace: NS,
    fields: {
      rid: types.attribute('rid'),
      prekey: types.boolAttribute('prekey'),
      content: types.text(),
    }
  });

  const Header = stanzas.define({
    name: 'header',
    element: 'header',
    namespace: NS,
    fields: {
      sid: types.attribute('sid'),
      iv: types.textSub(NS, 'iv')
    }
  });

  const PreKeyPublic = stanzas.define({
    name: 'preKeyPublic',
    element: 'preKeyPublic',
    namespace: NS,
    fields: {
      id: types.attribute('preKeyId'),
      content: types.text(),
    }
  });

  const SignedPreKeyPublic = stanzas.define({
    name: 'signedPreKeyPublic',
    element: 'signedPreKeyPublic',
    namespace: NS,
    fields: {
      id: types.attribute('signedPreKeyId'),
      content: types.text(),
    }
  });

  const Bundle = stanzas.define({
    name: 'bundle',
    element: 'bundle',
    namespace: NS,
    fields: {
      signedPreKeySignature: types.textSub(NS, 'signedPreKeySignature'),
      identityKey: types.textSub(NS, 'identityKey'),
      preKeys: types.subMultiExtension(NS, 'prekeys', PreKeyPublic),
    }
  });

  const DeviceList = stanzas.define({
    name: 'deviceList',
    element: 'list',
    namespace: NS,
    fields: {
      devices: types.multiSubAttribute(NS, 'device', 'id')
    }
  });

  const Encryption = stanzas.define({
    name: 'encryption',
    element: 'encryption',
    namespace: 'urn:xmpp:eme:0',
    fields: {
      name: types.attribute('name'),
      namespace: types.attribute('namespace'),
    }
  });

  stanzas.extend(Bundle, SignedPreKeyPublic);
  stanzas.extend(Encrypted, Header);

  stanzas.extend(Header, Key, 'keys', true);

  stanzas.withMessage((Message) => {
    stanzas.extend(Message, Encrypted);
    stanzas.extend(Message, Encryption);
  });

  stanzas.withPubsubItem((Item) => {
    stanzas.extend(Item, Bundle);
    stanzas.extend(Item, DeviceList);
  });

  client.createOmemo = (store) => {
    client.omemo = new OmemoClient({client, store});
  };
}

function notImplemented() {
  class NotImplementedError extends Error {
  }

  throw new NotImplementedError('Function is not Implemented');
}

export class OmemoStorage {
  Direction = {
    SENDING: 1,
    RECEIVING: 2,
  };

  storeDeviceIds(jid, deviceIds) {
    notImplemented();
  }

  getDeviceIds(jid) {
    notImplemented();
  }

  storeWhisper(address, id, whisper) {
    notImplemented();
  }

  getWhisper(address, id) {
    notImplemented()
  }

  getLocalRegistrationId() {
    notImplemented();
  };

  storeLocalRegistrationId(id) {
    notImplemented();
  }

  getIdentityKeyPair() {
    notImplemented();
  };

  storeIdentityKeyPair(keyPair) {
    notImplemented();
  }

  isTrustedIdentity(identity, identityKey, direction) {
    notImplemented();
  };

  loadIdentityKey(identity) {
    notImplemented();
  };

  saveIdentity(identity, identityKey) {
    notImplemented();
  };

  loadPreKey(keyId) {
    notImplemented();
  };

  storePreKey(keyId, preKey) {
    notImplemented();
  };

  removePreKey(keyId) {
    notImplemented();
  };

  loadSignedPreKey(keyId) {
    notImplemented();
  };

  storeSignedPreKey(keyId, signedPreKey) {
    notImplemented();
  };

  removeSignedPreKey(keyId) {
    notImplemented();
  };

  loadSession(identifier) {
    notImplemented();
  };

  storeSession(identifier, session) {
    notImplemented();
  };

  removeSession(identifier) {
    notImplemented();
  };

  removeAllSessions(prefix) {
    notImplemented();
  };

  wrapFunction(name, func) {
    const orig = this[name];
    this[name] = (...args) => func(orig, ...args);
  }
}

export class OmemoAddress extends SignalProtocolAddress {
  constructor(name, deviceId) {
    super(typeof(name) === 'string' ? name : name.bare, deviceId);
  }
}

export class OmemoUtils {
  static arrayBufferToBase64String(arrayBuffer) {
    const charArray = new Uint8Array(arrayBuffer);
    return btoa(charArray.reduce((carry, x) => carry + String.fromCharCode(x), ""));
  }

  static base64StringToArrayBuffer(str) {
    const byteStr = atob(str);
    const arrayBuffer = new ArrayBuffer(byteStr.length);
    const byteArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteStr.length; i++) {
      byteArray[i] = byteStr.charCodeAt(i);
    }

    return arrayBuffer;
  }
}

export class OmemoClient {
  constructor({client, store = new OmemoStorage()}) {
    this.client = client;
    this.store = store;
    this.subscriptions = new Set();

    this.client.on('pubsub:event', (event) => this.handleDeviceList(event));
  }

  async handleDeviceList(msg) {
    if (!msg.event.updated) {
      // Ignore node purge/deletion/etc events.
      return;
    }

    if (msg.event.updated.node !== 'eu.siacs.conversations.axolotl.devicelist') {
      // We only want the event for a specific node.
      return;
    }

    const devices = new Set(msg.event.updated.published[0].deviceList.devices);
    await this.store.storeDeviceIds(new JID(msg.from).bare, devices);
  }

  async start() {
    let identityKeyPair = await this.store.getIdentityKeyPair();
    let registrationId = await this.store.getLocalRegistrationId();
    let isNew = false;

    this.store.wrapFunction('removePreKey', async (next, id) => {
      await this.announce(await this.store.getLocalRegistrationId(), await this.store.getIdentityKeyPair(), false, id);
      await next(id);
    });

    if (identityKeyPair === undefined || registrationId === undefined) {
      registrationId = KeyHelper.generateRegistrationId();
      identityKeyPair = await KeyHelper.generateIdentityKeyPair();
      isNew = true;

      await this.store.storeIdentityKeyPair(identityKeyPair);
      await this.store.storeLocalRegistrationId(registrationId);
    }

    await this.announce(registrationId, identityKeyPair, isNew);
  }

  async getAnnouncedDeviceIds(jid) {
    if (!jid) {
      jid = this.client.jid;
    }

    if (typeof jid !== 'string') {
      jid = jid.bare;
    }

    if (!this.subscriptions.has(jid)) {
      try {
        await this.client.subscribeToNode(jid, 'eu.siacs.conversations.axolotl.devicelist');
      } catch (e) {
      }
      this.subscriptions.add(jid);
    }

    if (await this.store.hasDeviceIds(jid)) {
      return await this.store.getDeviceIds(jid);
    }

    let deviceList;
    try {
      deviceList = await this.client.getItems(jid, 'eu.siacs.conversations.axolotl.devicelist');
    } catch (e) {
      return new Set();
    }

    let deviceIds = [];

    try {
      deviceIds = deviceList.pubsub.retrieve.item.deviceList.devices;
    } catch (e) {
    }

    const ids = new Set(deviceIds.map((a) => parseInt(a, 10)));

    await this.store.storeDeviceIds(jid, ids);
    return ids;
  }

  async getDeviceKeyBundle(recipient, registrationId) {
    let keyBundle;
    try {
      keyBundle = await this.client.getItems(typeof(recipient) === 'string' ? recipient : recipient.bare, 'eu.siacs.conversations.axolotl.bundles:' + registrationId);
    } catch (e) {
      return null;
    }
    let bundle = null;

    try {
      bundle = keyBundle.pubsub.retrieve.item.bundle;
    } catch (e) {
      console.log(keyBundle)
    }

    return bundle;
  }

  async announceDeviceIds(deviceIds) {
    await this.client.publish(this.client.jid.bare, 'eu.siacs.conversations.axolotl.devicelist', {
      deviceList: {
        devices: Array.from(deviceIds)
      }
    });
  }

  async announce(registrationId, identityKeyPair, isNew, removePreKey = null) {
    console.log('Announcing', {registrationId, identityKeyPair, isNew});
    const deviceIds = await this.getAnnouncedDeviceIds();

    if (deviceIds.has(registrationId) && isNew) {
      console.log('deviceId already found, even tho new');
      registrationId = KeyHelper.generateRegistrationId();
      await this.store.storeLocalRegistrationId(registrationId);
      await this.announce(registrationId, identityKeyPair, true);
      return;
    }

    if (!deviceIds.has(registrationId)) {
      deviceIds.add(registrationId);
      await this.announceDeviceIds(deviceIds);
    }

    const keyBundle = await this.getDeviceKeyBundle(this.client.jid, registrationId);

    if (keyBundle && (OmemoUtils.arrayBufferToBase64String(identityKeyPair.pubKey) !== keyBundle.identityKey)) {
      console.log('Different identityKey on same deviceId', {
        ownKey: OmemoUtils.arrayBufferToBase64String(identityKeyPair.pubKey),
        announcedKey: keyBundle.identityKey
      });
      registrationId = KeyHelper.generateRegistrationId();
      await this.store.storeLocalRegistrationId(registrationId);
      await this.announce(registrationId, identityKeyPair, true);
      return;
    }

    const bundle = await this.refillPreKeys(keyBundle, removePreKey);
    try {
      await this.client.publish(this.client.jid.bare, 'eu.siacs.conversations.axolotl.bundles:' + registrationId, {
        bundle,
      });
    } catch (e) {
      console.log(e);
    }
  }

  async refillPreKeys(keyBundle, removePreKey = null) {
    const identityPair = await this.store.getIdentityKeyPair();

    if (!keyBundle) {
      keyBundle = {
        preKeys: [],
        signedPreKeyPublic: {
          id: ""
        },
      }
    }

    keyBundle.identityKey = OmemoUtils.arrayBufferToBase64String(identityPair.pubKey);

    let highestPreKeyId = keyBundle.preKeys.reduce((a, b) => Math.max(a, b), 1);

    // Remove used keys
    keyBundle.preKeys = keyBundle.preKeys.filter((key) => this.store.loadPreKey(key.id) !== undefined || `${removePreKey}` === `${key.id}`);

    while (keyBundle.preKeys.length < 100) {
      const {keyPair, keyId} = await KeyHelper.generatePreKey(++highestPreKeyId);
      await this.store.storePreKey(keyId, keyPair);
      keyBundle.preKeys.push({
        id: keyId,
        content: OmemoUtils.arrayBufferToBase64String(keyPair.pubKey)
      });
    }

    if (!keyBundle.signedPreKeyPublic.id) {
      let preKeyId;
      if (window.crypto && window.crypto.getRandomValues) {
        const keySpawn = new Uint16Array(1);
        window.crypto.getRandomValues(keySpawn);
        preKeyId = keySpawn[0];
      } else {
        preKeyId = Math.floor(Math.random() * (1 << 16));
      }

      const {keyPair, signature, keyId} = await KeyHelper.generateSignedPreKey(identityPair, preKeyId);
      await this.store.storeSignedPreKey(keyId, keyPair);

      keyBundle.signedPreKeySignature = OmemoUtils.arrayBufferToBase64String(signature);
      keyBundle.signedPreKeyPublic = {
        content: OmemoUtils.arrayBufferToBase64String(keyPair.pubKey),
        id: `${keyId}`
      };


      console.log('Verification', window.globalShit = [identityPair.pubKey, keyPair.pubKey, signature]);
      console.log('Result', Curve.verifySignature(identityPair.pubKey, keyPair.pubKey, signature));
    }

    return keyBundle;
  }

  async getRecipientSessions(recipient) {
    const recipientBareJid = (new JID(recipient)).bare;
    const deviceIds = await this.getAnnouncedDeviceIds(recipient);
    const ownDeviceId = await this.store.getLocalRegistrationId();
    const fetches = Array.from(deviceIds).map(async deviceId => {
      if (`${ownDeviceId}` === `${deviceId}`) {
        return null;
      }

      const address = new OmemoAddress(recipientBareJid, deviceId);
      const session = await this.store.loadSession(address.toString());
      if (session === undefined) {
        const keyBundle = await this.getDeviceKeyBundle(recipientBareJid, deviceId);
        if (!keyBundle) {
          return null;
        }

        const sessionBuilder = new SessionBuilder(this.store, address);

        const preKey = keyBundle.preKeys[Math.floor(Math.random() * keyBundle.preKeys.length)];

        console.info(`Trying to process PreKey[${recipientBareJid}:${preKey.id}]`);

        try {
          await sessionBuilder.processPreKey({
            registrationId: deviceId,
            identityKey: OmemoUtils.base64StringToArrayBuffer(keyBundle.identityKey),
            signedPreKey: {
              keyId: parseInt(keyBundle.signedPreKeyPublic.id, 10),
              publicKey: OmemoUtils.base64StringToArrayBuffer(keyBundle.signedPreKeyPublic.content),
              signature: OmemoUtils.base64StringToArrayBuffer(keyBundle.signedPreKeySignature)
            },
            preKey: {
              keyId: parseInt(preKey.id, 10),
              publicKey: OmemoUtils.base64StringToArrayBuffer(preKey.content),
            }
          });
        } catch (e) {
          console.log(`Failed processing PreKey[${recipientBareJid}:${deviceId}/${preKey.id}]`);
          // Don't add failed session cipher to sessions
          return null;
        }
      }

      return new SessionCipher(this.store, address);
    });

    const sessions = await Promise.all(fetches);

    return sessions.filter(a => null !== a);
  }

  async decryptMessage(message) {
    const header = message.encrypted.header;

    const localDeviceId = await this.store.getLocalRegistrationId();
    const keys = header.keys.filter(key => `${key.rid}` === `${localDeviceId}`);
    const iv = OmemoUtils.base64StringToArrayBuffer(header.iv);
    const payload = OmemoUtils.base64StringToArrayBuffer(message.encrypted.payload);

    for (const key of keys) {
      try {
        const whipser = await this.decryptWhisper(message, key);
        return await this.decryptData(whipser, iv, payload);
      } catch (e) {
        console.warn(`Failed decrypting`, e);
      }
    }

    return null;
  }

  async decryptWhisper(message, key) {
    const whipser = await this.store.getWhisper(message.from.toString(), message.id);

    if (whipser !== undefined) {
      return whipser;
    }

    const address = new OmemoAddress(message.from, message.encrypted.header.sid);
    const session = new SessionCipher(this.store, address);

    let plaintext = null;
    const keyData = OmemoUtils.base64StringToArrayBuffer(key.content);
    if (key.prekey) {
      plaintext = await session.decryptPreKeyWhisperMessage(keyData, 'binary');
    } else {
      plaintext = await session.decryptWhisperMessage(keyData, 'binary');
    }

    await this.store.storeWhisper(message.from.toString(), message.id, plaintext);
    return plaintext;
  }

  async decryptData(keyData, iv, data) {
    const gcmKey = keyData.slice(0, 16);
    const authTag = new Uint8Array(keyData.byteLength - 16);
    authTag.set(new Uint8Array(keyData.slice(16)));

    const subtleKey = await subtleCrypto.importKey("raw", gcmKey, {name: "AES-GCM"}, false, ['decrypt', 'encrypt']);
    const decryptData = new Uint8Array(data.byteLength + authTag.byteLength);

    decryptData.set(new Uint8Array(data));
    decryptData.set(authTag, data.byteLength);

    console.info('Decrypting', {
      iv: OmemoUtils.arrayBufferToBase64String(iv),
      authTag: OmemoUtils.arrayBufferToBase64String(authTag),
      tagLength: authTag.byteLength * 8,
      payload: OmemoUtils.arrayBufferToBase64String(data),
      key: OmemoUtils.arrayBufferToBase64String(gcmKey),
      whisperMessage: OmemoUtils.arrayBufferToBase64String(keyData),
    });

    try {
      return await subtleCrypto.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
          tagLength: authTag.byteLength === 0 ? 128 : authTag.byteLength * 8,
        },
        subtleKey,
        decryptData
      );
    } catch (e) {
      console.error('Failed decrypting data');
      console.error(e.stack);
    }
  };

  async sendMessage({id = undefined, to, from, body, type = 'chat'}) {
    return await this.client.sendMessage({
      id,
      to,
      from,
      type,
      body: '[This message is OMEMO encrypted]',
      store: true,
      encrypted: await this.createMessage(body, [to, (new JID(from)).bare]),
      encryption: {
        namespace: 'eu.siacs.conversations.axolotl',
        name: 'OMEMO',
      }
    });
  }

  async createMessage(plaintext, recipients) {
    const randomSource = new Uint8Array(32);

    await window.crypto.getRandomValues(randomSource);
    const gcmKey = randomSource.slice(0, 16);
    const iv = randomSource.slice(12);

    const subtleKey = await subtleCrypto.importKey("raw", gcmKey, {name: "AES-GCM"}, false, ['decrypt', 'encrypt']);
    const payload = new TextEncoder().encode(plaintext);

    const ciphertextWithAuth = await subtleCrypto.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128,
      },
      subtleKey,
      payload.buffer
    );

    const ciphertext = ciphertextWithAuth.slice(0, ciphertextWithAuth.byteLength - 16);
    const authTag = ciphertextWithAuth.slice(ciphertextWithAuth.byteLength - 16);

    return {
      header: await this.createHeader(gcmKey, authTag, iv, recipients),
      payload: OmemoUtils.arrayBufferToBase64String(ciphertext)
    }
  }

  /**
   * @param {ArrayBuffer} key
   * @param {ArrayBuffer} auth
   * @param {ArrayBuffer} iv
   * @param {Array<string|JID>} recipients
   * @returns {Promise<{iv: string, keys: Array<{ rid: number, content: string }>}>}
   */
  async createHeader(key, auth, iv, recipients) {
    const uniqueRecipients = new Set(recipients.map((jid) => typeof(jid) === 'string' ? jid : jid.bare));

    const encryptedKeys = [];
    const payload = new ArrayBuffer(key.byteLength + auth.byteLength);
    const payloadArr = new Uint8Array(payload);

    const keyByteArr = new Uint8Array(key);
    const authArr = new Uint8Array(auth);

    payloadArr.set(keyByteArr);
    payloadArr.set(authArr, keyByteArr.byteLength);

    for (const recipient of uniqueRecipients) {
      const recipientSessions = await this.getRecipientSessions(recipient);
      for (const recipientSession of recipientSessions) {

        const {type, body} = await recipientSession.encrypt(payload);
        const keyObj = {
          rid: await recipientSession.getRemoteRegistrationId(),
          content: btoa(body),
        };

        if (type === 3) {
          keyObj.prekey = true;
        }

        encryptedKeys.push(keyObj);
      }
    }

    return {
      iv: OmemoUtils.arrayBufferToBase64String(iv),
      keys: encryptedKeys,
      sid: await this.store.getLocalRegistrationId()
    };
  }
}
