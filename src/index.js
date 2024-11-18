// src/index.js
import Resolver from '@forge/resolver';
import fetch from 'node-fetch';
import api, { route } from '@forge/api';

const resolver = new Resolver();

async function callClaudeAPI(prompt) {
    try {
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
        return data.content[0].text;
    } catch (error) {
        console.error('Error in callClaudeAPI:', error);
        throw error;
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
                key: "DP"  // Your project key
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

// Task generator for project descriptions
resolver.define('generateTasks', async ({ payload }) => {
    try {
        const { description } = payload;
        
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
// Meeting transcript processor
resolver.define('processMeetingTranscript', async ({ payload }) => {
    try {
        const { transcript } = payload;
        
        const prompt = `
            Analyze this meeting transcript and create a structured task breakdown.
            
            Transcript:
            ${transcript}
            
            Generate a JSON object that includes:
            1. Meeting metadata (date and attendees)
            2. Main tasks with descriptions
            3. Subtasks for each main task
            4. Assignees based on the discussion
            
            Use this exact JSON structure:
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
            }

            Ensure each task has:
            - A clear, specific title
            - A detailed description
            - An assignee if mentioned in the transcript
            - At least one subtask
            
            Focus on concrete, actionable items discussed in the meeting.`;

        console.log('Sending prompt to Claude:', prompt);
        const aiResponse = await callClaudeAPI(prompt);
        console.log('Received response from Claude:', aiResponse);
        
        const parsedTasks = JSON.parse(aiResponse);
        console.log('Parsed tasks:', parsedTasks);

        // Ensure tasks and subtasks arrays exist
        if (!parsedTasks.tasks) parsedTasks.tasks = [];
        parsedTasks.tasks.forEach(task => {
            if (!task.subtasks) task.subtasks = [];
        });

        const createdIssues = await createAllJiraTasks(parsedTasks.tasks);
        console.log('Created issues:', createdIssues);
        
        return {
            generated: parsedTasks,
            created: createdIssues
        };
    } catch (error) {
        console.error('Error in processMeetingTranscript:', error);
        return {
            error: true,
            message: error.message || 'Failed to process meeting transcript'
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