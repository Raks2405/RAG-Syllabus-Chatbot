import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

import { app } from "./firebase_core.js";
import { currentUser } from "./firebase_auth.js";

const storage = getStorage(app);
const PDF_FOLDER = 'pdf_folder';

export async function uploadPDFToCloudStorage(pdfFile) {
    if (!currentUser) {
        throw new Error("User not logged in!");
    }
    let pdfName = '' + Date.now() + Math.random();
    pdfName = pdfName.replace(',', '-');

    const pdfPath = `${PDF_FOLDER}/${currentUser.uid}/${pdfName}`;
    const storageRef = ref(storage, pdfPath);
    const snapShot = await uploadBytes(storageRef, pdfFile);
    const pdfURL = await getDownloadURL(snapShot.ref);

    return { pdfName, pdfURL };
}
