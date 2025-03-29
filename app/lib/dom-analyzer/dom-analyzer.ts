/**
 * DOM Analyzer Module
 * Tracks page elements and user interactions using Mutation Observer
 */

export interface ElementMetadata {
  element: HTMLElement;
  id: string;
  selector: string;
  rect: DOMRect;
  visibility: number; // 0-1 based on viewport visibility
  interactionCount: number;
  hoverTime: number;
  lastInteraction: number;
}

export interface HeatmapPoint {
  x: number;
  y: number;
  intensity: number; // 0-1
}

export interface HeatmapData {
  points: HeatmapPoint[];
  timestamp: number;
}

export class DOMAnalyzer {
  private observer: MutationObserver;
  private elementRegistry: Map<HTMLElement, ElementMetadata> = new Map();
  private interactionPoints: HeatmapPoint[] = [];
  private scrollDepth: number = 0;
  private timeOnPage: number = 0;
  private pageLoadTime: number = Date.now();
  private isRecording: boolean = false;
  private interactionInterval: any = null;
  
  constructor() {
    // Initialize MutationObserver
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    
    // Start timer for time on page
    setInterval(() => {
      if (this.isRecording && document.visibilityState === 'visible') {
        this.timeOnPage += 1;
      }
    }, 1000);
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
  }
  
  /**
   * Start analyzing the DOM
   */
  public start(targetNode: Node = document.body): void {
    this.isRecording = true;
    
    // Observe DOM changes
    this.observer.observe(targetNode, {
      subtree: true,
      childList: true,
      attributes: true
    });
    
    // Register existing elements
    this.registerVisibleElements();
    
    // Set up scroll tracking
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    
    // Set up interaction tracking
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), { passive: true });
    document.addEventListener('click', this.handleClick.bind(this), { passive: true });
    
    // Periodic updates
    this.interactionInterval = setInterval(() => {
      this.updateElementVisibility();
    }, 2000);
    
    console.log('ProovdPulse: DOM Analyzer started');
  }
  
  /**
   * Stop analyzing the DOM
   */
  public stop(): void {
    this.isRecording = false;
    this.observer.disconnect();
    
    // Remove event listeners
    window.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('click', this.handleClick.bind(this));
    
    if (this.interactionInterval) {
      clearInterval(this.interactionInterval);
    }
    
    console.log('ProovdPulse: DOM Analyzer stopped');
  }
  
  /**
   * Get current heatmap data
   */
  public getHeatmapData(): HeatmapData {
    return {
      points: [...this.interactionPoints],
      timestamp: Date.now()
    };
  }
  
  /**
   * Get engagement metrics
   */
  public getEngagementMetrics() {
    const pageHeight = Math.max(
      document.body.scrollHeight, 
      document.documentElement.scrollHeight,
      document.body.offsetHeight, 
      document.documentElement.offsetHeight
    );
    
    const viewportHeight = window.innerHeight;
    const maxScrollDepth = pageHeight - viewportHeight;
    const scrollPercentage = maxScrollDepth > 0 ? (this.scrollDepth / maxScrollDepth) * 100 : 100;
    
    return {
      timeOnPage: this.timeOnPage,
      scrollDepth: this.scrollDepth,
      scrollPercentage: Math.min(Math.round(scrollPercentage), 100),
      interactionPoints: this.interactionPoints.length,
      focusedElements: Array.from(this.elementRegistry.values())
        .filter(el => el.interactionCount > 0)
        .sort((a, b) => b.interactionCount - a.interactionCount)
        .slice(0, 5)
    };
  }
  
  /**
   * Process DOM mutations
   */
  private handleMutations(mutations: MutationRecord[]): void {
    if (!this.isRecording) return;
    
    let needsUpdate = false;
    
    for (const mutation of mutations) {
      // Handle added nodes
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            this.registerElement(node as HTMLElement);
            needsUpdate = true;
          }
        });
      }
      
      // Handle attribute changes
      if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
        this.updateElementMetadata(mutation.target as HTMLElement);
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      this.updateElementVisibility();
    }
  }
  
  /**
   * Register all visible elements in the viewport
   */
  private registerVisibleElements(): void {
    const elements = document.querySelectorAll('a, button, input, select, textarea, [role="button"], img, h1, h2, h3, h4, h5, h6');
    
    elements.forEach(element => {
      this.registerElement(element as HTMLElement);
    });
    
    this.updateElementVisibility();
  }
  
  /**
   * Register a single element
   */
  private registerElement(element: HTMLElement): void {
    if (this.elementRegistry.has(element)) return;
    
    const id = this.generateElementId(element);
    const selector = this.generateSelector(element);
    
    this.elementRegistry.set(element, {
      element,
      id,
      selector,
      rect: element.getBoundingClientRect(),
      visibility: 0,
      interactionCount: 0,
      hoverTime: 0,
      lastInteraction: 0
    });
  }
  
  /**
   * Update element metadata when attributes change
   */
  private updateElementMetadata(element: HTMLElement): void {
    if (!this.elementRegistry.has(element)) return;
    
    const metadata = this.elementRegistry.get(element)!;
    metadata.rect = element.getBoundingClientRect();
    this.elementRegistry.set(element, metadata);
  }
  
  /**
   * Update element visibility based on viewport
   */
  private updateElementVisibility(): void {
    if (!this.isRecording) return;
    
    this.elementRegistry.forEach((metadata, element) => {
      if (!element.isConnected) {
        // Element was removed from DOM
        this.elementRegistry.delete(element);
        return;
      }
      
      const rect = element.getBoundingClientRect();
      metadata.rect = rect;
      
      // Calculate visibility (0-1) based on how much is in viewport
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Element is outside viewport
      if (
        rect.bottom < 0 ||
        rect.top > viewportHeight ||
        rect.right < 0 ||
        rect.left > viewportWidth
      ) {
        metadata.visibility = 0;
        return;
      }
      
      // Calculate visible area percentage
      const visibleHeight = Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
      const visibleWidth = Math.min(rect.right, viewportWidth) - Math.max(rect.left, 0);
      
      const visibleArea = visibleHeight * visibleWidth;
      const totalArea = rect.height * rect.width;
      
      metadata.visibility = totalArea > 0 ? Math.min(visibleArea / totalArea, 1) : 0;
    });
  }
  
  /**
   * Handle scroll events
   */
  private handleScroll(): void {
    if (!this.isRecording) return;
    
    this.scrollDepth = Math.max(
      this.scrollDepth,
      window.scrollY
    );
    
    this.updateElementVisibility();
  }
  
  /**
   * Handle mouse movement
   */
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isRecording) return;
    
    // Sample mouse movements (don't record every pixel movement)
    if (Math.random() > 0.1) return;
    
    const point = {
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100,
      intensity: 0.3 // Lower intensity for mouse movements
    };
    
    this.addInteractionPoint(point);
    
    // Check for elements at this position
    const element = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement;
    if (element) {
      this.recordElementInteraction(element);
    }
  }
  
  /**
   * Handle click events
   */
  private handleClick(event: MouseEvent): void {
    if (!this.isRecording) return;
    
    const point = {
      x: (event.clientX / window.innerWidth) * 100,
      y: (event.clientY / window.innerHeight) * 100,
      intensity: 1.0 // High intensity for clicks
    };
    
    this.addInteractionPoint(point);
    
    // Record click on element
    const element = event.target as HTMLElement;
    if (element) {
      this.recordElementInteraction(element, 5); // Higher weight for clicks
    }
  }
  
  /**
   * Record interaction with an element
   */
  private recordElementInteraction(element: HTMLElement, weight: number = 1): void {
    if (!element) return;
    
    // Traverse up to find registered element
    let currentElement: HTMLElement | null = element;
    while (currentElement) {
      if (this.elementRegistry.has(currentElement)) {
        const metadata = this.elementRegistry.get(currentElement)!;
        metadata.interactionCount += weight;
        metadata.lastInteraction = Date.now();
        break;
      }
      currentElement = currentElement.parentElement;
    }
  }
  
  /**
   * Add interaction point to heatmap
   * Limits total points to prevent memory issues
   */
  private addInteractionPoint(point: HeatmapPoint): void {
    this.interactionPoints.push(point);
    
    // Limit total points to 1000
    if (this.interactionPoints.length > 1000) {
      this.interactionPoints = this.interactionPoints.slice(-1000);
    }
  }
  
  /**
   * Handle visibility change events
   */
  private handleVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      // User returned to the page
      console.log('ProovdPulse: User returned to page');
    } else {
      // User left the page
      console.log('ProovdPulse: User left page');
    }
  }
  
  /**
   * Generate a unique ID for an element
   */
  private generateElementId(element: HTMLElement): string {
    return element.id || 
      element.getAttribute('data-testid') || 
      element.getAttribute('name') || 
      `proovd-el-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Generate a CSS selector for an element
   */
  private generateSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    let selector = element.tagName.toLowerCase();
    
    if (element.className) {
      const classes = element.className.split(' ')
        .filter(c => c && !c.includes('proovd-'));
      
      if (classes.length > 0) {
        selector += '.' + classes.join('.');
      }
    }
    
    return selector;
  }
} 