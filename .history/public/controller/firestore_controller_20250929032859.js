import {
    getFirestore,
    collection,
    addDoc,
    query,
    getDocs,
    orderBy,
  } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
  
  import { app } from "./firebase_core.js";
  
  const db = getFirestore(app);
  
  const PDF_COLLECTION = 'pdfs';
  
  export async function uploadPDFListToFirestore(pdfModel) {
    const collRef = collection(db, PDF_COLLECTION);
    const docRef = await addDoc(collRef, pdfModel);
    return docRef.id;
  }
  
  export async function getSyllabiFromFirestore() {
    const collRef = collection(db, PDF_COLLECTION);
    const q = query(collRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
  
    const syllabiList = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      data.docId = docSnap.id;
      syllabiList.push(data);
    });
  
    return syllabiList;
  }
  