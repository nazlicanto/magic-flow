// static/hello-world/src/WorkflowGPT.js
import React, { useState } from 'react';
import { invoke } from '@forge/bridge';

function WorkflowGPT() {
    const [projectDescription, setProjectDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedTasks, setGeneratedTasks] = useState(null);
    const [error, setError] = useState(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setError(null);
        try {
            console.log('Calling generateTasks with:', projectDescription);
            const result = await invoke('generateTasks', { description: projectDescription });
            console.log('Received result:', result);
            
            if (result.error) {
                throw new Error(result.message || 'Failed to generate tasks');
            }
            
            setGeneratedTasks(result);
        } catch (error) {
            console.error('Error:', error);
            setError(error.message || 'An error occurred while generating tasks');
        } finally {
            setIsGenerating(false);
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
                Project Task Generator
            </h1>
            
            <div style={{ marginBottom: '20px' }}>
                <div style={{ marginBottom: '10px', color: '#172B4D' }}>
                    Enter your project description:
                </div>
                <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    style={{
                        width: '100%',
                        minHeight: '150px',
                        padding: '12px',
                        borderRadius: '3px',
                        border: '2px solid #DFE1E6',
                        marginBottom: '10px',
                        fontSize: '14px',
                        lineHeight: '1.5',
                        resize: 'vertical'
                    }}
                    placeholder="Describe your project or feature here..."
                />
                <button
                    onClick={handleGenerate}
                    disabled={isGenerating || !projectDescription.trim()}
                    style={{
                        backgroundColor: isGenerating ? '#0052CC80' : '#0052CC',
                        color: 'white',
                        padding: '8px 16px',
                        borderRadius: '3px',
                        border: 'none',
                        cursor: isGenerating || !projectDescription.trim() ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'background-color 0.2s ease'
                    }}
                >
                    {isGenerating ? 'Generating...' : 'Generate Tasks'}
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
                        Generated Task Structure:
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
                            <div style={{ marginLeft: '20px' }}>
                                {task.subtasks.map((subtask, subIndex) => (
                                    <div key={subIndex} style={{
                                        color: '#42526E',
                                        marginBottom: '4px',
                                        fontSize: '14px'
                                    }}>
                                        • {subtask.key}: {subtask.title}
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

export default WorkflowGPT;