// static/hello-world/src/App.js
import React, { useState } from 'react';
import WorkflowGPT from './WorkflowGPT';
import MeetingNotes from './MeetingNotes'; // Verify this import

function App() {
    const [currentPage, setCurrentPage] = useState('workflow');
    
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Navigation Buttons */}
            <div style={{ marginBottom: '20px', borderBottom: '1px solid #DFE1E6', padding: '10px 0' }}>
                <button
                    onClick={() => setCurrentPage('workflow')}
                    style={{
                        padding: '8px 16px',
                        marginRight: '10px',
                        backgroundColor: currentPage === 'workflow' ? '#0052CC' : 'transparent',
                        color: currentPage === 'workflow' ? 'white' : '#172B4D',
                        border: currentPage === 'workflow' ? 'none' : '1px solid #DFE1E6',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    WorkflowGPT
                </button>
                <button
                    onClick={() => setCurrentPage('meeting')}
                    style={{
                        padding: '8px 16px',
                        marginRight: '10px',
                        backgroundColor: currentPage === 'meeting' ? '#0052CC' : 'transparent',
                        color: currentPage === 'meeting' ? 'white' : '#172B4D',
                        border: currentPage === 'meeting' ? 'none' : '1px solid #DFE1E6',
                        borderRadius: '3px',
                        cursor: 'pointer'
                    }}
                >
                    Meeting Notes
                </button>
            </div>

            {/* Content */}
            {currentPage === 'workflow' ? <WorkflowGPT /> : <MeetingNotes />}
        </div>
    );
}

export default App;