import { currentUser } from "../controller/firebase_auth.js";


export class AbstractView {
  parentElement = document.getElementById('spaRoot');

  constructor() {
    if (new.target == AbstractView) {
      throw new Error('Cannot instantiate AbstractView directly');
    }
  }

  async onMount() {
    throw new Error('onMount method must be implemented');
  }

  async render() {

    if (!this.isPublicView() && !currentUser) {
      this.parentElement.innerHTML = '<h1>Access Denied</h1>';
      return;
    }
    this.parentElement.innerHTML = '';

    const elements = await this.updateView();
    this.parentElement.append(elements);

    this.attachEvents();
  }

  async updateView() {
    throw new Error('updateView method must be implemented');
  }

  attachEvents() {
    throw new Error('attachEvents method must be implemented');
  }

  async onLeave() {
    throw new Error('onLeave method must be implemented');
  }

  isPublicView() {
    return false;
  }
}
