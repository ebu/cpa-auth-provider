/* globals window document */
import React, {Component} from 'react';

const REQUEST_ID = 4;
const TRACKING_PROVIDER_FRAME_ID = 'tp0';

export default class LoginTest extends Component {
	constructor(props) {
		super(props);
	}

	componentDidMount() {
		window.addEventListener('message', this.handlePostMessage);
	}

	componentWillUnmount() {
		window.removeEventListener('message', this.handlePostMessage);
	}

	static getTpServer() {
		let element = document.querySelector('meta[property="x-tp-server"]');
		return element ? element.getAttribute('content') : '';
	}

	handlePostMessage = event => {
		let origin = event.origin || event.originalEvent.origin;
		if (origin != this.getTpServer()) {
			// console.log('bad source');
			return;
		}

		let type = event.data.e;
		let number = event.data.k;
		if (type == 'tp-ready') {
			this.requestUid();
		} else if (type == 'uid-reply' && number == REQUEST_ID) {
			let uid = event.data.uid;
		}
	};

	requestUid() {
		let frame = document.getElementById(TRACKING_PROVIDER_FRAME_ID);
		frame.contentWindow.postMessage({e: 'request-uid', k: REQUEST_ID}, this.getTpServer());
	}

	render() {
		return (
			<div>
				<iframe id={TRACKING_PROVIDER_FRAME_ID} src={this.getTpServer() + '/track/tp.html'} style={{display: 'none'}}></iframe>
			</div>
		);
	}
}
