import { useEffect } from 'react';

// Define window interface for event bus
declare global {
    interface Window {
        __SHELL_EVENT_BUS__?: {
            setModuleReady: (name: string) => void;
            on: (event: string, callback: (data?: any) => void) => () => void;
            emit: (event: string, data?: any) => void;
            isModuleReady: (name: string) => boolean;
        };
    }
}

export const useModuleLifecycle = (moduleName: string) => {
    useEffect(() => {
        const eventBus = window.__SHELL_EVENT_BUS__;

        if (eventBus) {
            console.log(`[${moduleName}] Signaling ready state`);
            eventBus.setModuleReady(moduleName);
        }

        return () => {
            console.log(`[${moduleName}] Cleanup`);
        };
    }, [moduleName]);

    return {
        emit: (event: string, data?: any) => {
            window.__SHELL_EVENT_BUS__?.emit(event, data);
        },
        on: (event: string, callback: (data?: any) => void) => {
            return window.__SHELL_EVENT_BUS__?.on(event, callback) || (() => {});
        },
    };
};