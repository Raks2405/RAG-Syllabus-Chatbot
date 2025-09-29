import { StudentModel } from "../model/StudentModel.js";
import { getSyllabiFromFirestore } from "./firestore_controller.js";

export class StudentController {
  constructor() {
    this.model = new StudentModel();
  }

  setView(view) {
    this.view = view;
  }

  async onSubmitStudentForm() {
    const department = document.getElementById("department").value;
    const courseNumber = document.getElementById("courseNumber").value;
    const courseName = document.getElementById("courseName").value;

    if (!department || !courseNumber || !courseName) {
      alert("❌ Please fill all fields.");
      return;
    }

    this.model.setDetails({ department, courseNumber, courseName });

    const syllabi = await getSyllabiFromFirestore();

    const filtered = syllabi.filter(
      (pdf) =>
        pdf.department === this.model.department &&
        pdf.courseNumber === this.model.courseNumber &&
        pdf.courseName === this.model.courseName
    );

    this.view.renderSyllabiList(filtered);
  }
}
