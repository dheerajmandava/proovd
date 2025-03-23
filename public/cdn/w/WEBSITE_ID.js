/**
 * Proovd Loader Script
 * This script reads data attributes from its tag and loads the actual widget
 * Usage: <script src="https://cdn.proovd.in/w/WEBSITE_ID.js"></script>
 */
(function() {
  // Get the current script tag
  const script = document.currentScript;
  
  // Get website ID from the path
  const scriptSrc = script.src;
  const matches = scriptSrc.match(/\/w\/([^.]+)\.js/);
  
  if (!matches || !matches[1]) {
    console.error('Proovd: Could not determine website ID from script src');
    return;
  }
  
  const websiteId = matches[1];
  
  // Create the actual widget script element
  const widgetScript = document.createElement('script');
  widgetScript.src = `https://proovd.in/api/websites/${websiteId}/widget.js`;
  
  // Append to document
  document.body.appendChild(widgetScript);
})();
