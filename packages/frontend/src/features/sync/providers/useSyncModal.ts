import { useContext } from 'react';
import SyncModalContext from './context';

export const useSyncModal = () => {
    const context = useContext(SyncModalContext);
    if (!context) {
        throw new Error(
            'useSyncWithGoogleSheets must be used within a SyncModalProvider',
        );
    }
    return context;
};
