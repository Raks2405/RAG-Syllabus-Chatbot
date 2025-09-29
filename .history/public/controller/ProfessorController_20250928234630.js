import { startSpinner, stopSpinner } from "../view/util.js";
import { uploadPDFToCloudStorage } from "./cloudstorage_controller.js";
import { uploadPDFListToFirestore } from "./firestore_controller.js";
import { currentUser } from "./firebase_auth.js";

export class ProfessorController {
  constructor() {}

  setView(view) {
    this.view = view;
  }

  async onSubmitPDFFile(e) {
    e.preventDefault();

    const pdfFile = document.getElementById("pdfFile").files[0];
    const department = document.getElementById("department").value;
    const courseNumber = document.getElementById("courseNumber").value;
    const courseName = document.getElementById("courseName").value;

    if (!pdfFile || !department || !courseNumber || !courseName) {
      alert("❌ Please fill all fields and upload a PDF.");
      return;
    }

    startSpinner();
    try {

      const r = await uploadPDFToCloudStorage(pdfFile);
      const pdfUrl = r.pdfURL;

      await uploadPDFListToFirestore({
        department,
        courseNumber,
        courseName,
        professor: currentUser.email,
        fileUrl: pdfUrl,
        timestamp: Date.now()
      });

      stopSpinner();
      alert('✅ Syllabus uploaded successfully!');
      this.view.render();
    } catch (e) {
      stopSpinner();
      console.error("Upload failed ❌", e);
      alert('❌ Error uploading syllabus.');
    }
  }
}




