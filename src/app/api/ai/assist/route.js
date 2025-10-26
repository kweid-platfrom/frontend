// app/api/ai/assist/route.js
// Next.js API Route for AI Document Assistant

import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { messages, documentContent, documentTitle, documentType, action } = await request.json();

    // Strip HTML tags from document content for cleaner context
    const stripHtml = (html) => {
      return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
    };

    const cleanContent = stripHtml(documentContent);

    // Build system prompt
    const systemPrompt = `You are an expert AI writing assistant specializing in ${documentType || 'professional'} documents.

Current Document: "${documentTitle || 'Untitled'}"
Document Type: ${documentType || 'General'}

${cleanContent ? `Current Content (first 2000 chars):\n${cleanContent.substring(0, 2000)}` : 'Document is empty.'}

Your capabilities:
- Summarize documents concisely
- Explain complex concepts in simple terms
- Improve writing clarity, grammar, and professionalism
- Generate new content with proper structure
- Create test plans, strategies, requirements, specifications
- Format content as HTML for rich text editors

When generating content to be inserted:
- Use proper HTML tags: <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <strong>, <em>
- Structure content appropriately for the document type
- Be professional and clear
- For test plans: include objectives, scope, strategy, timeline
- For requirements: use numbered items with clear descriptions
- For test strategies: include approach, tools, metrics`;

    // Determine if this is a content generation request
    const isGenerationRequest = 
      action.toLowerCase().includes('generate') ||
      action.toLowerCase().includes('create') ||
      action.toLowerCase().includes('write') ||
      action.toLowerCase().includes('improve') ||
      action.toLowerCase().includes('bullet') ||
      action.toLowerCase().includes('format');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Extract HTML content if present
    let generatedContent = null;
    if (isGenerationRequest) {
      // Check if response contains HTML
      if (aiResponse.includes('<') && aiResponse.includes('>')) {
        // Extract HTML blocks
        const htmlMatch = aiResponse.match(/<(?:html|div|p|h[1-6]|ul|ol|table)[\s\S]*?<\/(?:html|div|p|h[1-6]|ul|ol|table)>/i);
        if (htmlMatch) {
          generatedContent = htmlMatch[0];
        } else {
          // Wrap in paragraph if HTML tags present but no block found
          generatedContent = aiResponse;
        }
      } else {
        // Convert plain text to HTML paragraphs
        const paragraphs = aiResponse.split('\n\n')
          .filter(p => p.trim())
          .map(p => `<p>${p.trim()}</p>`)
          .join('\n');
        generatedContent = paragraphs;
      }
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      hasContent: isGenerationRequest && !!generatedContent,
      generatedContent: generatedContent
    });

  } catch (error) {
    console.error('AI Assistant API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process AI request'
    }, { status: 500 });
  }
}

// Alternative implementation using Anthropic Claude
export async function POST_ANTHROPIC_VERSION(request) {
  try {
    const { messages, documentContent, documentTitle, documentType, action } = await request.json();

    const stripHtml = (html) => {
      return html?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() || '';
    };

    const cleanContent = stripHtml(documentContent);

    const systemPrompt = `You are an expert AI writing assistant for ${documentType || 'professional'} documents.

Document: "${documentTitle || 'Untitled'}"
Type: ${documentType || 'General'}
Content: ${cleanContent ? cleanContent.substring(0, 2000) : 'Empty'}

Help with: summarizing, explaining, improving, generating, formatting content as HTML.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: systemPrompt,
        messages: messages.map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Anthropic API request failed');
    }

    const data = await response.json();
    const aiResponse = data.content[0].text;

    const isGenerationRequest = 
      action.toLowerCase().includes('generate') ||
      action.toLowerCase().includes('create') ||
      action.toLowerCase().includes('improve');

    let generatedContent = null;
    if (isGenerationRequest && aiResponse.includes('<')) {
      const htmlMatch = aiResponse.match(/<(?:html|div|p|h[1-6]|ul|ol|table)[\s\S]*?<\/(?:html|div|p|h[1-6]|ul|ol|table)>/i);
      generatedContent = htmlMatch ? htmlMatch[0] : aiResponse;
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      hasContent: isGenerationRequest && !!generatedContent,
      generatedContent: generatedContent
    });

  } catch (error) {
    console.error('AI Assistant API Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process AI request'
    }, { status: 500 });
  }
}
