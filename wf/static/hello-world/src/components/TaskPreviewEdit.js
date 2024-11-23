import React, { useState } from 'react';

const TaskPreviewEdit = ({ tasks, onUpdate, onConfirm, onCancel }) => {
    const [editedTasks, setEditedTasks] = useState(tasks);

    const updateTask = (taskIndex, field, value) => {
        const newTasks = [...editedTasks];
        newTasks[taskIndex] = { ...newTasks[taskIndex], [field]: value };
        setEditedTasks(newTasks);
        onUpdate(newTasks);
    };

    const updateSubtask = (taskIndex, subtaskIndex, field, value) => {
        const newTasks = [...editedTasks];
        newTasks[taskIndex].subtasks[subtaskIndex] = {
            ...newTasks[taskIndex].subtasks[subtaskIndex],
            [field]: value
        };
        setEditedTasks(newTasks);
        onUpdate(newTasks);
    };

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
                    Preview and Edit Tasks
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
                            fontWeight: '500',
                            transition: 'background-color 0.2s',
                            ':hover': {
                                backgroundColor: '#F4F5F7'
                            }
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(editedTasks)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '3px',
                            border: 'none',
                            backgroundColor: '#0052CC',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'background-color 0.2s',
                            ':hover': {
                                backgroundColor: '#0065FF'
                            }
                        }}
                    >
                        Create Jira Issues
                    </button>
                </div>
            </div>

            {editedTasks.map((task, taskIndex) => (
                <div
                    key={taskIndex}
                    style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #DFE1E6',
                        boxShadow: '0 1px 2px rgba(9, 30, 66, 0.08)'
                    }}
                >
                    {/* Task header */}
                    <div style={{
                        backgroundColor: '#DEEBFF',
                        margin: '-20px -20px 16px -20px',
                        padding: '12px 20px',
                        borderTopLeftRadius: '8px',
                        borderTopRightRadius: '8px',
                        borderBottom: '1px solid #B3D4FF'
                    }}>
                        <div style={{ color: '#0747A6', fontSize: '13px', fontWeight: '500' }}>
                            Main Task {taskIndex + 1}
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
                            Title
                        </label>
                        <input
                            value={task.title}
                            onChange={(e) => updateTask(taskIndex, 'title', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                fontWeight: '500',
                                border: '2px solid #DFE1E6',
                                borderRadius: '3px',
                                marginBottom: '12px',
                                transition: 'border-color 0.2s',
                                ':focus': {
                                    borderColor: '#4C9AFF',
                                    outline: 'none'
                                }
                            }}
                        />
                        <label style={{
                            display: 'block',
                            color: '#172B4D',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginBottom: '4px'
                        }}>
                            Description
                        </label>
                        <textarea
                            value={task.description}
                            onChange={(e) => updateTask(taskIndex, 'description', e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '2px solid #DFE1E6',
                                borderRadius: '3px',
                                minHeight: '80px',
                                resize: 'vertical',
                                transition: 'border-color 0.2s',
                                ':focus': {
                                    borderColor: '#4C9AFF',
                                    outline: 'none'
                                }
                            }}
                        />
                        <label style={{
                            display: 'block',
                            color: '#172B4D',
                            fontSize: '14px',
                            fontWeight: '500',
                            marginTop: '12px',
                            marginBottom: '4px'
                        }}>
                            Assignee
                        </label>
                        <input
                            value={task.assignee || ''}
                            onChange={(e) => updateTask(taskIndex, 'assignee', e.target.value)}
                            placeholder="Enter assignee name"
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '2px solid #DFE1E6',
                                borderRadius: '3px',
                                transition: 'border-color 0.2s',
                                ':focus': {
                                    borderColor: '#4C9AFF',
                                    outline: 'none'
                                }
                            }}
                        />
                    </div>

                    <div style={{ marginTop: '24px' }}>
                        <h4 style={{ 
                            color: '#172B4D',
                            fontSize: '16px',
                            marginBottom: '16px',
                            fontWeight: '500'
                        }}>
                            Subtasks
                        </h4>
                        {task.subtasks.map((subtask, subtaskIndex) => (
                            <div
                                key={subtaskIndex}
                                style={{
                                    backgroundColor: '#FAFBFC',
                                    padding: '16px',
                                    borderRadius: '6px',
                                    marginBottom: '12px',
                                    border: '1px solid #DFE1E6',
                                    borderLeft: '4px solid #6554C0'
                                }}
                            >
                                <div style={{
                                    color: '#6B778C',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    marginBottom: '8px'
                                }}>
                                    Subtask {subtaskIndex + 1}
                                </div>
                                <input
                                    value={subtask.title}
                                    onChange={(e) => updateSubtask(taskIndex, subtaskIndex, 'title', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: '2px solid #DFE1E6',
                                        borderRadius: '3px',
                                        marginBottom: '8px',
                                        backgroundColor: 'white'
                                    }}
                                    placeholder="Subtask title"
                                />
                                <textarea
                                    value={subtask.description}
                                    onChange={(e) => updateSubtask(taskIndex, subtaskIndex, 'description', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: '2px solid #DFE1E6',
                                        borderRadius: '3px',
                                        minHeight: '60px',
                                        resize: 'vertical',
                                        marginBottom: '8px',
                                        backgroundColor: 'white'
                                    }}
                                    placeholder="Subtask description"
                                />
                                <input
                                    value={subtask.assignee || ''}
                                    onChange={(e) => updateSubtask(taskIndex, subtaskIndex, 'assignee', e.target.value)}
                                    placeholder="Assignee (optional)"
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        fontSize: '14px',
                                        border: '2px solid #DFE1E6',
                                        borderRadius: '3px',
                                        backgroundColor: 'white'
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TaskPreviewEdit;