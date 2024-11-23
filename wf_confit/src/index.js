import Resolver from '@forge/resolver';
import api, { route } from '@forge/api';
import fetch from 'node-fetch';

const resolver = new Resolver();

async function callClaudeAPI(prompt, maxRetries = 3, delay = 2000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`Claude API attempt ${attempt}/${maxRetries}`);
            
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': process.env.CLAUDE_API_KEY,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-haiku-20240307',
                    max_tokens: 2048,
                    messages: [{
                        role: 'user',
                        content: prompt
                    }],
                    temperature: 0.5,
                })
            });

            if (!response.ok) {
                throw new Error(`Claude API error: ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.content?.[0]?.text) {
                throw new Error('Unexpected response format from Claude API');
            }
            return data.content[0].text;
        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
}

async function createConfluencePage(title, content, spaceKey) {
    if (!spaceKey || !title || !content) {
        throw new Error('Space key, title, and content are required');
    }

    console.log('Creating Confluence page:', { title, spaceKey, contentLength: content.length });

    const timeoutMs = 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // First verify space access
        const spaceResponse = await api.asUser().requestConfluence(
            route`/wiki/rest/api/space/${spaceKey}`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                signal: controller.signal
            }
        );

        const spaceData = await spaceResponse.json();
        if (!spaceResponse.ok) {
            throw new Error(`Cannot access space ${spaceKey}: ${JSON.stringify(spaceData)}`);
        }

        const response = await api.asUser().requestConfluence(
            route`/wiki/rest/api/content`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                signal: controller.signal,
                body: JSON.stringify({
                    type: "page",
                    title: title,
                    space: { key: spaceKey },
                    body: {
                        storage: {
                            value: content,
                            representation: "storage"  // Changed from "wiki"
                        }
                    },
                    status: "current"
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Confluence API error: ${JSON.stringify(errorData)}`);
        }

        const data = await response.json();
        console.log('Created Confluence page:', data);
        return data;
    } catch (error) {
        console.error('Error creating Confluence page:', error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

async function generateMeetingSummary(transcript, spaceKey, jiraTasks) {
    if (!transcript || !spaceKey) {
        throw new Error('Transcript and space key are required');
    }

    console.log('Processing meeting summary:', {
        hasTranscript: !!transcript,
        spaceKey,
        taskCount: jiraTasks?.length
    });

    const summaryPrompt = `
        Create a detailed meeting summary:
        ${transcript}

        Format in Confluence markup:
        h1. Meeting Summary

        h2. Meeting Details
        Date: [extract from transcript]
        Attendees: [extract from transcript]

        h2. Key Discussion Points
        [Main topics and insights]

        h2. Decisions Made
        [List key decisions]

        h2. Action Items
        Related Jira Tasks:
        ${jiraTasks?.map(task => `- ${task.key}: ${task.title}`).join('\n') || 'No tasks created'}`;

    const summary = await callClaudeAPI(summaryPrompt);
    const meetingDate = new Date().toISOString().split('T')[0];
    const pageTitle = `Meeting Summary - ${meetingDate}`;
    
    const confluencePage = await createConfluencePage(pageTitle, summary, spaceKey);
    
    return {
        pageId: confluencePage.id,
        pageUrl: confluencePage._links.webui,
        title: confluencePage.title
    };
}

// Resolver definitions
resolver.define('getConfluenceSpaces', async () => {
    try {
        const response = await api.asUser().requestConfluence(
            route`/wiki/rest/api/space`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await response.json();
        console.log('Available Confluence spaces:', data);
        return data.results.map(space => ({
            key: space.key,
            name: space.name
        }));
    } catch (error) {
        console.error('Error getting Confluence spaces:', error);
        throw error;
    }
});

resolver.define('testSpaces', async () => {
    console.log('Testing space access...');
    try {
        const response = await api.asUser().requestConfluence(
            route`/wiki/rest/api/space`,
            {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const data = await response.json();
        const spaces = data.results.map(space => ({
            key: space.key,
            name: space.name,
            url: space._links?.webui
        }));
        
        console.log('Found spaces:', spaces);
        return {
            success: true,
            spaces: spaces
        };
    } catch (error) {
        console.error('Failed to get spaces:', error);
        return {
            success: false,
            error: error.message
        };
    }
});


resolver.define('handleJiraEvent', async ({ payload }) => {
    try {
        const { transcript, jiraTasks, spaceKey } = payload;
        if (!transcript || !spaceKey) {
            throw new Error('Missing required parameters: transcript and spaceKey');
        }
        
        const result = await generateMeetingSummary(transcript, spaceKey, jiraTasks);
        return {
            success: true,
            ...result
        };
    } catch (error) {
        console.error('Error handling Jira event:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

resolver.define('generateMeetingSummary', async ({ payload }) => {
    try {
        const { transcript, spaceKey, jiraTasks } = payload;
        
        const result = await generateMeetingSummary(transcript, spaceKey, jiraTasks);
        return {
            success: true,
            ...result
        };
    } catch (error) {
        console.error('Error in generateMeetingSummary:', error);
        return {
            success: false,
            error: error.message || 'Failed to generate meeting summary'
        };
    }
});

export const handler = resolver.getDefinitions();