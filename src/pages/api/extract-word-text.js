// pages/api/extract-word-text.js
import mammoth from 'mammoth';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { wordContent } = req.body;
        
        if (!wordContent) {
            return res.status(400).json({ error: 'Missing Word document content' });
        }

        // Convert base64 to Buffer if needed
        let docBuffer;
        if (typeof wordContent === 'string') {
            // Assuming the content is base64 encoded
            docBuffer = Buffer.from(wordContent, 'base64');
        } else {
            docBuffer = wordContent;
        }

        // Extract text from Word document
        const result = await mammoth.extractRawText({ 
            buffer: docBuffer 
        });

        return res.status(200).json({ text: result.value });
    } catch (error) {
        console.error('Error extracting text from Word document:', error);
        return res.status(500).json({ error: `Error extracting Word text: ${error.message}` });
    }
}