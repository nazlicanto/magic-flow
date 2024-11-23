import React, { useState, useEffect } from 'react';
import { invoke } from '@forge/bridge';

// FileUploader component
const FileUploader = ({ onTranscriptLoad }) => {
    const [error, setError] = useState('');
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');

    const handleFile = async (file) => {
        setError('');
        
        if (!file.name.toLowerCase().endsWith('.txt')) {
            setError('Please upload a .txt file only');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('File size should be less than 5MB');
            return;
        }

        try {
            const text = await file.text();
            setFileName(file.name);
            onTranscriptLoad(text);
        } catch (err) {
            setError('Failed to read file. Please try again.');
            console.error('File reading error:', err);
        }
    };

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    const onFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) handleFile(file);
    };

    return (
        <div style={{ marginBottom: '20px' }}>
            <div
                style={{
                    border: `2px dashed ${isDragging ? '#0052CC' : '#DFE1E6'}`,
                    borderRadius: '3px',
                    padding: '32px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragging ? '#F4F5F7' : 'white',
                    transition: 'all 0.2s ease'
                }}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-input').click()}
            >
                <input
                    id="file-input"
                    type="file"
                    accept=".txt"
                    style={{ display: 'none' }}
                    onChange={onFileSelect}
                />
                
                <div>
                    {fileName ? (
                        <p style={{ color: '#42526E' }}>Loaded: {fileName}</p>
                    ) : (
                        <>
                            <p style={{ 
                                color: '#172B4D',
                                fontSize: '16px',
                                fontWeight: '500',
                                marginBottom: '8px'
                            }}>
                                Drop your transcript file here
                            </p>
                            <p style={{ color: '#42526E', fontSize: '14px' }}>
                                or click to browse
                            </p>
                            <p style={{ 
                                color: '#6B778C',
                                fontSize: '12px',
                                marginTop: '4px'
                            }}>
                                .txt files only, up to 5MB
                            </p>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div style={{
                    marginTop: '8px',
                    padding: '12px',
                    backgroundColor: '#FFEBE6',
                    color: '#DE350B',
                    borderRadius: '3px'
                }}>
                    {error}
                </div>
            )}
        </div>
    );
};

const getTabStyle = (isActive) => ({
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: isActive ? '#0052CC' : '#42526E',
    fontWeight: '500',
    borderBottom: `2px solid ${isActive ? '#0052CC' : 'transparent'}`,
    marginBottom: '-2px'
});


function MeetingNotes() {
    const [transcript, setTranscript] = useState('');
    const [spaceKey, setSpaceKey] = useState('magicflow');
    const [availableSpaces, setAvailableSpaces] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('paste'); // For tracking active tab


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

        // Add these new handler functions in your MeetingNotes component
    const handleJiraProcess = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            console.log('Processing Jira tasks with transcript'); 
            const result = await invoke('generateTasks', { 
                description: transcript
            });
            console.log('Received Jira result:', result); 
            
            if (result.error) {
                throw new Error(result.message);
            }
            
            setGeneratedTasks({
                generated: result.generated,
                created: result.created
            });
        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfluenceProcess = async () => {
        setIsProcessing(true);
        setError(null);
        try {
            console.log('Creating Confluence summary with space key:', spaceKey); 
            const result = await invoke('createConfluenceSummary', { 
                transcript,
                spaceKey 
            });
            console.log('Received Confluence result:', result); 
            
            if (result.error) {
                throw new Error(result.message);
            }
            
            setGeneratedTasks({
                confluencePage: result
            });
        } catch (error) {
            console.error('Error:', error);
            setError(error.message);
        } finally {
            setIsProcessing(false);
        }
    };


    const handleFileUpload = (text) => {
        setTranscript(text);
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


            <SpaceKeyInput />

            {/* Simple Tab Implementation */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{
                    borderBottom: '2px solid #DFE1E6',
                    marginBottom: '20px',
                    display: 'flex',
                    gap: '8px'
                }}>
                    <button
                        onClick={() => setActiveTab('paste')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: activeTab === 'paste' ? '#0052CC' : '#42526E',
                            fontWeight: '500',
                            borderBottom: `2px solid ${activeTab === 'paste' ? '#0052CC' : 'transparent'}`,
                            marginBottom: '-2px'
                        }}
                    >
                        Paste Text
                    </button>
                    <button
                        onClick={() => setActiveTab('upload')}
                        style={{
                            padding: '8px 16px',
                            border: 'none',
                            background: 'none',
                            cursor: 'pointer',
                            color: activeTab === 'upload' ? '#0052CC' : '#42526E',
                            fontWeight: '500',
                            borderBottom: `2px solid ${activeTab === 'upload' ? '#0052CC' : 'transparent'}`,
                            marginBottom: '-2px'
                        }}
                    >
                        Upload File
                    </button>
                </div>

                {activeTab === 'paste' && (
                    <div style={{ marginBottom: '20px' }}>
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
                    </div>
                )}

                {activeTab === 'upload' && (
                    <FileUploader onTranscriptLoad={handleFileUpload} />
                )}
            </div>
            {/* Add the new buttons here instead */}
            <div style={{ 
                display: 'flex', 
                gap: '12px',
                marginBottom: '20px' 
            }}>
                <button
                    onClick={handleJiraProcess}
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
                    {isProcessing ? 'Processing...' : 'Create Jira Issues'}
                </button>

                <button
                    onClick={handleConfluenceProcess}
                    disabled={isProcessing || !transcript.trim() || !spaceKey}
                    style={{
                        backgroundColor: isProcessing ? '#00875A80' : '#00875A',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: (isProcessing || !transcript.trim() || !spaceKey) ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    {isProcessing ? 'Processing...' : 'Create Confluence Summary'}
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