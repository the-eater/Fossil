import ReactModal from 'react-modal';
import React, {Component} from 'react';

export class FossilModal extends Component {
  render() {
    const props = {
      overlayClassName: 'modal-overlay',
      className: 'modal-content',
      bodyOpenClassName: 'modal-body-open',
      htmlOpenClassName: 'modal-html-open',
      portalClassName: 'modal-portal'
    };

    return <ReactModal {...props} {...this.props} className={"modal-content " + (this.props.className||"")}>{this.props.children}</ReactModal>
  }
}