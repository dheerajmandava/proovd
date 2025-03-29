/**
 * ProovdPulse Loader Script
 * This script reads the website ID and loads the actual ProovdPulse widget
 * Usage: <script src="https://cdn.proovd.in/w/{WEBSITE_ID}/pulse.js"></script>
 */
(function() {
  // Get the current script tag
  const script = document.currentScript;
  
  // Get website ID from the path
  const scriptSrc = script.src;
  const matches = scriptSrc.match(/\/w\/([^\/]+)\/pulse\.js/);
  
  if (!matches || !matches[1]) {
    console.error('ProovdPulse: Could not determine website ID from script src');
    return;
  }
  
  const websiteId = matches[1];
  
  // Create the actual widget script element
  const pulseScript = document.createElement('script');
  pulseScript.async = true;
  pulseScript.src = `https://www.proovd.in/api/websites/${websiteId}/pulse-widget.js`;
  
  // Append to document
  document.head.appendChild(pulseScript);
})(); 