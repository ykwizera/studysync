// Meetings Module
const Meetings = (function() {
    // Private variables
    let meetings = [];
    let groupMeetings = [];
    
    // Cache DOM elements
    const $upcomingMeetings = $('#upcoming-meetings');
    const $noMeetingsMessage = $('#no-meetings-message');
    const $groupMeetings = $('#group-meetings');
    const $noGroupMeetings = $('#no-group-meetings');
    const $scheduleMeetingForm = $('#schedule-meeting-form');
    const $scheduleMeetingError = $('#schedule-meeting-error');
    const $scheduleMeetingSubmit = $('#schedule-meeting-submit');
    
    // Event bindings
    function bindEvents() {
      $scheduleMeetingSubmit.on('click', handleScheduleMeeting);
      
      // Use event delegation for RSVP buttons since they're dynamically created
      $(document).on('click', '.meeting-toggle', handleRSVP);
      
      // Duration preset buttons
      $(document).on('click', '.duration-preset', handleDurationPreset);
      
      // Set minimum date for meeting scheduling to today
      setMinimumDateForMeetingInput();
    }
    
    // Set duration from preset buttons
    function handleDurationPreset() {
      const duration = $(this).data('duration');
      $('#meeting-duration').val(duration);
      
      // Highlight the selected button
      $('.duration-preset').removeClass('btn-primary').addClass('btn-outline-secondary');
      $(this).removeClass('btn-outline-secondary').addClass('btn-primary');
    }
    
    // Set minimum date for meeting date input to prevent scheduling in the past
    function setMinimumDateForMeetingInput() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      const minDate = `${year}-${month}-${day}`;
      $('#meeting-date').attr('min', minDate);
    }
    
    // Format date for display
    function formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    }
    
    // Format time for display
    function formatTime(date) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    // Handle scheduling a new meeting
    function handleScheduleMeeting() {
      $scheduleMeetingError.addClass('d-none');
      
      const title = $('#meeting-title').val();
      const description = $('#meeting-description').val() || '';
      const dateStr = $('#meeting-date').val();
      const timeStr = $('#meeting-time').val();
      const duration = parseInt($('#meeting-duration').val());
      
      if (!title || !dateStr || !timeStr || isNaN(duration)) {
        $scheduleMeetingError.text('Please fill in all required fields').removeClass('d-none');
        return;
      }
      
      // Create datetime from date and time strings
      const dateTime = new Date(`${dateStr}T${timeStr}`);
      
      if (isNaN(dateTime.getTime())) {
        $scheduleMeetingError.text('Invalid date or time').removeClass('d-none');
        return;
      }
      
      const currentGroup = Groups.getCurrentGroup();
      if (!currentGroup) {
        $scheduleMeetingError.text('No group selected').removeClass('d-none');
        return;
      }
      
      const user = Auth.getCurrentUser();
      
      // For demo purposes, create a meeting locally
      // In a real application, this would be an API call
      const newMeeting = {
        id: Date.now(), // Use timestamp as temporary ID
        title: title,
        description: description,
        date: dateTime,
        duration: duration,
        groupId: currentGroup.id,
        createdBy: user.id,
        group: currentGroup,
        attendees: [
          {
            id: Date.now() + 1,
            userId: user.id,
            meetingId: Date.now(),
            status: true,
            user: user
          }
        ]
      };
      
      // Add to meetings array
      meetings.push(newMeeting);
      groupMeetings.push(newMeeting);
      
      // Close modal
      $('#schedule-meeting-modal').modal('hide');
      
      // Reset form
      $scheduleMeetingForm[0].reset();
      
      // Reload meetings
      renderGroupMeetings();
    }
    
    // Handle RSVP to meeting
    function handleRSVP() {
      const $button = $(this);
      const meetingId = $button.data('meeting-id');
      const currentStatus = $button.hasClass('btn-success');
      const newStatus = !currentStatus;
      
      // Update UI immediately for responsiveness
      if (newStatus) {
        $button
          .removeClass('btn-outline-success')
          .addClass('btn-success')
          .text('Going');
      } else {
        $button
          .removeClass('btn-success')
          .addClass('btn-outline-success')
          .text('Not Going');
      }
      
      // Update meeting in our arrays
      const meeting = meetings.find(m => m.id === meetingId);
      if (meeting) {
        const user = Auth.getCurrentUser();
        const attendee = meeting.attendees.find(a => a.userId === user.id);
        
        if (attendee) {
          attendee.status = newStatus;
        } else {
          meeting.attendees.push({
            id: Date.now(),
            userId: user.id,
            meetingId: meetingId,
            status: newStatus,
            user: user
          });
        }
      }
      
      // In a real application, this would be an API call
      // For demo purposes, we're just updating our local data
    }
    
    // Render upcoming meetings
    function renderUpcomingMeetings() {
      if (meetings.length === 0) {
        $upcomingMeetings.empty();
        $noMeetingsMessage.removeClass('d-none');
        return;
      }
      
      $noMeetingsMessage.addClass('d-none');
      
      // Sort meetings by date
      const sortedMeetings = [...meetings].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      // Take only upcoming meetings
      const now = new Date();
      const upcomingMeetings = sortedMeetings.filter(meeting => 
        new Date(meeting.date) > now
      ).slice(0, 5); // Limit to 5 meetings
      
      if (upcomingMeetings.length === 0) {
        $upcomingMeetings.empty();
        $noMeetingsMessage.removeClass('d-none');
        return;
      }
      
      let html = '';
      
      upcomingMeetings.forEach(meeting => {
        const dateStr = formatDate(meeting.date);
        const timeStr = formatTime(meeting.date);
        
        html += `
          <div class="meeting-item">
            <div class="d-flex justify-content-between">
              <h6 class="mb-1">${meeting.title}</h6>
              <span class="meeting-time">${timeStr}</span>
            </div>
            <div class="text-muted mb-2">${dateStr}</div>
            <div class="d-flex justify-content-between align-items-center">
              <small>${meeting.group ? meeting.group.name : 'Unknown Group'}</small>
              <a href="#group/${meeting.groupId}" class="btn btn-sm btn-outline-primary">View</a>
            </div>
          </div>
        `;
      });
      
      $upcomingMeetings.html(html);
    }
    
    // Render group meetings
    function renderGroupMeetings() {
      if (groupMeetings.length === 0) {
        $groupMeetings.empty();
        $noGroupMeetings.removeClass('d-none');
        return;
      }
      
      $noGroupMeetings.addClass('d-none');
      
      // Sort meetings by date
      const sortedMeetings = [...groupMeetings].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      // Separate upcoming and past meetings
      const now = new Date();
      const upcomingMeetings = sortedMeetings.filter(m => new Date(m.date) >= now);
      const pastMeetings = sortedMeetings.filter(m => new Date(m.date) < now);
      
      let html = '';
      
      // Upcoming meetings section
      if (upcomingMeetings.length > 0) {
        html += `
          <div class="meetings-section mb-4">
            <h5 class="meetings-title mb-3">
              <span class="badge bg-primary text-white px-3 py-2">Upcoming Meetings</span>
            </h5>
        `;
        
        upcomingMeetings.forEach(meeting => {
          const dateObj = new Date(meeting.date);
          const dateStr = formatDate(meeting.date);
          const timeStr = formatTime(meeting.date);
          const user = Auth.getCurrentUser();
          const attendee = meeting.attendees.find(a => a.userId === user.id);
          const isGoing = attendee && attendee.status;
          
          const buttonClass = isGoing ? 'btn-success' : 'btn-outline-success';
          const buttonText = isGoing ? 'Going' : 'Not Going';
          
          // Calculate days until meeting
          const daysDiff = Math.ceil((dateObj - now) / (1000 * 60 * 60 * 24));
          let timeUntil = '';
          
          if (daysDiff === 0) {
            timeUntil = 'Today';
          } else if (daysDiff === 1) {
            timeUntil = 'Tomorrow';
          } else {
            timeUntil = `In ${daysDiff} days`;
          }
          
          html += `
            <div class="meeting-item">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="meeting-title">${meeting.title}</h5>
                  <div class="meeting-date">${dateStr} at ${timeStr} <span class="badge bg-secondary ms-2">${timeUntil}</span></div>
                </div>
                <div class="meeting-time">${meeting.duration} min</div>
              </div>
              <p class="my-3">${meeting.description || 'No description'}</p>
              <div class="d-flex justify-content-between align-items-center">
                <div class="meeting-attendees">
                  <i class="bi bi-people"></i>
                  <span>${meeting.attendees.filter(a => a.status).length} attending</span>
                </div>
                <button class="btn btn-sm ${buttonClass} meeting-toggle" 
                      data-meeting-id="${meeting.id}">
                  ${buttonText}
                </button>
              </div>
            </div>
          `;
        });
        
        html += `</div>`;
      }
      
      // Past meetings section (collapsed by default)
      if (pastMeetings.length > 0) {
        html += `
          <div class="meetings-section">
            <div class="d-flex justify-content-between align-items-center mb-3">
              <h5 class="meetings-title mb-0">
                <span class="badge bg-light text-dark px-3 py-2">Past Meetings (${pastMeetings.length})</span>
              </h5>
              <button class="btn btn-sm btn-link" type="button" data-bs-toggle="collapse" data-bs-target="#pastMeetingsCollapse">
                Show/Hide
              </button>
            </div>
            <div class="collapse" id="pastMeetingsCollapse">
        `;
        
        pastMeetings.reverse().forEach(meeting => {
          const dateStr = formatDate(meeting.date);
          const timeStr = formatTime(meeting.date);
          const user = Auth.getCurrentUser();
          const attendee = meeting.attendees.find(a => a.userId === user.id);
          const isGoing = attendee && attendee.status;
          
          const buttonClass = isGoing ? 'btn-success' : 'btn-outline-success';
          const buttonText = isGoing ? 'Attended' : 'Did not attend';
          
          html += `
            <div class="meeting-item" style="opacity: 0.8;">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <h5 class="meeting-title">${meeting.title}</h5>
                  <div class="meeting-date">${dateStr} at ${timeStr}</div>
                </div>
                <div class="meeting-time">${meeting.duration} min</div>
              </div>
              <p class="my-3">${meeting.description || 'No description'}</p>
              <div class="d-flex justify-content-between align-items-center">
                <div class="meeting-attendees">
                  <i class="bi bi-people"></i>
                  <span>${meeting.attendees.filter(a => a.status).length} attended</span>
                </div>
                <button class="btn btn-sm ${buttonClass} meeting-toggle" 
                      data-meeting-id="${meeting.id}" disabled>
                  ${buttonText}
                </button>
              </div>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      }
      
      $groupMeetings.html(html);
    }
    
    // Load upcoming meetings
    function loadUpcomingMeetings() {
      // Check authentication
      if (!Auth.isAuthenticated()) {
        meetings = [];
        renderUpcomingMeetings();
        return;
      }
      
      $.ajax({
        url: '/api/meetings',
        method: 'GET',
        success: function(response) {
          meetings = response.data || [];
          renderUpcomingMeetings();
        },
        error: function() {
          meetings = [];
          renderUpcomingMeetings();
          console.error('Failed to load meetings');
        }
      });
    }
    
    // Load group meetings
    function loadGroupMeetings(groupId) {
      // Filter meetings for this group
      groupMeetings = meetings.filter(meeting => meeting.groupId === groupId);
      renderGroupMeetings();
      
      // In a real application, we might fetch meetings specifically for this group
      // if they're not already loaded
    }
    
    // Initialize meetings module
    function init() {
      bindEvents();
    }
    
    // Public API
    return {
      init,
      loadUpcomingMeetings,
      loadGroupMeetings
    };
  })();