import React, { useState } from 'react';
import { invoke } from '@forge/bridge';

function MeetingNotes() {
    const [transcript, setTranscript] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState(null);
    const [error, setError] = useState(null);

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
            const result = await invoke('processMeetingTranscript', { transcript });
            
            if (result.error) {
                throw new Error(result.message || 'Failed to process transcript');
            }
            
            setGeneratedTasks(result);
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'An error occurred while processing the transcript');
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
        </div>
    );
}

export default MeetingNotes;