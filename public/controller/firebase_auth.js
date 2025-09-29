import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
  } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
  
  import { app } from './firebase_core.js';
  import { router } from "./app.js"; 
  import { studentRouter } from "./app.js"; 
  
  const auth = getAuth(app);
  
  export let currentUser = null;
  
  export async function loginFirebase(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }
  
  export async function logoutFirebase() {
    await signOut(auth);
  }
  

  onAuthStateChanged(auth, user => {
    currentUser = user;
    const loginDiv = document.getElementById('loginDiv');
    const navMenu = document.getElementById('navMenuContainer');
    const spaRoot = document.getElementById('spaRoot');
  
    if (user) {
      console.log("AuthStateChanged: User logged in", user.email);
      loginDiv.classList.replace('d-block', 'd-none');
      navMenu.classList.replace('d-none', 'd-block');
      spaRoot.classList.replace('d-none', 'd-block');
      router.navigate(window.location.pathname);
    } else {
      console.log("AuthStateChanged: User logged out");
      loginDiv.classList.replace('d-none', 'd-block');
      navMenu.classList.replace('d-block', 'd-none');
      spaRoot.classList.replace('d-block', 'd-none');
      router.currentView = null;
      spaRoot.innerHTML = '';
    }
  });
  