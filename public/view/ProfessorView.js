import { AbstractView } from "./AbstractView.js";
import { currentUser } from "../controller/firebase_auth.js";

export class ProfessorView extends AbstractView {
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
    console.log('ProfessorView.onMount() called');
  }

  async updateView() {
    console.log('ProfessorView.updateView() called');
    const viewWrapper = document.createElement('div');
    const response = await fetch('/view/templates/professor.html', { cache: 'no-store' });
    viewWrapper.innerHTML = await response.text();
    return viewWrapper;
  }

  attachEvents() {
    console.log('ProfessorView.attachEvents() called');
    this.setupFormLogic();
  }

  async onLeave() {
    if (!currentUser) {
      this.parentElement.innerHTML = '<h1>Access Denied</h1>';
      return;
    }
    console.log('ProfessorView.onLeave() called');
  }

  setupFormLogic() {
    const departmentSelect = document.getElementById("department");
    const courseNumberSelect = document.getElementById("courseNumber");
    const courseNameSelect = document.getElementById("courseName");
    const uploadBtn = document.getElementById("upload-btn");
    const pdfInput = document.getElementById("pdfFile");
    const uploadForm = document.getElementById("upload-form");

    const courses = {
      CS: [
        { number: "CS5043", name: "Software Engineering" },
        { number: "CS5053", name: "Database Management Systems" },
        { number: "CS5063", name: "Advanced C++" },
        { number: "CS5073", name: "Python Programming" },
      ],
      BA: [
        { number: "BA5043", name: "Data Visualization" },
        { number: "BA5053", name: "Marketing Analysis" },
        { number: "BA5063", name: "Introduction to Business Analytics" },
        { number: "BA5073", name: "Advanced Business Analytics" },
      ],
      CY: [
        { number: "CY5043", name: "Introduction to Cyber Security" },
        { number: "CY5053", name: "Incident Analysis" },
        { number: "CY5063", name: "Network Security" },
      ],
      DS: [
        { number: "DS5043", name: "Data Mining" },
        { number: "DS5053", name: "Algorithms and Design" },
        { number: "DS5063", name: "Data Analysis" },
      ]
    };

    const self = this;

    departmentSelect.addEventListener("change", function () {
      const selectedDept = departmentSelect.value;
      courseNumberSelect.innerHTML = '<option value="">Select Course Number</option>';
      courseNameSelect.innerHTML = '<option value="">Select Course Name</option>';

      if (selectedDept && courses[selectedDept]) {
        courseNumberSelect.disabled = false;
        courseNameSelect.disabled = false;

        for (const course of courses[selectedDept]) {
          const option = document.createElement("option");
          option.value = course.number;
          option.textContent = course.number;
          courseNumberSelect.appendChild(option);

          const optionName = document.createElement("option");
          optionName.value = course.name;
          optionName.textContent = course.name;
          courseNameSelect.appendChild(optionName);
        }
      } else {
        courseNumberSelect.disabled = true;
        courseNameSelect.disabled = true;
      }
    });

    courseNumberSelect.addEventListener("change", function () {
      const selectedNumber = courseNumberSelect.value;
      const selectedDept = departmentSelect.value;

      if (selectedDept && courses[selectedDept]) {
        const course = courses[selectedDept].find(c => c.number === selectedNumber);
        if (course) {
          courseNameSelect.value = course.name;
        }
      }
    });

    courseNameSelect.addEventListener("change", function () {
      const selectedName = courseNameSelect.value;
      const selectedDept = departmentSelect.value;

      if (selectedDept && courses[selectedDept]) {
        const course = courses[selectedDept].find(c => c.name === selectedName);
        if (course) {
          courseNumberSelect.value = course.number;
        }
      }
    });

    pdfInput.addEventListener("change", function (e) {
      uploadBtn.disabled = !pdfInput.files.length;
    });

    uploadForm.addEventListener("submit", function (e) {
      self.controller.onSubmitPDFFile(e);
    });
  }
}
