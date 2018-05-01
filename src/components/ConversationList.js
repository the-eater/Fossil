import React, {Component} from 'react'
import {ConversationItem} from "./ConversationItem";
import FontAwesomeIcon from "@fortawesome/react-fontawesome";
import NewConversationModal from "./NewConversationModal";

export class ConversationList extends Component {
  constructor(props) {
    super(props);

    this.onSelect = props.onSelect;
  }

  handleSelect(convoId) {
    this.onSelect && this.onSelect(convoId);
  }

  render() {
    return <div className="conversation-list">
      <NewConversationModal ref={a => this.newConvoModal = a} fossil={this.props.fossil}/>
      <div onClick={() => this.newConvoModal.open()} className="new-conversation">
        <FontAwesomeIcon icon="plus"/> New conversation
      </div>
      <div className="conversations">
        {this.props.conversations.map(convo => <ConversationItem conversation={convo}
                                                                 onClick={() => this.handleSelect(convo.getId())}
                                                                 active={convo.id === this.props.active}
                                                                 key={`convo/${convo.getId()}`}/>)}
      </div>
    </div>
  }
}