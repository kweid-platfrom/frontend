import { processDocument } from '../../utils/documentProcessor';
import { Buffer } from 'buffer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let { fileContent, fileName, fileType } = req.body;

        if (!fileContent || !fileName) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        // 🔍 Safely convert to string if it's not already
        if (typeof fileContent !== 'string') {
            fileContent = String(fileContent);
        }

        let documentText = fileContent;

        // 🧠 Decode base64 if needed
        if (fileContent.startsWith('data:')) {
            const base64Data = fileContent.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            if (fileType === 'text/plain') {
                documentText = buffer.toString('utf-8');
            } else {
                return res.status(415).json({ error: 'Unsupported file type for parsing' });
            }
        }

        const result = await processDocument(documentText, fileName);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Error extracting requirements:', error);
        return res.status(500).json({ error: `Error processing document: ${error.message}` });
    }
}
