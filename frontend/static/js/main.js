(() => {
  // Bootstrap helper: enable tooltips if any
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el))
})();


