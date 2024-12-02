// Create a new file: components/ConfluencePreviewEdit.jsx
import React, { useState } from 'react';

const ConfluencePreviewEdit = ({ preview, onConfirm, onCancel, isProcessing }) => {
    const [title, setTitle] = useState(preview.suggestedTitle);
    const [content, setContent] = useState(preview.content);

    return (
        <div style={{
            backgroundColor: '#F4F5F7',
            padding: '24px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(9, 30, 66, 0.13)'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                borderBottom: '2px solid #DFE1E6',
                paddingBottom: '16px'
            }}>
                <h3 style={{ 
                    color: '#172B4D',
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 'bold'
                }}>
                    Preview Confluence Page
                </h3>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '3px',
                            border: '1px solid #DFE1E6',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                        disabled={isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(title, content)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '3px',
                            border: 'none',
                            backgroundColor: '#0052CC',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                        disabled={isProcessing}
                    >
                        {isProcessing ? 'Creating Page...' : 'Create Confluence Page'}
                    </button>
                </div>
            </div>

            <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #DFE1E6',
                boxShadow: '0 1px 2px rgba(9, 30, 66, 0.08)'
            }}>
                {/* Page Title Section */}
                <div style={{
                    backgroundColor: '#DEEBFF',
                    margin: '-20px -20px 16px -20px',
                    padding: '12px 20px',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    borderBottom: '1px solid #B3D4FF'
                }}>
                    <div style={{ color: '#0747A6', fontSize: '13px', fontWeight: '500' }}>
                        Page Details
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{
                        display: 'block',
                        color: '#172B4D',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px'
                    }}>
                        Page Title
                    </label>
                    <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            border: '2px solid #DFE1E6',
                            borderRadius: '3px',
                            marginBottom: '16px'
                        }}
                    />

                    <label style={{
                        display: 'block',
                        color: '#172B4D',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '4px'
                    }}>
                        Page Content Preview
                    </label>
                    <div style={{
                        backgroundColor: '#FAFBFC',
                        padding: '16px',
                        borderRadius: '6px',
                        border: '1px solid #DFE1E6',
                        maxHeight: '400px',
                        overflow: 'auto',
                        fontSize: '14px'
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfluencePreviewEdit;