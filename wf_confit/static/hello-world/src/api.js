import { invoke } from '@forge/bridge';

export const createSummaryPage = async (data) => {
    return await invoke('handleJiraEvent', data);
};