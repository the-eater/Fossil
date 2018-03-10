import React, {Component, Fragment} from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import moment from 'moment'

export class Message extends Component {
  render() {
    const messageObj = this.props.message;
    const message = messageObj.message;

    // Should silently discard failed decryption
    // also solves the issue where it jumps from the "this is an OMEMO message"
    // to the decrypted message
    if (message.encrypted && !messageObj.encrypted) {
      return null;
    }

    return <div className={"message-row " + (this.props.isSelf ? ' self right' : ' left')}>
      <div className="message">
        <div className="body">
          {messageObj.body}
        </div>
        <div className="status">
          {moment(messageObj.date).fromNow()}
          <FontAwesomeIcon icon={messageObj.encrypted ? 'lock' : 'lock-open'} className="sec-icon"/>
        </div>
      </div>
    </div>
  }
}