import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

function MeetingNotes() {
    const [transcript, setTranscript] = useState('');
    const [spaceKey, setSpaceKey] = useState('magicflow');
    const [availableSpaces, setAvailableSpaces] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState(null);
    const [error, setError] = useState(null);

    // Add this useEffect to fetch spaces when component mounts
    useEffect(() => {
        const fetchSpaces = async () => {
            try {
                const result = await invoke('getConfluenceSpaces');
                if (result && result.spaces) {
                    setAvailableSpaces(result.spaces);
                    // Set default space if available
                    if (result.spaces.length > 0) {
                        setSpaceKey(result.spaces[0].key);
                    }
                }
            } catch (error) {
                console.error('Error fetching spaces:', error);
                setError('Failed to fetch available spaces');
            }
        };
        
        fetchSpaces();
    }, []);

    // Replace the input with a select dropdown
    const SpaceKeyInput = () => (
        <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px', color: '#172B4D' }}>
                Confluence Space:
            </div>
            <select
                value={spaceKey}
                onChange={(e) => setSpaceKey(e.target.value)}
                style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '3px',
                    border: '2px solid #DFE1E6',
                    marginBottom: '10px'
                }}
            >
                {availableSpaces.map(space => (
                    <option key={space.key} value={space.key}>
                        {space.name} ({space.key})
                    </option>
                ))}
            </select>
        </div>
    );

    const checkIssueTypes = async () => {
        try {
            const types = await invoke('getIssueTypes');
            console.log('Issue types:', types);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const handleProcess = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            console.log('Processing transcript with space key:', spaceKey); 
            const result = await invoke('processMeetingTranscript', { 
                transcript,
                spaceKey 
            });
            console.log('Received result:', result); 
            
            if (result.error) {
                throw new Error(result.message);
            }

            if (result.confluenceError) {
                console.error('Confluence error:', result.confluenceError);
                setError(`Jira tasks created but Confluence page creation failed: ${result.confluenceError}`);
            }
            
            setGeneratedTasks(result);
        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div>
            <h1 style={{ 
                color: '#172B4D', 
                marginBottom: '20px',
                fontSize: '24px',
                fontWeight: 'bold'
            }}>
                Meeting Notes Processor
            </h1>
            
            {/* Debug button for checking issue types */}
            <button
                onClick={checkIssueTypes}
                style={{
                    backgroundColor: '#00B8D9',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '3px',
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: '16px',
                    fontSize: '14px'
                }}
            >
                Check Issue Types
            </button>
            
            {/* Confluence Space Key Input */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', color: '#172B4D' }}>
                    Confluence Space Key:
                </div>
                <input
                    value={spaceKey}
                    onChange={(e) => setSpaceKey(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '8px',
                        borderRadius: '3px',
                        border: '2px solid #DFE1E6',
                        marginBottom: '10px'
                    }}
                    placeholder="Enter Confluence space key..."
                />
            </div>

            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', color: '#172B4D' }}>
                    Paste your meeting transcript:
                </div>
                <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '300px',
                        padding: '12px',
                        borderRadius: '3px',
                        border: '2px solid #DFE1E6',
                        marginBottom: '10px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        fontFamily: 'monospace',
                        resize: 'vertical'
                    }}
                    placeholder="Paste your meeting transcript here..."
                />
                <button
                    onClick={handleProcess}
                    disabled={isProcessing || !transcript.trim()}
                    style={{
                        backgroundColor: isProcessing ? '#0052CC80' : '#0052CC',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: isProcessing || !transcript.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    {isProcessing ? 'Processing...' : 'Process Transcript'}
                </button>
            </div>

            {error && (
                <div style={{
                    backgroundColor: '#FFEBE6',
                    color: '#DE350B',
                    padding: '12px',
                    borderRadius: '3px',
                    marginBottom: '20px',
                    fontSize: '14px'
                }}>
                    <strong>Error: </strong>{error}
                    <pre style={{
                        marginTop: '8px',
                        whiteSpace: 'pre-wrap',
                        fontSize: '12px'
                    }}>
                        {error.stack}
                    </pre>
                </div>
            )}

            {generatedTasks && generatedTasks.generated && (
                <div style={{
                    backgroundColor: '#F4F5F7',
                    padding: '16px',
                    borderRadius: '3px',
                    marginBottom: '20px'
                }}>
                    <h3 style={{ 
                        color: '#172B4D', 
                        marginBottom: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        Extracted Meeting Tasks:
                    </h3>
                    <pre style={{
                        whiteSpace: 'pre-wrap',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        padding: '12px',
                        borderRadius: '3px',
                        border: '1px solid #DFE1E6'
                    }}>
                        {JSON.stringify(generatedTasks.generated, null, 2)}
                    </pre>
                </div>
            )}

            {generatedTasks && generatedTasks.created && (
                <div style={{
                    backgroundColor: '#E3FCEF',
                    padding: '16px',
                    borderRadius: '3px'
                }}>
                    <h3 style={{ 
                        color: '#006644',
                        marginBottom: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        Created Jira Issues:
                    </h3>
                    {generatedTasks.created.map((task, index) => (
                        <div key={index} style={{ 
                            marginBottom: '16px',
                            backgroundColor: 'white',
                            padding: '12px',
                            borderRadius: '3px',
                            border: '1px solid #B3F5D6'
                        }}>
                            <div style={{ 
                                fontWeight: 'bold',
                                color: '#172B4D',
                                marginBottom: '8px'
                            }}>
                                {task.key}: {task.title}
                            </div>
                            {task.assignee && (
                                <div style={{
                                    color: '#42526E',
                                    fontSize: '12px',
                                    marginBottom: '8px'
                                }}>
                                    Assignee: {task.assignee}
                                </div>
                            )}
                            <div style={{ marginLeft: '20px' }}>
                                {task.subtasks.map((subtask, subIndex) => (
                                    <div key={subIndex} style={{
                                        color: '#42526E',
                                        marginBottom: '4px',
                                        fontSize: '14px'
                                    }}>
                                        • {subtask.key}: {subtask.title}
                                        {subtask.assignee && (
                                            <span style={{ fontSize: '12px', marginLeft: '8px' }}>
                                                ({subtask.assignee})
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {generatedTasks && generatedTasks.confluencePage && (
                <div style={{
                    backgroundColor: '#E3FCEF',
                    padding: '16px',
                    borderRadius: '3px',
                    marginTop: '20px'
                }}>
                    <h3 style={{ 
                        color: '#006644',
                        marginBottom: '12px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                    }}>
                        Created Confluence Page:
                    </h3>
                    <a
                        href={generatedTasks.confluencePage._links.webui}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            color: '#0052CC',
                            textDecoration: 'none'
                        }}
                    >
                        {generatedTasks.confluencePage.title}
                    </a>
                </div>
            )}
        </div>
    );
}

export default MeetingNotes;