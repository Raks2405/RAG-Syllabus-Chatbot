// controller/firestore_controller.js
import {
  getFirestore,
  collection,
  addDoc,
  query,
  getDocs,
  orderBy,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import { app } from "./firebase_core.js";

const db = getFirestore(app);

// You already use this name in your code
const PDF_COLLECTION = "pdfs";

/**
 * (Legacy) Keeps your existing API if other code calls this.
 * Make sure the pdfModel you pass includes a *fileUrl* string.
 */
export async function uploadPDFListToFirestore(pdfModel) {
  const collRef = collection(db, PDF_COLLECTION);
  const docRef = await addDoc(collRef, pdfModel);
  return docRef.id;
}

/**
 * New: a small helper to save a syllabus doc in the shape your StudentView expects.
 * Call this after you upload the PDF and get its downloadUrl.
 *
 * @param {{
 *   department: string,
 *   courseNumber: string,
 *   courseName: string,
 *   downloadUrl: string,
 *   storagePath?: string
 * }} params
 */
export async function saveSyllabusDoc({
  department,
  courseNumber,
  courseName,
  downloadUrl,
  storagePath = "",
}) {
  const collRef = collection(db, PDF_COLLECTION);

  const model = {
    department,
    courseNumber,
    courseName,
    fileUrl: downloadUrl,      // <-- CRITICAL: real download URL
    storagePath,               // optional but useful to keep
    timestamp: serverTimestamp(),
  };

  const docRef = await addDoc(collRef, model);
  return docRef.id;
}

export async function getSyllabiFromFirestore() {
  const collRef = collection(db, PDF_COLLECTION);
  const q = query(collRef, orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);

  const syllabiList = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    data.docId = docSnap.id;
    syllabiList.push(data);
  });

  return syllabiList;
}
