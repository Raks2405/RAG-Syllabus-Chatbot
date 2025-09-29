import { AbstractView } from "./AbstractView.js";
import { currentUser } from "../controller/firebase_auth.js";

export class BrowseView extends AbstractView {
    controller = null;

    constructor(controller) {
        super();
        this.controller = controller;
    }

    async onMount() {
        if (!currentUser) {
            this.parentElement.innerHTML = '<h1>Access Denied</h1>';
            return;
        }
        console.log('BrowseView.onMount() called');
    }

    async updateView() {
        console.log('BrowseView.updateView() called');
        const viewWrapper = document.createElement('div');
        const response = await fetch('/view/templates/browse.html', { cache: 'no-store' });
        viewWrapper.innerHTML = await response.text();
        return viewWrapper;
    }

    async attachEvents() {
        console.log('BrowseView.attachEvents() called');
        await this.controller.loadSyllabi();  
    }

    renderSyllabiList() {
        const listContainer = document.getElementById("syllabilist");
        if (!listContainer) {
            console.error("syllabilist container not found");
            return;
        }

        console.log('Rendering syllabi list:', this.controller.model.syllabiList);
        listContainer.innerHTML = "";

        if (this.controller.model.syllabiList.length === 0) {
            listContainer.innerHTML = "<p class='text-center'>No syllabi uploaded yet.</p>";
            return;
        }

        for (const syllabus of this.controller.model.syllabiList) {
            const div = document.createElement("div");
            div.className = "card mb-3";
            div.innerHTML = `
              <div class="card-body">
                  <h5 class="card-title">${syllabus.courseNumber} - ${syllabus.courseName}</h5>
                  <p class="card-text">${syllabus.department}</p>
                  <a href="${syllabus.pdfUrl}" target="_blank" class="btn btn-primary">View PDF</a>
              </div>
            `;
            listContainer.appendChild(div);
        }
    }

    async onLeave() {
        if (!currentUser) {
            this.parentElement.innerHTML = '<h1>Access Denied</h1>';
            return;
        }
        console.log('BrowseView.onLeave() called');
    }
}
