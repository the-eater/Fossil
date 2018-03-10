export default function hints(client, stanzas) {
  const NS = 'urn:xmpp:hints';


  const hints = [
    ['store', 'store'],
    ['no-copy', 'noCopy'],
    ['no-store', 'noStore'],
    ['no-permanent-store', 'noPermanentStore'],
  ];

  stanzas.withMessage((Message) => {
    hints.forEach(([elementName, fieldName]) => {
      stanzas.add(Message, fieldName, {
        get: function () {
          return this.xml.getChildren(elementName, NS).length > 0;
        },
        set: function (shouldStore) {
          if (shouldStore === this[fieldName]) {
            return;
          }

          this.xml.remove(elementName, NS);

          if (shouldStore) {
            this.xml.c(elementName, {xmlns: NS});
          }
        }
      });
    })
  })
}