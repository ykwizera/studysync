/**
 * Utility functions for the Study Session Scheduler application
 */

const utils = {
    /**
     * Creates an element from a template
     * @param {string} templateId - The ID of the template to use
     * @returns {HTMLElement} The created element
     */
    createElementFromTemplate: (templateId) => {
      const template = document.getElementById(templateId);
      if (!template) {
        console.error(`Template not found: ${templateId}`);
        return null;
      }
      return document.importNode(template.content, true);
    },
  
    /**
     * Shows a toast notification
     * @param {string} message - The message to display
     * @param {string} type - The type of toast (success, error, info)
     */
    showToast: (message, type = 'info') => {
      const toast = utils.createElementFromTemplate('toast-template');
      const toastEl = toast.querySelector('.toast');
      const messageEl = toast.querySelector('.toast-message');
      const iconEl = toast.querySelector('.toast-icon');
      
      messageEl.textContent = message;
      toastEl.classList.add(`toast-${type}`);
      
      // Set icon based on type
      if (type === 'success') {
        iconEl.classList.add('fas', 'fa-check-circle');
      } else if (type === 'error') {
        iconEl.classList.add('fas', 'fa-exclamation-circle');
      } else {
        iconEl.classList.add('fas', 'fa-info-circle');
      }
      
      document.body.appendChild(toast);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      }, 5000);
      
      // Add close button functionality
      const closeBtn = toastEl.querySelector('.toast-close');
      closeBtn.addEventListener('click', () => {
        if (toastEl.parentNode) {
          toastEl.parentNode.removeChild(toastEl);
        }
      });
    },
  
    /**
     * Formats a date string to a user-friendly format
     * @param {string} dateString - The date string to format
     * @returns {string} The formatted date
     */
    formatDate: (dateString) => {
      if (!dateString) return 'No date';
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    },
  
    /**
     * Formats a time string to a user-friendly format
     * @param {string} timeString - The time string to format (HH:MM)
     * @returns {string} The formatted time
     */
    formatTime: (timeString) => {
      if (!timeString) return '';
      
      try {
        // If it's a full date-time string, extract the time part
        if (timeString.includes('T')) {
          const date = new Date(timeString);
          return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
        
        // Otherwise, assume it's just a time string (HH:MM)
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours, 10));
        date.setMinutes(parseInt(minutes, 10));
        return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      } catch (error) {
        console.error('Error formatting time:', error);
        return timeString;
      }
    },
  
    /**
     * Combines date and time strings into an ISO date string
     * @param {string} dateString - The date string (YYYY-MM-DD)
     * @param {string} timeString - The time string (HH:MM)
     * @returns {string} The combined ISO date string
     */
    combineDateTime: (dateString, timeString) => {
      if (!dateString || !timeString) return null;
      return `${dateString}T${timeString}:00`;
    },
  
    /**
     * Shows a modal element
     * @param {HTMLElement} modalElement - The modal element to show
     */
    showModal: (modalElement) => {
      document.body.appendChild(modalElement);
      
      // Add event listeners for close buttons
      const closeBtns = modalElement.querySelectorAll('.close-modal-btn, .cancel-modal-btn');
      closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          utils.closeModal(modalElement);
        });
      });
      
      // Close on click outside
      modalElement.querySelector('.modal-overlay').addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
          utils.closeModal(modalElement);
        }
      });
    },
  
    /**
     * Closes a modal element
     * @param {HTMLElement} modalElement - The modal element to close
     */
    closeModal: (modalElement) => {
      if (modalElement && modalElement.parentNode) {
        modalElement.parentNode.removeChild(modalElement);
      }
    },
  
    /**
     * Clears the content of an element
     * @param {HTMLElement} element - The element to clear
     */
    clearElement: (element) => {
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
    },
  
    /**
     * Handles form submission
     * @param {Event} event - The form submission event
     * @param {Function} callback - The callback function to call with the form data
     */
    handleFormSubmit: (event, callback) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = {};
      
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }
      
      callback(data);
    },
  
    /**
     * Sets active navigation item
     * @param {string} page - The page to set as active
     */
    setActivePage: (page) => {
      const navItems = document.querySelectorAll('.nav-item');
      navItems.forEach(item => {
        if (item.dataset.page === page) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    }
  };
  
  // Export utils object
  window.utils = utils;