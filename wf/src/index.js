// src/index.js
import Resolver from '@forge/resolver';
import fetch from 'node-fetch';
import api, { route } from '@forge/api';


const CONFLUENCE_APP_ID = 'ari:cloud:ecosystem::app/c67f4945-8cbf-477c-afec-e93d5f96a9de';
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

            // Get the raw text response first
            const rawText = await response.text();
            console.log('Raw API Response:', rawText);

            // Try to parse the raw response as JSON
            let responseData;
            try {
                responseData = JSON.parse(rawText);
            } catch (e) {
                console.error('Failed to parse API response:', e);
                throw new Error('Invalid API response format');
            }

            if (response.status === 529) {
                if (attempt === maxRetries) throw new Error('Max retries reached');
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
                continue;
            }

            if (!response.ok) {
                throw new Error(`Claude API error (${response.status}): ${rawText}`);
            }

            if (!responseData.content?.[0]?.text) {
                console.error('Unexpected response structure:', responseData);
                throw new Error('Unexpected response format from Claude API: missing content');
            }


            const text = responseData.content[0].text.trim();
            console.log('Extracted text:', text);

            // If this is a JSON-expecting prompt
            if (prompt.includes('Return ONLY a valid JSON') || prompt.includes('Return exact JSON')) {
                try {
                    return JSON.parse(text);
                } catch (parseError) {
                    console.error('Failed to parse Claude response as JSON:', text);
                    throw new Error('Claude did not return valid JSON');
                }
            }

            // For non-JSON responses 
            return text;

        } catch (error) {
            console.error(`Attempt ${attempt} failed:`, error);
            if (attempt === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * attempt));
        }
    }
}

async function createJiraIssue(summary, description, parentKey = null, assignee = null) {
    const endpoint = route`/rest/api/3/issue`;
    
    const body = {
        fields: {
            summary: summary,
            description: {
                type: "doc",
                version: 1,
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                text: description
                            }
                        ]
                    }
                ]
            },
            project: {
                key: "DP"  // project key
            },
            issuetype: {
                id: "10001"  // Task type ID
            }
        }
    };

    // If this is a subtask, set different issue type and parent
    if (parentKey) {
        body.fields.issuetype = {
            id: "10003"  // Subtask type ID
        };
        body.fields.parent = {
            key: parentKey
        };
    }

    // Add assignee if provided
    if (assignee) {
        try {
            // Search for user first
            const userEndpoint = route`/rest/api/3/user/search?query=${assignee}`;
            const userResponse = await api.asUser().requestJira(userEndpoint);
            const userData = await userResponse.json();
            
            if (userData && userData.length > 0) {
                body.fields.assignee = {
                    id: userData[0].accountId
                };
            }
        } catch (error) {
            console.warn('Could not find user:', assignee);
        }
    }

    try {
        const response = await api.asUser().requestJira(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();
        console.log('Jira API response:', data);

        if (response.status >= 400) {
            throw new Error(`Jira API error: ${JSON.stringify(data)}`);
        }

        return data.key;
    } catch (error) {
        console.error('Error creating Jira issue:', error);
        throw error;
    }
}

async function createAllJiraTasks(tasks) {
    console.log('Starting to create Jira tasks:', JSON.stringify(tasks, null, 2));
    const createdIssues = [];

    try {
        for (const task of tasks) {
            console.log('Creating main task:', task.title);
            const parentKey = await createJiraIssue(
                task.title, 
                task.description,
                null,
                task.assignee
            );
            
            console.log('Created main task with key:', parentKey);

            createdIssues.push({
                key: parentKey,
                title: task.title,
                assignee: task.assignee,
                subtasks: []
            });

            for (const subtask of task.subtasks) {
                console.log('Creating subtask:', subtask.title, 'for parent:', parentKey);
                const subtaskKey = await createJiraIssue(
                    subtask.title,
                    subtask.description,
                    parentKey,
                    subtask.assignee
                );
                console.log('Created subtask with key:', subtaskKey);
                
                createdIssues[createdIssues.length - 1].subtasks.push({
                    key: subtaskKey,
                    title: subtask.title,
                    assignee: subtask.assignee
                });
            }
        }

        return createdIssues;
    } catch (error) {
        console.error('Error in createAllJiraTasks:', error);
        throw error;
    }
}


async function createConfluencePage(title, content, spaceKey) {
    if (!spaceKey) {
        throw new Error('Space key is required');
    }
    if (!title || !content) {
        throw new Error('Title and content are required');
    }

    console.log('Attempting to create page in space:', spaceKey);
    
    // Added timeout handling
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
        console.log('Space check response:', spaceData);
        
        if (!spaceResponse.ok) {
            console.error('Space access failed with status:', spaceResponse.status);
            console.error('Space data:', spaceData);
            throw new Error(`Cannot access space ${spaceKey}: ${JSON.stringify(spaceData)}`);
        }

        // Create the page
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
                    space: {
                        key: spaceKey
                    },
                    title: title,
                    body: {
                        storage: {
                            value: content,
                            representation: "storage"
                        }
                    },
                    status: "current"
                })
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Confluence API error details:', errorData);
            throw new Error(`Confluence API error (${response.status}): ${JSON.stringify(errorData)}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Confluence error details:', error);
        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}


// Task generator for project descriptions
resolver.define('generateTasks', async ({ payload }) => {
    try {
        const { description } = payload;

        if (!description) {
            throw new Error('Missing required parameter: description');
        }
        
        const prompt = `Create a JSON structure for this project: "${description}"
            Return only a JSON object with this exact structure, no explanations:
            {
                "tasks": [
                    {
                        "title": "brief task title",
                        "description": "short description",
                        "subtasks": [
                            {
                                "title": "brief subtask title",
                                "description": "short description"
                            }
                        ]
                    }
                ]
            }`;

        const aiResponse = await callClaudeAPI(prompt);
        const parsedTasks = JSON.parse(aiResponse);

        const createdIssues = await createAllJiraTasks(parsedTasks.tasks);
        
        return {
            generated: parsedTasks,
            created: createdIssues
        };
    } catch (error) {
        console.error('Error in generateTasks:', error);
        return {
            error: true,
            message: error.message || 'Failed to generate tasks'
        };
    }
});


// Meeting transcript processor
resolver.define('processMeetingTranscript', async ({ payload }) => {
    try {
        const { transcript, spaceKey } = payload;
        if (!transcript || !spaceKey) {
            throw new Error('Missing required parameters: transcript and spaceKey');
        }
        
        // Task generation prompt
        const taskPrompt = `
            Analyze this meeting transcript and generate structured tasks.
            Transcript: ${transcript}
            
            Return ONLY a valid JSON object with this EXACT structure (no additional text or explanation):

            {
                "metadata": {
                    "meetingDate": "extracted date",
                    "attendees": ["list of attendees"]
                },
                "tasks": [
                    {
                        "title": "Main Task Title",
                        "description": "Detailed description",
                        "assignee": "Person name or null",
                        "subtasks": [
                            {
                                "title": "Subtask Title",
                                "description": "Subtask details",
                                "assignee": "Person name or null"
                            }
                        ]
                    }
                ]
            }`;
 
        // First generate and create Jira tasks 
        const taskResponse = await callClaudeAPI(taskPrompt);
        const parsedTasks = typeof taskResponse === 'string' ? JSON.parse(taskResponse) : taskResponse;

        if (!taskResponse || !taskResponse.metadata || !taskResponse.tasks) {
            throw new Error('Invalid task response structure from Claude API');
        }

        if (!parsedTasks.tasks) parsedTasks.tasks = [];
        parsedTasks.tasks.forEach(task => {
            if (!task.subtasks) task.subtasks = [];
        });
 
        const createdIssues = await createAllJiraTasks(parsedTasks.tasks);
 
        // Generate meeting summary
        const summaryPrompt = `
            Create a detailed meeting summary:
            ${transcript}
 
            Format in Confluence markup:
            h1. Meeting Summary
            {date}
            
            h2. Attendees
            {list of attendees}
 
            h2. Discussion Points
            {bullet points of main topics}
 
            h2. Decisions
            {numbered list of decisions}
 
            h2. Action Items
            {Include created Jira tasks:
             ${createdIssues.map(issue => 
                 `- ${issue.key}: ${issue.title}`
             ).join('\n')}
            }`;
 
        const summaryResponse = await callClaudeAPI(summaryPrompt);

        if (typeof summaryResponse !== 'string') {
            throw new Error('Invalid meeting summary format');
        }
 
        // Create Confluence page
        const pageTitle = `Meeting Summary - ${parsedTasks.metadata.meetingDate || new Date().toLocaleDateString()}`;

        
        try {
            // Use the createConfluencePage function we already have
            const confluencePage = await createConfluencePage(
                pageTitle,
                summaryResponse,
                spaceKey
            );

            return {
                success: true,
                generated: parsedTasks,
                created: createdIssues,
                confluencePage
            };
        } catch (confluenceError) {
            console.error('Confluence error:', confluenceError);
            return {
                success: true,
                generated: parsedTasks,
                created: createdIssues,
                confluenceError: confluenceError.message || 'Failed to create Confluence page'
            };
        }
    } catch (error) {
        console.error('Process meeting transcript error:', error);
        return {
            success: false,
            error: true,
            message: error.message
        };
    }
});

resolver.define('testConfluencePage', async ({ payload }) => {
    try {
        const { spaceKey } = payload;
        
        const testPage = await createConfluencePage(
            "Test Page",
            "h1. Test\n\nThis is a test page.",
            spaceKey
        );
        
        return {
            success: true,
            page: testPage
        };
    } catch (error) {
        console.error('Test page creation failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
});

// Helper function to get issue types
resolver.define('getIssueTypes', async () => {
    try {
        const endpoint = route`/rest/api/3/issuetype`;
        const response = await api.asUser().requestJira(endpoint);
        const data = await response.json();
        console.log('Available issue types:', data);
        return data;
    } catch (error) {
        console.error('Error getting issue types:', error);
        throw error;
    }
});

export const handler = resolver.getDefinitions();