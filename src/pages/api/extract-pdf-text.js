// pages/api/extract-pdf-text.js
import * as pdfjs from 'pdfjs-dist';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { pdfContent } = req.body;
        
        if (!pdfContent) {
            return res.status(400).json({ error: 'Missing PDF content' });
        }

        // Convert base64 to ArrayBuffer if needed
        let pdfBuffer;
        if (typeof pdfContent === 'string') {
            // Assuming the content is base64 encoded
            pdfBuffer = Buffer.from(pdfContent, 'base64');
        } else {
            pdfBuffer = pdfContent;
        }

        // Load and parse the PDF document
        const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
        const pdfDocument = await loadingTask.promise;
        
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const textItems = textContent.items.map(item => item.str);
            fullText += textItems.join(' ') + '\n';
        }

        return res.status(200).json({ text: fullText });
    } catch (error) {
        console.error('Error extracting text from PDF:', error);
        return res.status(500).json({ error: `Error extracting PDF text: ${error.message}` });
    }
}