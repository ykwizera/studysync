// Main Application Module
const App = (function() {
    // Private variables
    const pages = ['auth', 'dashboard', 'people', 'files', 'group', 'not-found'];
    let currentPage = '';
    let currentGroupId = null;
    let isMobileMenuOpen = false;
    
    // Cache DOM elements
    const $navLinks = $('.nav-link');
    const $backToDashboard = $('#back-to-dashboard');
    const $goToDashboard = $('#go-to-dashboard');
    const $sidebarToggle = $('#sidebar-toggle');
    const $sidebar = $('.sidebar');
    const $contentWrapper = $('.content-wrapper');
    const $mobileJoinGroup = $('#mobile-join-group');
    const $mobileCreateGroup = $('#mobile-create-group');
    
    // Event bindings
    function bindEvents() {
      // Navigation
      $navLinks.on('click', function(e) {
        e.preventDefault();
        const page = $(this).data('page');
        navigateTo(page);
        
        // Close sidebar on mobile after navigation
        if ($(window).width() < 768) {
          toggleSidebar(false);
        }
      });
      
      // Sidebar toggle
      $sidebarToggle.on('click', function() {
        toggleSidebar(!isMobileMenuOpen);
      });
      
      // Back button on group page
      $backToDashboard.on('click', function(e) {
        e.preventDefault();
        navigateTo('dashboard');
      });
      
      // 404 page button
      $goToDashboard.on('click', function(e) {
        e.preventDefault();
        navigateTo('dashboard');
      });
      
      // Mobile buttons for modals
      $mobileJoinGroup.on('click', function(e) {
        e.preventDefault();
        $('#join-group-modal').modal('show');
        toggleSidebar(false);
      });
      
      $mobileCreateGroup.on('click', function(e) {
        e.preventDefault();
        $('#create-group-modal').modal('show');
        toggleSidebar(false);
      });
      
      // Handle URL hash changes for navigation
      $(window).on('hashchange', handleHashChange);
      
      // Close sidebar when clicking outside on mobile
      $(document).on('click', function(e) {
        if ($(window).width() < 768 && isMobileMenuOpen && 
            !$(e.target).closest('.sidebar, #sidebar-toggle').length) {
          toggleSidebar(false);
        }
      });
    }
    
    // Toggle sidebar (for mobile)
    function toggleSidebar(open) {
      isMobileMenuOpen = open;
      if (open) {
        $sidebar.addClass('mobile-open');
        $('body').addClass('sidebar-open');
      } else {
        $sidebar.removeClass('mobile-open');
        $('body').removeClass('sidebar-open');
      }
    }
    
    // Initialize application
    function init() {
      bindEvents();
      handleHashChange();
      
      // Initialize other modules
      Auth.init();
      People.init();
      Groups.init();
      Meetings.init();
      Files.init();
      Chat.init();
    }
    
    // Handle URL hash changes
    function handleHashChange() {
      const hash = window.location.hash.substring(1);
      
      if (hash === 'register') {
        // Special case: direct link to register form
        showPage('auth');
        setTimeout(() => {
          if (typeof Auth !== 'undefined' && Auth.showRegisterForm) {
            Auth.showRegisterForm();
          }
        }, 100);
        return;
      }
      
      if (hash.startsWith('group/')) {
        const groupId = parseInt(hash.split('/')[1]);
        if (!isNaN(groupId)) {
          loadGroup(groupId);
          return;
        }
      }
      
      const page = hash || 'auth';
      if (pages.includes(page)) {
        showPage(page);
      } else {
        showPage('not-found');
      }
    }
    
    // Show specific page
    function showPage(page) {
      // Toggle auth-page class on body based on page
      if (page === 'auth') {
        $('body').addClass('auth-page');
      } else {
        $('body').removeClass('auth-page');
      }
      
      // Check authentication first for all restricted pages
      if (page !== 'auth' && !Auth.isAuthenticated()) {
        // Only show the auth page if not authenticated
        $('.page').addClass('d-none');
        $('#auth-page').removeClass('d-none');
        
        // Hide sidebar when not authenticated
        $('body').addClass('sidebar-collapsed');
        
        // Apply auth page styling
        $('body').addClass('auth-page');
        
        // Update current page to auth
        currentPage = 'auth';
        
        return;
      }
      
      // Show sidebar when authenticated
      $('body').removeClass('sidebar-collapsed');
      
      // Hide all pages
      $('.page').addClass('d-none');
      
      // Show requested page
      $(`#${page}-page`).removeClass('d-none');
      
      // Update navigation
      $navLinks.removeClass('active');
      $(`.nav-link[data-page="${page}"]`).addClass('active');
      
      // Update current page
      currentPage = page;
      
      // Page-specific actions
      if (page === 'dashboard') {
        Groups.loadGroups();
        Meetings.loadUpcomingMeetings();
        updateSidebarGroups();
      } else if (page === 'people') {
        People.init();
      } else if (page === 'files') {
        loadAllFiles();
      }
    }
    
    // Load group page
    function loadGroup(groupId) {
      if (!Auth.isAuthenticated()) {
        navigateTo('auth');
        return;
      }
      
      currentGroupId = groupId;
      Groups.loadGroupDetails(groupId);
      showPage('group');
    }
    
    // Navigate to a page
    function navigateTo(page, id) {
      if (page === 'group' && id) {
        window.location.hash = `group/${id}`;
      } else {
        window.location.hash = page;
      }
    }
    
    // Get current group ID
    function getCurrentGroupId() {
      return currentGroupId;
    }
    
    // Update sidebar groups list
    function updateSidebarGroups() {
      if (!Auth.isAuthenticated()) return;
      
      const groups = Groups.getGroups();
      const $sidebarGroups = $('#sidebar-groups');
      const $sidebarNoGroups = $('#sidebar-no-groups');
      
      if (groups.length === 0) {
        $sidebarGroups.html('');
        $sidebarNoGroups.removeClass('d-none');
        return;
      }
      
      $sidebarNoGroups.addClass('d-none');
      let html = '';
      
      groups.forEach(group => {
        html += `
          <li class="nav-item">
            <a class="nav-link" href="#group/${group.id}">
              <i class="bi bi-people-fill"></i> ${group.name}
            </a>
          </li>
        `;
      });
      
      // Keep only the dynamic group items
      $sidebarGroups.find('.nav-item:not(#sidebar-no-groups)').remove();
      $sidebarGroups.append(html);
    }
    
    // Load all files for the files page
    function loadAllFiles() {
      if (!Auth.isAuthenticated()) return;
      
      // We'll get files from all groups
      const allFiles = [];
      const groups = Groups.getGroups();
      
      // For this demo, we'll just combine files from all groups
      groups.forEach(group => {
        // Call the Files module to get files for this group
        const groupFiles = Files.getFilesForGroup(group.id);
        
        // Add the group info to each file
        groupFiles.forEach(file => {
          allFiles.push({
            ...file,
            groupName: group.name,
            groupId: group.id
          });
        });
      });
      
      renderAllFiles(allFiles);
    }
    
    // Render all files in the files page
    function renderAllFiles(files) {
      const $allFilesList = $('#all-files-list');
      const $noFilesMessage = $('#no-files-message');
      
      if (files.length === 0) {
        $allFilesList.html('');
        $noFilesMessage.removeClass('d-none');
        return;
      }
      
      $noFilesMessage.addClass('d-none');
      let html = '';
      
      // Sort files by upload date, newest first
      const sortedFiles = [...files].sort((a, b) => 
        new Date(b.uploadedAt) - new Date(a.uploadedAt)
      );
      
      sortedFiles.forEach(file => {
        const fileIcon = Files.getFileIcon(file.fileType);
        const categoryName = file.category.charAt(0).toUpperCase() + file.category.slice(1);
        
        html += `
          <div class="file-list-item">
            <div class="file-list-name">
              <i class="bi ${fileIcon}"></i>
              <div>
                <span class="d-block">${file.filename}</span>
                <small class="text-muted">${Files.formatFileSize(file.fileSize)}</small>
              </div>
            </div>
            <div>
              <span class="badge bg-light text-primary">${categoryName}</span>
            </div>
            <div>${file.uploadedBy.name}</div>
            <div class="file-list-actions">
              <button class="btn btn-sm btn-primary download-file" data-file-id="${file.id}">
                <i class="bi bi-download"></i>
              </button>
              <a href="#group/${file.groupId}" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-people"></i>
              </a>
            </div>
          </div>
        `;
      });
      
      $allFilesList.html(html);
    }
    
    // Public API
    return {
      init,
      navigateTo,
      getCurrentGroupId,
      updateSidebarGroups
    };
  })();
  
  // Initialize application when DOM is ready
  $(document).ready(function() {
    App.init();
  });