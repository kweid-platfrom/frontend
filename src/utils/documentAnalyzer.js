// utils/documentAnalyzer.js
import natural from 'natural';
import { keywordExtractor } from 'keyword-extractor';

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const TfIdf = natural.TfIdf;

/**
 * Advanced document analyzer that uses NLP techniques to extract requirements
 * @param {string} documentText - Document content
 * @returns {Object} - Extracted information
 */
export async function analyzeDocument(documentText) {
    // Split document into sections
    const sections = splitIntoSections(documentText);

    // Extract potential requirement sections
    const requirementSections = identifyRequirementSections(sections);

    // Extract structured requirements
    const extractedRequirements = extractStructuredRequirements(requirementSections, documentText);

    // Extract dependencies between requirements
    const requirementsWithDependencies = identifyDependencies(extractedRequirements);

    // Categorize requirements
    const categorizedRequirements = categorizeRequirements(requirementsWithDependencies);

    return {
        requirements: categorizedRequirements,
        metadata: extractDocumentMetadata(documentText),
        statistics: generateStatistics(categorizedRequirements)
    };
}

/**
 * Split document text into logical sections
 * @param {string} text - Document content
 * @returns {Array} - Array of document sections
 */
function splitIntoSections(text) {
    // First try to split by headers (identified by common header patterns)
    const headerPattern = /(?:^|\n)(?:\d+\.|\d+\.\d+\s+|[A-Z][A-Za-z\s]+:|\[\w+\]|#\s+|##\s+|###\s+)/g;
    let matches = [...text.matchAll(headerPattern)];

    if (matches.length > 1) {
        // We found headers, split by them
        const sections = [];
        for (let i = 0; i < matches.length; i++) {
            const startIndex = matches[i].index;
            const endIndex = (i < matches.length - 1) ? matches[i + 1].index : text.length;
            sections.push(text.substring(startIndex, endIndex).trim());
        }
        return sections;
    }

    // If no headers found, split by double newlines (paragraphs)
    return text.split(/\n\s*\n/).filter(section => section.trim().length > 0);
}

/**
 * Identify sections that likely contain requirements
 * @param {Array} sections - Document sections
 * @returns {Array} - Sections containing requirements
 */
function identifyRequirementSections(sections) {
    // Keywords that indicate requirement sections
    const requirementKeywords = [
        'requirement', 'requirements', 'feature', 'features', 'specification',
        'specifications', 'functional', 'non-functional', 'user story', 'user stories',
        'must', 'shall', 'should', 'will', 'needs to', 'ability to'
    ];

    // Filter sections that contain requirement indicators
    return sections.filter(section => {
        const lowerSection = section.toLowerCase();

        // Check for requirement keywords
        const hasRequirementKeyword = requirementKeywords.some(keyword =>
            lowerSection.includes(keyword)
        );

        // Check for numbered/bulleted lists
        const hasNumberedList = /^\s*(\d+\.|\[\d+\]|\(\d+\))/m.test(section);
        const hasBulletList = /^\s*[\-\*•]/m.test(section);

        // Check for "shall/should/must" statements
        const hasMandatoryStatement = /\b(shall|should|must|will)\b/i.test(lowerSection);

        return hasRequirementKeyword || hasNumberedList || hasBulletList || hasMandatoryStatement;
    });
}

/**
 * Extract structured requirements from identified sections
 * @param {Array} sections - Sections containing requirements
 * @param {string} fullText - Complete document text for context
 * @returns {Array} - Structured requirement objects
 */
function extractStructuredRequirements(sections, fullText) {
    const requirements = [];
    let requirementId = 1;

    // Process each section
    sections.forEach(section => {
        // Look for individual requirements within the section
        const requirementPatterns = [
            // Pattern for numbered requirements
            /^\s*(\d+\.|\[\d+\]|\(\d+\))\s*([^\n]+)(?:\n([\s\S]*?)(?=^\s*(?:\d+\.|\[\d+\]|\(\d+\))|$))?/gm,
            // Pattern for bulleted requirements
            /^\s*([\-\*•])\s*([^\n]+)(?:\n([\s\S]*?)(?=^\s*[\-\*•]|$))?/gm,
            // Pattern for "shall/should/must" statements
            /([^.\n]+(?:\b(?:shall|should|must|will)\b)[^.\n]+\.)/g
        ];

        // Try different patterns to extract requirements
        for (const pattern of requirementPatterns) {
            let match;
            while ((match = pattern.exec(section)) !== null) {
                let title, description;

                if (match.length >= 3) {
                    // For numbered or bulleted patterns
                    title = match[2].trim();
                    description = match[3] ? match[3].trim() : title;
                } else {
                    // For shall/should/must statements
                    title = match[1].trim();
                    description = title;
                }

                // Skip if too short to be a meaningful requirement
                if (title.length < 5) continue;

                requirements.push({
                    id: `REQ-${requirementId++}`,
                    title,
                    description,
                    priority: determinePriority(title, description),
                    type: determineRequirementType(title, description),
                    source: 'Document Analysis',
                    stakeholders: extractStakeholders(title, description, fullText)
                });
            }
        }
    });

    return requirements;
}

/**
 * Determine priority of a requirement based on text analysis
 * @param {string} title - Requirement title
 * @param {string} description - Requirement description
 * @returns {string} - Priority level
 */
function determinePriority(title, description) {
    const combinedText = `${title} ${description}`.toLowerCase();

    // High priority indicators
    if (/\b(critical|highest|must|essential|mandatory|required|crucial|necessary)\b/i.test(combinedText)) {
        return "High";
    }

    // Low priority indicators
    if (/\b(may|could|nice to have|optional|if possible|consider|future|enhancement)\b/i.test(combinedText)) {
        return "Low";
    }

    // Medium is default
    return "Medium";
}

/**
 * Determine the type of requirement
 * @param {string} title - Requirement title
 * @param {string} description - Requirement description
 * @returns {string} - Requirement type
 */
function determineRequirementType(title, description) {
    const combinedText = `${title} ${description}`.toLowerCase();

    // Functional requirement indicators
    if (/\b(function|feature|capability|ability|operation|action|process)\b/i.test(combinedText)) {
        return "Functional";
    }

    // Performance requirement indicators
    if (/\b(performance|speed|response time|latency|throughput|capacity|resource|memory|cpu|fast|slow)\b/i.test(combinedText)) {
        return "Performance";
    }

    // Security requirement indicators
    if (/\b(security|authentication|authorization|encrypt|hash|password|access control|permiss|role|sensitive|confidential)\b/i.test(combinedText)) {
        return "Security";
    }

    // Usability requirement indicators
    if (/\b(usability|user interface|ui|ux|accessibility|user experience|ease of use|intuitive|learn|user-friendly)\b/i.test(combinedText)) {
        return "Usability";
    }

    // Reliability requirement indicators
    if (/\b(reliability|availability|maintainability|fault tolerance|recovery|backup|resilience|robust)\b/i.test(combinedText)) {
        return "Reliability";
    }

    // Default to functional if no specific type is detected
    return "Functional";
}

/**
 * Extract potential stakeholders related to a requirement
 * @param {string} title - Requirement title
 * @param {string} description - Requirement description
 * @param {string} fullText - Complete document text for context
 * @returns {Array} - List of potential stakeholders
 */
function extractStakeholders(title, description, fullText) {
    const combinedText = `${title} ${description}`.toLowerCase();
    const stakeholders = [];

    // Common stakeholder roles
    const stakeholderPatterns = [
        /\b(user|customer|client|stakeholder|admin|administrator|manager|operator|end-user|system administrator)\b/i,
        /\b(developer|tester|qa|designer|architect|engineer|support|maintenance|operations)\b/i,
        /\b(business|owner|sponsor|executive|officer|regulator|authority|compliance)\b/i
    ];

    // Check for stakeholder mentions
    stakeholderPatterns.forEach(pattern => {
        const matches = combinedText.match(pattern);
        if (matches) {
            matches.forEach(match => {
                // Capitalize first letter
                const stakeholder = match.charAt(0).toUpperCase() + match.slice(1);
                if (!stakeholders.includes(stakeholder)) {
                    stakeholders.push(stakeholder);
                }
            });
        }
    });

    // If no stakeholders found in the requirement text, search in the full document
    // (This actually uses the fullText parameter that was previously unused)
    if (stakeholders.length === 0 && fullText) {
        // Tokenize the title to find key terms
        const titleTokens = tokenizer.tokenize(title);
        
        // Look for sentences in fullText that contain both title tokens and stakeholder terms
        const sentences = fullText.match(/[^.!?]+[.!?]+/g) || [];
        
        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            // Check if the sentence contains any tokens from the title
            const containsTitleToken = titleTokens.some(token => 
                lowerSentence.includes(token.toLowerCase()) && token.length > 3
            );
            
            if (containsTitleToken) {
                // Check for stakeholder mentions in this relevant sentence
                stakeholderPatterns.forEach(pattern => {
                    const sentenceMatches = lowerSentence.match(pattern);
                    if (sentenceMatches) {
                        sentenceMatches.forEach(match => {
                            const stakeholder = match.charAt(0).toUpperCase() + match.slice(1);
                            if (!stakeholders.includes(stakeholder)) {
                                stakeholders.push(stakeholder);
                            }
                        });
                    }
                });
            }
        });
    }

    return stakeholders;
}

/**
 * Identify dependencies between requirements
 * @param {Array} requirements - List of requirements
 * @returns {Array} - Requirements with dependencies
 */
function identifyDependencies(requirements) {
    // Copy requirements to avoid mutating the original
    const reqsWithDependencies = [...requirements];

    // Create a TF-IDF model to find similar requirements
    const tfidf = new TfIdf();

    // Add all requirement texts to the model
    reqsWithDependencies.forEach((req) => {
        // Use stemmer to normalize words for better matching
        const stemmedText = stemmer.tokenizeAndStem(`${req.title} ${req.description}`).join(' ');
        tfidf.addDocument(stemmedText);
    });

    // For each requirement, find related requirements
    reqsWithDependencies.forEach((req, reqIndex) => {
        req.dependencies = [];

        // Find similar requirements using TF-IDF
        const stemmedQuery = stemmer.tokenizeAndStem(`${req.title} ${req.description}`).join(' ');
        
        tfidf.tfidfs(stemmedQuery, (docIndex, measure) => {
            // Skip self-comparison
            if (docIndex !== reqIndex && measure > 0.2) {
                req.dependencies.push({
                    id: reqsWithDependencies[docIndex].id,
                    title: reqsWithDependencies[docIndex].title,
                    type: "related",
                    similarity: measure.toFixed(2)
                });
            }
        });

        // Look for explicit references to other requirements
        const reqText = `${req.title} ${req.description}`;
        reqsWithDependencies.forEach((otherReq, otherIdx) => {
            if (otherIdx !== reqIndex) {
                // Check for reference to other requirement ID
                if (reqText.includes(otherReq.id)) {
                    req.dependencies.push({
                        id: otherReq.id,
                        title: otherReq.title,
                        type: "depends-on"
                    });
                }

                // Check for reference to other requirement title
                if (reqText.includes(otherReq.title)) {
                    req.dependencies.push({
                        id: otherReq.id,
                        title: otherReq.title,
                        type: "references"
                    });
                }
            }
        });

        // Deduplicate dependencies
        req.dependencies = req.dependencies.filter((dep, i, arr) =>
            arr.findIndex(d => d.id === dep.id) === i
        );
    });

    return reqsWithDependencies;
}

/**
 * Categorize requirements by type and priority
 * @param {Array} requirements - List of requirements
 * @returns {Object} - Categorized requirements
 */
function categorizeRequirements(requirements) {
    // Create categories by type
    const categorized = {
        byType: {},
        byPriority: {
            High: [],
            Medium: [],
            Low: []
        },
        all: requirements
    };

    // Categorize by type
    requirements.forEach(req => {
        if (!categorized.byType[req.type]) {
            categorized.byType[req.type] = [];
        }
        categorized.byType[req.type].push(req);

        // Categorize by priority
        categorized.byPriority[req.priority].push(req);
    });

    return categorized;
}

/**
 * Extract metadata from the document
 * @param {string} text - Document content
 * @returns {Object} - Document metadata
 */
function extractDocumentMetadata(text) {
    const metadata = {
        title: "",
        author: "",
        date: "",
        version: "",
        keywords: []
    };

    // Extract title (first heading or first sentence)
    const titleMatch = text.match(/(?:^|\n)(?:title:|#\s+)([^\n]+)/i) ||
        text.match(/^([^.!?\n]+)[.!?]/);
    if (titleMatch && titleMatch[1]) {
        metadata.title = titleMatch[1].trim();
    }

    // Extract author
    const authorMatch = text.match(/(?:authors?|prepared by|written by|by)[:\s]+([^,\n]+)/i);
    if (authorMatch && authorMatch[1]) {
        metadata.author = authorMatch[1].trim();
    }

    // Extract date
    const dateMatch = text.match(/(?:date|created|prepared|published)[:\s]+([\w\s,]+\d{4})/i) ||
        text.match(/(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/);
    if (dateMatch && dateMatch[1]) {
        metadata.date = dateMatch[1].trim();
    }

    // Extract version
    const versionMatch = text.match(/(?:version|v)[:\s]+([0-9.]+)/i);
    if (versionMatch && versionMatch[1]) {
        metadata.version = versionMatch[1].trim();
    }

    // Extract keywords using the keyword extractor
    try {
        metadata.keywords = keywordExtractor.extract(text, {
            language: "english",
            remove_digits: true,
            return_changed_case: true,
            remove_duplicates: true
        }).slice(0, 10); // Get top 10 keywords
    } catch (err) {
        console.error("Error extracting keywords:", err);
        
        // Fallback to basic keyword extraction if the keyword extractor fails
        const words = tokenizer.tokenize(text);
        const wordFreq = {};
        words.forEach(word => {
            if (word.length > 3) { // Skip short words
                word = word.toLowerCase();
                wordFreq[word] = (wordFreq[word] || 0) + 1;
            }
        });
        
        // Sort by frequency and get top keywords
        metadata.keywords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(entry => entry[0]);
    }

    return metadata;
}

/**
 * Generate statistics about the extracted requirements
 * @param {Object} categorizedRequirements - Categorized requirements
 * @returns {Object} - Statistics
 */
function generateStatistics(categorizedRequirements) {
    const stats = {
        totalRequirements: categorizedRequirements.all.length,
        byType: {},
        byPriority: {
            High: categorizedRequirements.byPriority.High.length,
            Medium: categorizedRequirements.byPriority.Medium.length,
            Low: categorizedRequirements.byPriority.Low.length
        },
        complexityScore: 0,
        averageDependencies: 0,
        totalDependencies: 0
    };

    // Count by type
    Object.keys(categorizedRequirements.byType).forEach(type => {
        stats.byType[type] = categorizedRequirements.byType[type].length;
    });

    // Calculate complexity metrics
    let totalDependencies = 0;
    categorizedRequirements.all.forEach(req => {
        if (req.dependencies) {
            totalDependencies += req.dependencies.length;
        }
    });

    stats.totalDependencies = totalDependencies;
    stats.averageDependencies = totalDependencies / (categorizedRequirements.all.length || 1);

    // Simple complexity score based on number of requirements and dependencies
    stats.complexityScore = Math.round(
        (stats.totalRequirements * 0.6) +
        (stats.averageDependencies * 10) +
        (stats.byPriority.High * 1.5)
    );

    return stats;
}

// Create a named object before exporting
const documentAnalyzer = {
    analyzeDocument,
    splitIntoSections,
    identifyRequirementSections,
    extractStructuredRequirements
};

export default documentAnalyzer;