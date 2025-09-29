
import { ProfessorView } from "../view/ProfessorView.js";
import { ProfessorController } from "./ProfessorController.js";
import { BrowseView } from "../view/BrowseView.js";
import { BrowseController } from "./BrowseController.js";
import { StudentView } from "../view/StudentView.js";
import { StudentController } from "./StudentController.js";
import { Router } from "./Router.js";
import { loginFirebase, logoutFirebase } from "./firebase_auth.js";
import { startSpinner, stopSpinner } from "../view/util.js";
document.getElementById("appHeader").textContent="Syllabus Chatbot";
document.title = "Syllabus Chatbot";

const routes = [
  {path: "/", view:ProfessorView, controller:ProfessorController },
  {path: "/browsePDF", view:BrowseView, controller:BrowseController },
];
const studentRoutes = [
  { path: "/student", view:StudentView, controller:StudentController },
];

export const router = new Router(routes);
export const studentRouter = new Router(studentRoutes);


router.navigate(window.location.pathname);
const menuItems = document.querySelectorAll("a[data-path]");
menuItems.forEach((item) => {
  item.onclick = () => router.navigate(item.getAttribute("data-path"));
});


const studentLoginBtn = document.getElementById("studentLogin");
if (studentLoginBtn) {
  studentLoginBtn.addEventListener("click", () => {
    document.getElementById("loginDiv").classList.add("d-none");
    document.getElementById("navMenuContainer").classList.add("d-none");
    document.getElementById("spaRoot").classList.remove("d-none");
    studentRouter.navigate("/student");
  });
}


const loginForm = document.forms.loginForm;
if (loginForm) {
  loginForm.onsubmit = async (e) => {
    e.preventDefault();
    startSpinner();
    try {
      await loginFirebase(e.target.email.value, e.target.password.value);
      stopSpinner();
    } catch (err) {
      stopSpinner();
      alert(`Sign in failed: ${err.message}`);
    }
  };
}


const logoutBtn = document.getElementById("logoutButton");
if (logoutBtn) {
  logoutBtn.onclick = async () => {
    startSpinner();
    try {
      await logoutFirebase();
      stopSpinner();
      router.navigate("/");
    } catch (err) {
      stopSpinner();
      alert(`Logout failed: ${err.message}`);
    }
  };
}