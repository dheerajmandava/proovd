/**
 * ProovdPulse UI Component
 * Renders the visual elements of the ProovdPulse widget
 */
export interface PulseUIOptions {
    container: string | HTMLElement;
    theme?: 'light' | 'dark';
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    showPulse?: boolean;
    pulseColor?: string;
    textColor?: string;
    backgroundColor?: string;
    fontFamily?: string;
    fontSize?: string;
    borderRadius?: string;
    boxShadow?: string;
    zIndex?: number;
}
export declare class PulseUI {
    private container;
    private widget;
    private userCountElement;
    private options;
    private activeUsers;
    constructor(options: PulseUIOptions);
    /**
     * Create and mount the widget
     */
    mount(): void;
    /**
     * Update the active user count
     */
    updateUserCount(count: number): void;
    /**
     * Unmount the widget
     */
    unmount(): void;
    /**
     * Apply CSS styles to an element
     */
    private applyStyles;
    /**
     * Get position styles based on the position option
     */
    private getPositionStyles;
}
