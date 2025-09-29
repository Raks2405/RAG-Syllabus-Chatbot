// NOTE: This file must be deployed as a Firebase Cloud Function.

const functions = require('firebase-functions');
const axios = require('axios');
const pdf = require('pdf-parse'); 

// Set the region as needed (default is usually fine)
exports.extractSyllabusText = functions.https.onRequest(async (req, res) => {
    // 1. Enforce CORS rules for browser access
    res.set('Access-Control-Allow-Origin', '*'); // Allow all origins for simplicity
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight requests (OPTIONS method)
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }
    
    // Check if the request body is valid
    if (!req.body || !req.body.pdfUrl) {
        res.status(400).json({ error: 'PDF URL is required in the request body.' });
        return;
    }
    
    const pdfUrl = req.body.pdfUrl;

    try {
        console.log(`Cloud Function: Starting download of PDF from: ${pdfUrl}`);
        
        // 2. Download the PDF file directly from the Firebase URL (Server-to-Server)
        const response = await axios.get(pdfUrl, {
            responseType: 'arraybuffer' 
        });
        
        const pdfBuffer = Buffer.from(response.data);

        // 3. Extract text using pdf-parse
        const data = await pdf(pdfBuffer);
        
        console.log("Cloud Function: Text extraction successful.");
        
        // 4. Send the clean, extracted text back to the client
        res.status(200).json({ text: data.text });
        
    } catch (error) {
        console.error("Cloud Function PDF Extraction Error:", error.message);
        res.status(500).json({ error: `Failed to extract text from PDF on the server. Details: ${error.message}` });
    }
});