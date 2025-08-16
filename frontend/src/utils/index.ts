/**
 * Utility function to hide any "0" counts in navigation elements
 * This function finds and hides any elements that contain only "0" as text
 */
export const hideZeroCounts = (): void => {
  // Find all navigation items
  const navItems = document.querySelectorAll('.nav-item-custom, .navbar-nav, .navbar');
  
  navItems.forEach((item) => {
    // Find any spans, badges, divs, or other elements that contain "0"
    const zeroElements = item.querySelectorAll('span, .badge, div, a, button');
    
    zeroElements.forEach((element) => {
      const text = element.textContent?.trim();
      if (text === '0') {
        (element as HTMLElement).style.display = 'none';
      }
    });
  });

  // Also check for any elements with data-count="0"
  const zeroCountElements = document.querySelectorAll('[data-count="0"]');
  zeroCountElements.forEach((element) => {
    (element as HTMLElement).style.display = 'none';
  });

  // Check for any notification badges with "0"
  const notificationBadges = document.querySelectorAll('.notification-badge, .badge');
  notificationBadges.forEach((badge) => {
    const text = badge.textContent?.trim();
    if (text === '0') {
      (badge as HTMLElement).style.display = 'none';
    }
  });

  // Check for any elements with class names that suggest they contain counts
  const countElements = document.querySelectorAll('.count, .notification-count, .badge-count');
  countElements.forEach((element) => {
    const text = element.textContent?.trim();
    if (text === '0') {
      (element as HTMLElement).style.display = 'none';
    }
  });
};

/**
 * Set up a mutation observer to continuously hide "0" counts
 * This ensures that dynamically added elements are also hidden
 */
export const setupZeroCountObserver = (): (() => void) => {
  const observer = new MutationObserver(() => {
    hideZeroCounts();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Return cleanup function
  return () => observer.disconnect();
};

/**
 * Initialize the zero count hiding functionality
 * This should be called when the app starts
 */
export const initZeroCountHiding = (): (() => void) => {
  // Hide counts immediately
  hideZeroCounts();
  
  // Set up observer for dynamic content
  const cleanup = setupZeroCountObserver();
  
  // Also hide counts after a short delay to catch any late-rendered elements
  const timeoutId = setTimeout(hideZeroCounts, 100);
  
  // Return cleanup function
  return () => {
    cleanup();
    clearTimeout(timeoutId);
  };
};
