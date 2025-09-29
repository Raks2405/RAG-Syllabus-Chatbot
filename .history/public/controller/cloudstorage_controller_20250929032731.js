// controller/cloudstorage_controller.js
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { app } from "./firebase_core.js";
import { currentUser } from "./firebase_auth.js";

const storage = getStorage(app);

// Put all PDFs under this top-level folder in Storage
const PDF_FOLDER = "syllabi";

/**
 * Upload a PDF to Cloud Storage and return a *download URL* (usable in the browser)
 * and the storage path (good to keep for maintenance/migration).
 *
 * @param {File|Blob} pdfFile                  The PDF file from <input type="file">
 * @param {{department?:string, courseNumber?:string}} [meta]
 * @returns {Promise<{downloadUrl:string, storagePath:string, fileName:string}>}
 */
export async function uploadPDFToCloudStorage(pdfFile, meta = {}) {
  if (!currentUser) {
    throw new Error("User not logged in!");
  }
  if (!pdfFile) {
    throw new Error("No PDF file provided");
  }

  const { department = "misc", courseNumber = "unknown" } = meta;

  // unique-ish name; force .pdf extension
  const fileName =
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.pdf`;

  // Example path: syllabi/CS/CS5063/<uid>/<fileName>.pdf
  const storagePath = `${PDF_FOLDER}/${department}/${courseNumber}/${currentUser.uid}/${fileName}`;
  const storageRef = ref(storage, storagePath);

  // Make sure contentType is set so browsers treat it as a PDF
  const metadata = { contentType: pdfFile.type || "application/pdf" };

  await uploadBytes(storageRef, pdfFile, metadata);

  // >>> THIS is the public-ish URL you must store in Firestore
  const downloadUrl = await getDownloadURL(storageRef);

  return { downloadUrl, storagePath, fileName };
}
