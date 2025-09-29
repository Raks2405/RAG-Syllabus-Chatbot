import { startSpinner, stopSpinner } from "../view/util.js";
import { uploadPDFToCloudStorage } from "./cloudstorage_controller.js";
import { saveSyllabusDoc } from "./firestore_controller.js";
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

    if (!currentUser) {
      alert("❌ You must be logged in to upload.");
      return;
    }

    startSpinner();
    try {
      // 1) Upload the PDF to Storage and get a real download URL
      const { downloadUrl, storagePath } = await uploadPDFToCloudStorage(pdfFile, {
        department,
        courseNumber,
      });

      // 2) Save the syllabus record to Firestore in the shape the StudentView expects
      await saveSyllabusDoc({
        department,
        courseNumber,
        courseName,
        downloadUrl,   // will be stored as fileUrl
        storagePath,   // optional but useful to keep
      });

      stopSpinner();
      alert("✅ Syllabus uploaded successfully!");
      this.view.render();
    } catch (e) {
      stopSpinner();
      console.error("Upload failed ❌", e);
      alert("❌ Error uploading syllabus.");
    }
  }
}
