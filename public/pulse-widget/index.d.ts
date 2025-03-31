/**
 * ProovdPulse Widget Entry Point
 * This is the main entry point for the ProovdPulse widget
 */
import { PulseWidget } from './pulse-ui';
declare global {
    interface Window {
        ProovdPulse?: {
            init: (websiteId: string, options?: any) => void;
            getInstance: () => PulseWidget | null;
            version: string;
        };
    }
}
/**
 * Initialize the ProovdPulse widget
 */
declare function init(websiteId: string, options?: any): PulseWidget | null;
/**
 * Get the current widget instance
 */
declare function getInstance(): PulseWidget | null;
export { init, getInstance };
