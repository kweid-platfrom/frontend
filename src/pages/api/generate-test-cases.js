export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ message: 'Method not allowed' });
        }

        const { prompt, requirements, numberOfCases, requirementId } = req.body;
        
        if (!prompt) {
            return res.status(400).json({ message: 'Prompt is required' });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ message: 'API key not configured' });
        }

        // Build the message to send to OpenAI
        const messages = [
            {
                role: "system",
                content: "You are a QA specialist that helps generate comprehensive test cases based on requirements. Format your response as valid JSON with a 'testCases' array containing objects with fields: 'title', 'description', 'steps', 'expectedResult', 'tags', 'priority'."
            },
            {
                role: "user",
                content: `Generate ${numberOfCases} test cases for the following requirement: ${prompt}${requirements ? `\n\nContext from existing requirements: ${requirements}` : ''}`
            }
        ];

        // Add retry logic with exponential backoff
        let retries = 0;
        const maxRetries = 3;
        let openaiRes;
        let waitTime = 1000; // Start with 1 second

        while (retries <= maxRetries) {
            openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo',
                    messages: messages,
                    response_format: { type: "json_object" } // Ensure we get a JSON response
                }),
            });

            // If the request succeeded or we get an error other than rate limiting, break from the loop
            if (openaiRes.ok || openaiRes.status !== 429) {
                break;
            }
            
            // If we've hit the max retries, break and return the error
            if (retries === maxRetries) {
                break;
            }

            // Wait with exponential backoff before retrying
            console.log(`Rate limited. Waiting ${waitTime}ms before retry ${retries + 1}/${maxRetries}`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            waitTime *= 2; // Exponential backoff
            retries++;
        }

        // Handle rate limit error after all retries
        if (openaiRes.status === 429) {
            console.error("Rate limit exceeded after retries");
            return res.status(429).json({ 
                message: 'Rate limit exceeded. Please try again later or reduce the number of test cases requested.',
            });
        }

        // Handle other errors
        if (!openaiRes.ok) {
            const errorData = await openaiRes.json().catch(() => ({}));
            console.error("OpenAI API error:", errorData);
            return res.status(openaiRes.status).json({ 
                message: 'Error from AI service',
                details: errorData
            });
        }

        const data = await openaiRes.json();
        
        // Parse the response content from OpenAI
        try {
            // The response is typically in data.choices[0].message.content
            const content = data.choices[0].message.content;
            const parsedContent = JSON.parse(content);

            // Ensure we have the expected format with testCases array
            if (!parsedContent.testCases || !Array.isArray(parsedContent.testCases)) {
                throw new Error('Invalid response structure from AI');
            }

            // Add requirementId to each test case if provided
            if (requirementId) {
                parsedContent.testCases.forEach(testCase => {
                    testCase.requirementId = requirementId;
                });
            }

            return res.status(200).json(parsedContent);
        } catch (parseError) {
            console.error("Error parsing AI response:", parseError);
            return res.status(500).json({ 
                message: 'Failed to parse AI response',
                rawResponse: data.choices?.[0]?.message?.content || 'No content received'
            });
        }
    } catch (error) {
        console.error("Server error:", error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}