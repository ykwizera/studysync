/**
 * Templates Module - Contains HTML templates for the application
 */
const Templates = (function() {
    /**
     * Dashboard page template
     */
    function dashboardTemplate(data) {
      const user = Auth.getCurrentUser();
      
      if (!user) {
        return `
          <div class="text-center py-5">
            <h2>Welcome to StudySync</h2>
            <p class="lead">Please log in or register to access your dashboard</p>
            <div class="mt-4">
              <button class="btn btn-primary btn-lg me-2" id="welcome-login-btn">Login</button>
              <button class="btn btn-outline-primary btn-lg" id="welcome-register-btn">Register</button>
            </div>
          </div>
        `;
      }
      
      // Extract relevant data
      const { upcomingSessions = [], recentFiles = [], groups = [], stats = {} } = data || {};
      
      // Generate upcoming sessions HTML
      let sessionsHtml = '';
      if (upcomingSessions.length === 0) {
        sessionsHtml = `
          <div class="text-center py-4">
            <p class="text-muted">No upcoming sessions scheduled</p>
            <button class="btn btn-sm btn-primary mt-2" id="schedule-session-btn">
              <i class="fas fa-plus me-1"></i> Schedule Session
            </button>
          </div>
        `;
      } else {
        sessionsHtml = `
          <div class="list-group">
            ${upcomingSessions.map(session => `
              <div class="list-group-item">
                <div class="d-flex w-100 justify-content-between">
                  <h6 class="mb-1">${session.title}</h6>
                  <small>${Utils.formatDate(session.date, 'short')}, ${Utils.formatTime(session.startTime)}</small>
                </div>
                <p class="mb-1 small">${session.group.name}</p>
                <div class="d-flex justify-content-between align-items-center">
                  <small class="text-muted">
                    <i class="fas fa-map-marker-alt me-1"></i> ${session.location || 'No location specified'}
                  </small>
                  <span class="badge bg-${session.userStatus === 'going' ? 'success' : 'secondary'} rounded-pill">
                    ${session.userStatus === 'going' ? 'Going' : 'Pending'}
                  </span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="text-center mt-3">
            <a href="#" class="btn btn-sm btn-outline-primary" data-page="calendar">View All Sessions</a>
          </div>
        `;
      }
      
      // Generate recent files HTML
      let filesHtml = '';
      if (recentFiles.length === 0) {
        filesHtml = `
          <div class="text-center py-4">
            <p class="text-muted">No files uploaded yet</p>
            <button class="btn btn-sm btn-primary mt-2" id="upload-file-btn">
              <i class="fas fa-upload me-1"></i> Upload File
            </button>
          </div>
        `;
      } else {
        filesHtml = `
          <ul class="list-group">
            ${recentFiles.map(file => `
              <li class="list-group-item">
                <div class="d-flex align-items-center">
                  <div class="me-3 text-center" style="width: 40px;">
                    <i class="fas ${Utils.getFileIcon(file.type)} fa-2x text-muted"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="mb-0">${file.name}</h6>
                    <p class="mb-0 small text-muted">
                      ${file.group.name} • ${Utils.formatFileSize(file.size)}
                    </p>
                    <small class="text-muted">Uploaded ${Utils.formatDate(file.uploadedAt, 'relative')}</small>
                  </div>
                  <a href="${file.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-download"></i>
                  </a>
                </div>
              </li>
            `).join('')}
          </ul>
          <div class="text-center mt-3">
            <a href="#" class="btn btn-sm btn-outline-primary" data-page="files">View All Files</a>
          </div>
        `;
      }
      
      // Generate groups HTML
      let groupsHtml = '';
      if (groups.length === 0) {
        groupsHtml = `
          <div class="text-center py-4">
            <p class="text-muted">You haven't joined any study groups yet</p>
            <button class="btn btn-sm btn-primary mt-2" id="create-group-btn">
              <i class="fas fa-plus me-1"></i> Create Group
            </button>
          </div>
        `;
      } else {
        groupsHtml = `
          <div class="row">
            ${groups.slice(0, 3).map(group => `
              <div class="col-md-4 mb-3">
                <div class="card h-100">
                  <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                      <div class="flex-shrink-0 me-3 rounded" style="width: 40px; height: 40px; background-color: ${Utils.stringToColor(group.name)}; display: flex; align-items: center; justify-content: center; color: white;">
                        <span>${Utils.getInitials(group.name)}</span>
                      </div>
                      <div>
                        <h6 class="mb-0">${group.name}</h6>
                        <small class="text-muted">${group.course}</small>
                      </div>
                    </div>
                    <div class="small mb-2">
                      <i class="fas fa-users me-1 text-muted"></i> ${group.memberCount} members
                    </div>
                    ${group.nextSession ? `
                      <div class="small mb-2">
                        <i class="fas fa-calendar me-1 text-muted"></i> Next session: ${Utils.formatDate(group.nextSession.date, 'short')}
                      </div>
                    ` : ''}
                  </div>
                  <div class="card-footer text-center bg-light">
                    <a href="#" class="btn btn-sm btn-outline-primary view-group-btn" data-id="${group.id}">View Group</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="text-center mt-3">
            <a href="#" class="btn btn-sm btn-outline-primary" data-page="groups">View All Groups</a>
          </div>
        `;
      }
      
      // Generate stats HTML
      const statsHtml = `
        <div class="row">
          <div class="col-md-3 mb-4 mb-md-0">
            <div class="card h-100">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="fas fa-users fa-2x text-primary"></i>
                </div>
                <h3 class="mb-1">${groups.length}</h3>
                <p class="text-muted mb-0">Study Groups</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-4 mb-md-0">
            <div class="card h-100">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="fas fa-calendar-alt fa-2x text-success"></i>
                </div>
                <h3 class="mb-1">${upcomingSessions.length}</h3>
                <p class="text-muted mb-0">Upcoming Sessions</p>
              </div>
            </div>
          </div>
          <div class="col-md-3 mb-4 mb-md-0">
            <div class="card h-100">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="fas fa-file-alt fa-2x text-info"></i>
                </div>
                <h3 class="mb-1">${recentFiles.length}</h3>
                <p class="text-muted mb-0">Shared Files</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card h-100">
              <div class="card-body text-center">
                <div class="mb-3">
                  <i class="fas fa-check-circle fa-2x text-warning"></i>
                </div>
                <h3 class="mb-1">${stats.completedGoals || 0}/${stats.totalGoals || 0}</h3>
                <p class="text-muted mb-0">Goals Completed</p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Return the complete dashboard template
      return `
        <div class="mb-4">
          <h2>Dashboard</h2>
          <p class="text-muted">Welcome back, ${user.name}!</p>
        </div>
        
        ${statsHtml}
        
        <div class="row mt-4">
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Upcoming Sessions</h5>
                <button class="btn btn-sm btn-primary" id="schedule-session-btn">
                  <i class="fas fa-plus me-1"></i> Schedule
                </button>
              </div>
              <div class="card-body">
                ${sessionsHtml}
              </div>
            </div>
          </div>
          
          <div class="col-lg-6 mb-4">
            <div class="card h-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Recent Files</h5>
                <button class="btn btn-sm btn-primary" id="upload-file-btn">
                  <i class="fas fa-upload me-1"></i> Upload
                </button>
              </div>
              <div class="card-body">
                ${filesHtml}
              </div>
            </div>
          </div>
        </div>
        
        <div class="row">
          <div class="col-12">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">My Study Groups</h5>
                <button class="btn btn-sm btn-primary" id="create-group-btn">
                  <i class="fas fa-plus me-1"></i> Create Group
                </button>
              </div>
              <div class="card-body">
                ${groupsHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    /**
     * Groups page template
     */
    function groupsTemplate(groups = []) {
      const user = Auth.getCurrentUser();
      
      if (!user) {
        return `
          <div class="text-center py-5">
            <h2>Study Groups</h2>
            <p class="lead">Please log in or register to view study groups</p>
            <div class="mt-4">
              <button class="btn btn-primary btn-lg me-2" id="welcome-login-btn">Login</button>
              <button class="btn btn-outline-primary btn-lg" id="welcome-register-btn">Register</button>
            </div>
          </div>
        `;
      }
      
      if (groups.length === 0) {
        return `
          <div class="d-flex justify-content-between align-items-center mb-4">
            <h2>Study Groups</h2>
            <button class="btn btn-primary" id="create-group-btn">
              <i class="fas fa-plus me-2"></i> Create Group
            </button>
          </div>
          <div class="card">
            <div class="card-body text-center py-5">
              <i class="fas fa-users fa-3x text-muted mb-3"></i>
              <h4>No Study Groups</h4>
              <p class="text-muted">You haven't joined any study groups yet.</p>
              <button class="btn btn-primary mt-2" id="empty-create-group-btn">
                <i class="fas fa-plus me-2"></i> Create Your First Group
              </button>
            </div>
          </div>
        `;
      }
      
      // Generate the groups list
      const groupsHtml = groups.map(group => {
        // Format next session date if available
        const nextSessionText = group.nextSession
          ? `${Utils.formatDate(group.nextSession.date, 'short')} at ${Utils.formatTime(group.nextSession.startTime)}`
          : 'No upcoming sessions';
        
        const isCreator = group.createdById === user.id;
        
        return `
          <div class="col-md-6 col-lg-4 mb-4">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between mb-3">
                  <div class="d-flex">
                    <div class="flex-shrink-0 rounded" style="width: 50px; height: 50px; background-color: ${Utils.stringToColor(group.name)}; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.25rem;">
                      <span>${Utils.getInitials(group.name)}</span>
                    </div>
                    <div class="ms-3">
                      <h5 class="card-title mb-0">${group.name}</h5>
                      <p class="card-subtitle text-muted">${group.course}</p>
                    </div>
                  </div>
                  ${isCreator ? `<span class="badge bg-warning text-dark">Creator</span>` : ''}
                </div>
                
                ${group.description ? `<p class="card-text small mb-3">${group.description}</p>` : ''}
                
                <div class="d-flex flex-column gap-2 mb-3">
                  <div class="d-flex align-items-center text-muted small">
                    <i class="fas fa-users me-2"></i>
                    <span>${group.memberCount} members</span>
                  </div>
                  <div class="d-flex align-items-center text-muted small">
                    <i class="fas fa-calendar-alt me-2"></i>
                    <span>${nextSessionText}</span>
                  </div>
                  <div class="d-flex align-items-center text-muted small">
                    <i class="fas fa-file-alt me-2"></i>
                    <span>${group.fileCount} shared files</span>
                  </div>
                </div>
              </div>
              <div class="card-footer bg-light d-flex justify-content-between">
                <button class="btn btn-outline-primary btn-sm group-chat-btn" data-id="${group.id}">
                  <i class="fas fa-comments me-1"></i> Group Chat
                </button>
                <button class="btn btn-primary btn-sm view-group-btn" data-id="${group.id}">
                  <i class="fas fa-eye me-1"></i> View Group
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
      
      return `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Study Groups</h2>
          <button class="btn btn-primary" id="create-group-btn">
            <i class="fas fa-plus me-2"></i> Create Group
          </button>
        </div>
        
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-search"></i></span>
                  <input type="text" class="form-control" id="group-search" placeholder="Search groups">
                </div>
              </div>
              <div class="col-md-4">
                <select class="form-select" id="group-filter">
                  <option value="all">All Groups</option>
                  <option value="active">Active Groups</option>
                  <option value="created">My Created Groups</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div class="row" id="groups-container">
          ${groupsHtml}
        </div>
      `;
    }
    
    /**
     * Calendar page template
     */
    function calendarTemplate(sessions = []) {
      const user = Auth.getCurrentUser();
      
      if (!user) {
        return `
          <div class="text-center py-5">
            <h2>Study Calendar</h2>
            <p class="lead">Please log in or register to view your calendar</p>
            <div class="mt-4">
              <button class="btn btn-primary btn-lg me-2" id="welcome-login-btn">Login</button>
              <button class="btn btn-outline-primary btn-lg" id="welcome-register-btn">Register</button>
            </div>
          </div>
        `;
      }
      
      // Get the current date
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Generate calendar for current month
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const daysInMonth = lastDayOfMonth.getDate();
      const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)
      
      // Create the weekday headers
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekdaysHtml = weekdays.map(day => `<div class="weekday">${day}</div>`).join('');
      
      // Create the calendar days
      let calendarDaysHtml = '';
      
      // Previous month days (to fill the first week)
      const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
      for (let i = 0; i < startingDayOfWeek; i++) {
        const dayNum = prevMonthLastDay - startingDayOfWeek + i + 1;
        calendarDaysHtml += `
          <div class="day-cell outside-month">
            <div class="day-number">${dayNum}</div>
          </div>
        `;
      }
      
      // Current month days
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateString = date.toISOString().split('T')[0];
        
        // Check if there are any sessions on this day
        const sessionsOnDay = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate.getDate() === day && 
                 sessionDate.getMonth() === currentMonth && 
                 sessionDate.getFullYear() === currentYear;
        });
        
        const isToday = day === currentDate.getDate();
        const hasEvents = sessionsOnDay.length > 0;
        
        calendarDaysHtml += `
          <div class="day-cell ${isToday ? 'today' : ''} ${hasEvents ? 'has-events' : ''}" data-date="${dateString}">
            <div class="day-number">${day}</div>
            ${hasEvents ? `<div class="event-indicator"></div>` : ''}
          </div>
        `;
      }
      
      // Next month days (to fill the last week)
      const cellsUsed = startingDayOfWeek + daysInMonth;
      const cellsNeeded = Math.ceil(cellsUsed / 7) * 7;
      const nextMonthDays = cellsNeeded - cellsUsed;
      
      for (let day = 1; day <= nextMonthDays; day++) {
        calendarDaysHtml += `
          <div class="day-cell outside-month">
            <div class="day-number">${day}</div>
          </div>
        `;
      }
      
      // Generate sessions for the selected day (default to today)
      const todayDate = currentDate.toISOString().split('T')[0];
      const todaySessions = sessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate.getDate() === currentDate.getDate() && 
               sessionDate.getMonth() === currentMonth && 
               sessionDate.getFullYear() === currentYear;
      });
      
      let sessionsHtml = '';
      if (todaySessions.length === 0) {
        sessionsHtml = `
          <div class="text-center py-4">
            <p class="text-muted">No sessions scheduled for today</p>
            <button class="btn btn-primary mt-2" id="schedule-session-btn">
              <i class="fas fa-plus me-1"></i> Schedule Session
            </button>
          </div>
        `;
      } else {
        sessionsHtml = `
          <div class="list-group">
            ${todaySessions.map(session => `
              <div class="list-group-item list-group-item-action">
                <div class="d-flex w-100 justify-content-between">
                  <h5 class="mb-1">${session.title}</h5>
                  <span class="badge ${session.userStatus === 'going' ? 'bg-success' : 'bg-secondary'} rounded-pill align-self-start">
                    ${session.userStatus === 'going' ? 'Going' : 'Pending'}
                  </span>
                </div>
                <p class="mb-1">${session.group.name}</p>
                <div class="d-flex justify-content-between align-items-end">
                  <small class="text-muted">
                    <i class="fas fa-clock me-1"></i> ${Utils.formatTime(session.startTime)} - ${session.endTime ? Utils.formatTime(session.endTime) : 'TBD'}
                    <br>
                    <i class="fas fa-map-marker-alt me-1"></i> ${session.location || 'No location specified'}
                  </small>
                  <div>
                    <button class="btn btn-sm btn-outline-primary session-details-btn" data-id="${session.id}">
                      <i class="fas fa-info-circle"></i>
                    </button>
                    <button class="btn btn-sm ${session.userStatus === 'going' ? 'btn-success' : 'btn-outline-success'} session-status-btn" data-id="${session.id}" data-status="${session.userStatus}">
                      <i class="fas ${session.userStatus === 'going' ? 'fa-check' : 'fa-user-plus'}"></i>
                    </button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
      
      return `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Study Calendar</h2>
          <button class="btn btn-primary" id="schedule-session-btn">
            <i class="fas fa-plus me-2"></i> Schedule Session
          </button>
        </div>
        
        <div class="row">
          <div class="col-lg-8 mb-4">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">${new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(currentDate)}</h5>
              </div>
              <div class="card-body p-0">
                <div class="calendar-container">
                  <div class="calendar-weekdays">
                    ${weekdaysHtml}
                  </div>
                  <div class="calendar-days">
                    ${calendarDaysHtml}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-lg-4">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">
                  Sessions for <span id="selected-date">${Utils.formatDate(currentDate, 'long')}</span>
                </h5>
              </div>
              <div class="card-body" id="day-sessions">
                ${sessionsHtml}
              </div>
            </div>
          </div>
        </div>
      `;
    }
    
    /**
     * Files page template
     */
    function filesTemplate(data) {
      const user = Auth.getCurrentUser();
      
      if (!user) {
        return `
          <div class="text-center py-5">
            <h2>Study Files</h2>
            <p class="lead">Please log in or register to access study files</p>
            <div class="mt-4">
              <button class="btn btn-primary btn-lg me-2" id="welcome-login-btn">Login</button>
              <button class="btn btn-outline-primary btn-lg" id="welcome-register-btn">Register</button>
            </div>
          </div>
        `;
      }
      
      const { files = [], groups = [] } = data || {};
      
      // Generate group options for the filter
      const groupOptionsHtml = groups.map(group => `
        <option value="${group.id}">${group.name}</option>
      `).join('');
      
      // Generate files list
      let filesHtml = '';
      if (files.length === 0) {
        filesHtml = `
          <div class="text-center py-5">
            <i class="fas fa-file-alt fa-3x text-muted mb-3"></i>
            <h4>No Files Found</h4>
            <p class="text-muted">No study files have been uploaded yet.</p>
            <button class="btn btn-primary mt-2" id="empty-upload-file-btn">
              <i class="fas fa-upload me-2"></i> Upload Your First File
            </button>
          </div>
        `;
      } else {
        filesHtml = `
          <div class="table-responsive">
            <table class="table table-hover">
              <thead>
                <tr>
                  <th>File</th>
                  <th>Group</th>
                  <th>Uploaded by</th>
                  <th>Size</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${files.map(file => `
                  <tr>
                    <td>
                      <div class="d-flex align-items-center">
                        <i class="fas ${Utils.getFileIcon(file.type)} fa-lg text-muted me-2"></i>
                        <span>${file.name}</span>
                      </div>
                    </td>
                    <td>${file.group ? file.group.name : ''}</td>
                    <td>${file.uploadedBy ? file.uploadedBy.name : 'Unknown'}</td>
                    <td>${Utils.formatFileSize(file.size)}</td>
                    <td>${Utils.formatDate(file.uploadedAt, 'short')}</td>
                    <td>
                      <div class="btn-group">
                        <a href="${file.url}" target="_blank" class="btn btn-sm btn-outline-primary">
                          <i class="fas fa-download"></i>
                        </a>
                        ${file.uploadedBy && file.uploadedBy.id === user.id ? `
                          <button class="btn btn-sm btn-outline-danger delete-file-btn" data-id="${file.id}">
                            <i class="fas fa-trash-alt"></i>
                          </button>
                        ` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `;
      }
      
      return `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Study Files</h2>
          <button class="btn btn-primary" id="upload-file-btn">
            <i class="fas fa-upload me-2"></i> Upload File
          </button>
        </div>
        
        <div class="card mb-4">
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-6">
                <div class="input-group">
                  <span class="input-group-text"><i class="fas fa-search"></i></span>
                  <input type="text" class="form-control" id="file-search" placeholder="Search files">
                </div>
              </div>
              <div class="col-md-4">
                <select class="form-select" id="file-group-filter">
                  <option value="all">All Groups</option>
                  ${groupOptionsHtml}
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div class="card">
          <div class="card-body">
            ${filesHtml}
          </div>
        </div>
      `;
    }
    
    /**
     * Progress page template
     */
    function progressTemplate(data) {
      const user = Auth.getCurrentUser();
      
      if (!user) {
        return `
          <div class="text-center py-5">
            <h2>Progress Tracking</h2>
            <p class="lead">Please log in or register to track your progress</p>
            <div class="mt-4">
              <button class="btn btn-primary btn-lg me-2" id="welcome-login-btn">Login</button>
              <button class="btn btn-outline-primary btn-lg" id="welcome-register-btn">Register</button>
            </div>
          </div>
        `;
      }
      
      const { goals = [], progress = { total: 0, completed: 0 } } = data || {};
      
      // Calculate progress percentage
      const percentage = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
      
      // Generate progress overview
      const progressHtml = `
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">Progress Overview</h5>
            <div class="mb-3">
              <div class="d-flex justify-content-between mb-1">
                <span>${progress.completed} of ${progress.total} goals completed</span>
                <span>${percentage}%</span>
              </div>
              <div class="progress">
                <div class="progress-bar bg-primary" role="progressbar" style="width: ${percentage}%" aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
            </div>
            <p class="card-text text-muted">
              <i class="fas fa-bullseye text-warning me-2"></i>
              ${progress.total === 0 ? 
                'No goals set yet. Start by creating your first study goal!' : 
                progress.completed === progress.total ? 
                  'Great job! You\'ve completed all your goals.' : 
                  'Keep going! You\'re making good progress.'}
            </p>
          </div>
        </div>
      `;
      
      // Generate goals list
      let goalsHtml = '';
      if (goals.length === 0) {
        goalsHtml = `
          <div class="text-center py-5">
            <i class="fas fa-tasks fa-3x text-muted mb-3"></i>
            <h4>No Goals Yet</h4>
            <p class="text-muted">You haven't set any study goals yet.</p>
            <button class="btn btn-primary mt-2" id="empty-add-goal-btn">
              <i class="fas fa-plus me-2"></i> Add Your First Goal
            </button>
          </div>
        `;
      } else {
        goalsHtml = goals.map(goal => {
          const dueDateHtml = goal.dueDate ? `
            <div class="goal-due-date">
              <i class="fas fa-calendar-day me-1"></i>
              Due: ${Utils.formatDate(goal.dueDate, 'short')}
            </div>
          ` : '';
          
          return `
            <div class="goal-item ${goal.completed ? 'completed' : ''}">
              <div class="goal-checkbox">
                <div class="form-check">
                  <input class="form-check-input toggle-goal-btn" type="checkbox" ${goal.completed ? 'checked' : ''} data-id="${goal.id}">
                </div>
              </div>
              <div class="goal-content">
                <div class="goal-title">${goal.title}</div>
                ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                ${dueDateHtml}
              </div>
              <button class="goal-delete delete-goal-btn" data-id="${goal.id}">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `;
        }).join('');
      }
      
      return `
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h2>Progress Tracking</h2>
          <button class="btn btn-primary" id="add-goal-btn">
            <i class="fas fa-plus me-2"></i> Add Goal
          </button>
        </div>
        
        ${progressHtml}
        
        <div class="card">
          <div class="card-header">
            <h5 class="mb-0">Study Goals</h5>
          </div>
          <div class="card-body">
            <div class="goals-container">
              ${goalsHtml}
            </div>
          </div>
        </div>
      `;
    }
    
    /**
     * Not found page template
     */
    function notFoundTemplate() {
      return `
        <div class="text-center py-5">
          <h2 class="mb-4">404 - Page Not Found</h2>
          <p class="lead mb-4">The page you are looking for doesn't exist or has been moved.</p>
          <button class="btn btn-primary btn-lg" id="go-home-btn">
            <i class="fas fa-home me-2"></i> Go to Dashboard
          </button>
        </div>
      `;
    }
    
    // Return public API
    return {
      dashboardTemplate,
      groupsTemplate,
      calendarTemplate,
      filesTemplate,
      progressTemplate,
      notFoundTemplate
    };
  })();