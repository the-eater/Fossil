import React, {Component} from 'react';
import FontAwesomeIcon from '@fortawesome/react-fontawesome';

export class Composer extends Component {
  constructor(props) {
    super(props);

    this.chat = props.chat;
    this.state = {
      hoverEncryption: false,
    };
  }

  onTextInput(e) {
    if (e.keyCode === 13 && !e.shiftKey) {
      this.chat.sendMessage(this.textInput.value);
      this.textInput.value = "";
    }
  }

  render() {
    return (
      <div className="composer">
        <div className="text-input">
          <input onInput={this.onTextInput.bind(this)} ref={a => this.textInput = a} type="text"/>
        </div>
        <div onMouseEnter={() => this.setState({hoverEncryption: true})}
             onMouseLeave={() => this.setState({hoverEncryption: false})}
             className="encryption-switch">
          {this.chat.omemoEnabled !== this.state.hoverEncryption ? (
            <FontAwesomeIcon icon='lock'/>
          ) : (
            <FontAwesomeIcon icon='lock-open'/>
          )}
        </div>
      </div>
    )
  }
}