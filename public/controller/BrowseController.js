import { BrowseModel } from "../model/BrowseModel.js";
import { getSyllabiFromFirestore } from "./firestore_controller.js";

export class BrowseController {
  constructor() {
    this.model = new BrowseModel();
  }

  setView(view) {
    this.view = view;
  }

  async loadSyllabi() {
    try {
      const syllabi = await getSyllabiFromFirestore();
      console.log('Fetched syllabi:', syllabi);
      this.model.setSyllabiList(syllabi);
      
      this.view.renderSyllabiList(); 
    } catch (error) {
      console.error("Failed to load syllabi:", error);
      alert("Error loading syllabi");
    }
  }
}
