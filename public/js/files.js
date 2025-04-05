// Files Module
const Files = (function() {
    // Private variables
    let groupFiles = [];
    
    // Cache DOM elements
    const $groupFiles = $('#group-files');
    const $noGroupFiles = $('#no-group-files');
    const $uploadFileForm = $('#upload-file-form');
    const $uploadFileError = $('#upload-file-error');
    const $uploadFileSubmit = $('#upload-file-submit');
    
    // Event bindings
    function bindEvents() {
      $uploadFileSubmit.on('click', handleFileUpload);
      
      // Delegate events for file download buttons
      $(document).on('click', '.download-file', handleFileDownload);
      
      // File input change to show preview
      $('#file-input').on('change', handleFileInputChange);
      
      // File remove button
      $(document).on('click', '.file-remove-btn', handleFileRemove);
      
      // Make the file upload area more interactive
      setupDragAndDrop();
    }
    
    // Handle file input change for preview
    function handleFileInputChange() {
      const fileInput = document.getElementById('file-input');
      const $filePreview = $('.file-preview');
      const $filePreviewName = $('.file-preview-name');
      const $filePreviewSize = $('.file-preview-size');
      const $filePreviewIcon = $('.file-preview-icon');
      
      if (fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const fileIcon = getFileIcon(file.type);
        
        $filePreviewName.text(file.name);
        $filePreviewSize.text(formatFileSize(file.size));
        $filePreviewIcon.removeClass().addClass(`bi ${fileIcon} file-preview-icon`);
        $filePreview.removeClass('d-none');
      } else {
        $filePreview.addClass('d-none');
      }
    }
    
    // Handle removing the selected file
    function handleFileRemove(e) {
      e.preventDefault();
      const fileInput = document.getElementById('file-input');
      fileInput.value = '';
      $('.file-preview').addClass('d-none');
    }
    
    // Setup drag and drop functionality
    function setupDragAndDrop() {
      const dropArea = document.querySelector('.file-upload-area');
      const fileInput = document.getElementById('file-input');
      
      // Prevent browser default behavior on drag and drop
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
      });
      
      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      // Highlight drop area when dragging over it
      ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, highlight, false);
      });
      
      ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, unhighlight, false);
      });
      
      function highlight() {
        dropArea.classList.add('border-primary');
      }
      
      function unhighlight() {
        dropArea.classList.remove('border-primary');
      }
      
      // Handle dropped files
      dropArea.addEventListener('drop', handleDrop, false);
      
      function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
          fileInput.files = files;
          handleFileInputChange();
        }
      }
      
      // Handle click to open file dialog
      dropArea.addEventListener('click', function() {
        fileInput.click();
      });
    }
    
    // Format file size
    function formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Format date for display
    function formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Get icon for file type
    function getFileIcon(fileType) {
      const iconMap = {
        'application/pdf': 'bi-file-pdf',
        'application/msword': 'bi-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'bi-file-word',
        'application/vnd.ms-excel': 'bi-file-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'bi-file-excel',
        'application/vnd.ms-powerpoint': 'bi-file-ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'bi-file-ppt',
        'image/jpeg': 'bi-file-image',
        'image/png': 'bi-file-image',
        'image/gif': 'bi-file-image',
        'text/plain': 'bi-file-text',
        'text/html': 'bi-file-code',
        'application/json': 'bi-file-code',
        'application/zip': 'bi-file-zip',
        'application/x-rar-compressed': 'bi-file-zip'
      };
      
      return iconMap[fileType] || 'bi-file';
    }
    
    // Handle file upload
    function handleFileUpload() {
      $uploadFileError.addClass('d-none');
      
      const $fileInput = $('#file-input');
      const description = $('#file-description').val() || '';
      const category = $('#file-category').val();
      
      if ($fileInput[0].files.length === 0) {
        $uploadFileError.text('Please select a file to upload').removeClass('d-none');
        return;
      }
      
      const file = $fileInput[0].files[0];
      
      const currentGroup = Groups.getCurrentGroup();
      if (!currentGroup) {
        $uploadFileError.text('No group selected').removeClass('d-none');
        return;
      }
      
      const user = Auth.getCurrentUser();
      
      // For demo purposes, create a file object locally
      // In a real application, this would be an API call with form data
      const newFile = {
        id: Date.now(), // Use timestamp as temporary ID
        groupId: currentGroup.id,
        filename: file.name,
        fileSize: file.size,
        fileType: file.type,
        description: description,
        category: category,
        uploadedAt: new Date(),
        uploadedBy: user,
        downloadUrl: '#' // Placeholder download URL
      };
      
      // Add to files array
      groupFiles.push(newFile);
      
      // Close modal
      $('#upload-file-modal').modal('hide');
      
      // Reset form
      $uploadFileForm[0].reset();
      
      // Reload files
      renderGroupFiles();
    }
    
    // Handle file download
    function handleFileDownload(e) {
      e.preventDefault();
      
      const fileId = $(this).data('file-id');
      const file = groupFiles.find(f => f.id === fileId);
      
      if (!file) {
        console.error('File not found');
        return;
      }
      
      // In a real application, this would redirect to a download URL
      // For demo purposes, just show an alert
      alert(`Downloading ${file.filename}...\n\nIn a real application, this would download the file.`);
    }
    
    // Render group files
    function renderGroupFiles() {
      if (groupFiles.length === 0) {
        $groupFiles.empty();
        $noGroupFiles.removeClass('d-none');
        return;
      }
      
      $noGroupFiles.addClass('d-none');
      
      // Group files by category
      const filesByCategory = {};
      
      groupFiles.forEach(file => {
        if (!filesByCategory[file.category]) {
          filesByCategory[file.category] = [];
        }
        filesByCategory[file.category].push(file);
      });
      
      let html = '';
      
      // Render files by category
      Object.keys(filesByCategory).forEach(category => {
        const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
        
        html += `
          <div class="category-section mb-4">
            <h5 class="category-title mb-3">
              <span class="badge bg-light text-dark px-3 py-2 file-category">${categoryName}</span>
            </h5>
            <div class="row row-cols-1 row-cols-md-2 g-4">
        `;
        
        filesByCategory[category].forEach(file => {
          const fileIcon = getFileIcon(file.fileType);
          const fileSize = formatFileSize(file.fileSize);
          const uploadDate = formatDate(file.uploadedAt);
          
          html += `
            <div class="col">
              <div class="card file-card h-100">
                <div class="card-body">
                  <div class="d-flex align-items-center mb-3">
                    <div class="file-icon me-3">
                      <i class="bi ${fileIcon}"></i>
                    </div>
                    <div class="flex-grow-1">
                      <h5 class="file-name">${file.filename}</h5>
                      <div class="text-muted small">${fileSize}</div>
                    </div>
                  </div>
                  <p class="file-description">${file.description || 'No description'}</p>
                  <div class="file-info">
                    <span class="text-muted">Uploaded: ${uploadDate}</span>
                    <span class="text-muted">By: ${file.uploadedBy.name}</span>
                  </div>
                </div>
                <div class="card-footer bg-transparent">
                  <button class="btn btn-sm btn-primary w-100 download-file" data-file-id="${file.id}">
                    <i class="bi bi-download me-1"></i> Download
                  </button>
                </div>
              </div>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
      
      $groupFiles.html(html);
    }
    
    // Load group files
    function loadGroupFiles(groupId) {
      // Check authentication
      if (!Auth.isAuthenticated()) {
        groupFiles = [];
        renderGroupFiles();
        return;
      }
      
      // For demo purposes, create mock files
      // In a real application, this would be an API call
      groupFiles = [
        {
          id: 1,
          groupId: groupId,
          filename: 'Lecture_Notes.pdf',
          fileSize: 2568237, // ~2.5 MB
          fileType: 'application/pdf',
          description: 'Lecture notes from last week',
          category: 'notes',
          uploadedAt: new Date(2025, 3, 1), // April 1, 2025
          uploadedBy: Auth.getCurrentUser(),
          downloadUrl: '#'
        },
        {
          id: 2,
          groupId: groupId,
          filename: 'Study_Guide.docx',
          fileSize: 1354288, // ~1.3 MB
          fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          description: 'Study guide for midterm exam',
          category: 'handout',
          uploadedAt: new Date(2025, 3, 2), // April 2, 2025
          uploadedBy: Auth.getCurrentUser(),
          downloadUrl: '#'
        }
      ];
      
      renderGroupFiles();
    }
    
    // Initialize files module
    function init() {
      bindEvents();
    }
    
    // Get files for a specific group
    function getFilesForGroup(groupId) {
      // This will be used by the files page to get all files
      if (!groupId) return [];
      
      // In real app, this would be an API call
      // Here we return the mock files if the groupId matches what we have
      return groupFiles.filter(file => file.groupId === groupId);
    }
    
    // Public API
    return {
      init,
      loadGroupFiles,
      getFilesForGroup,
      formatFileSize,
      getFileIcon
    };
  })();