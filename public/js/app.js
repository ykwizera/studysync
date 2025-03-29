/**
 * Main Application Module
 */

const app = {
    /**
     * Current page
     */
    currentPage: null,
    
    /**
     * Current group ID
     */
    currentGroupId: null,
    
    /**
     * Initialize the application
     */
    init() {
      // Hide loading indicator
      document.getElementById('loading').style.display = 'none';
      
      // Initialize auth
      const isLoggedIn = auth.init();
      
      if (isLoggedIn) {
        this.showDashboard();
      } else {
        this.showLoginPage();
      }
      
      // Set up page navigation
      document.addEventListener('click', (event) => {
        const navItem = event.target.closest('.nav-item');
        if (navItem) {
          event.preventDefault();
          const page = navItem.dataset.page;
          this.navigateTo(page);
        }
      });
    },
    
    /**
     * Navigate to a page
     * @param {string} page - The page to navigate to
     */
    navigateTo(page) {
      switch (page) {
        case 'groups':
          this.loadGroupsPage();
          break;
        case 'calendar':
          this.loadCalendarPage();
          break;
        case 'files':
          this.loadFilesPage();
          break;
        case 'progress':
          this.loadProgressPage();
          break;
        default:
          console.warn(`Unknown page: ${page}`);
      }
    },
    
    /**
     * Show the login page
     */
    showLoginPage() {
      const appElement = document.getElementById('app');
      utils.clearElement(appElement);
      
      const loginTemplate = utils.createElementFromTemplate('login-template');
      appElement.appendChild(loginTemplate);
      
      // Set up form submission
      document.getElementById('login-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
          await auth.login(username, password);
          this.showDashboard();
        } catch (error) {
          utils.showToast(error.message, 'error');
        }
      });
      
      // Set up register link
      document.getElementById('register-link').addEventListener('click', (event) => {
        event.preventDefault();
        this.showRegisterPage();
      });
    },
    
    /**
     * Show the register page
     */
    showRegisterPage() {
      const appElement = document.getElementById('app');
      utils.clearElement(appElement);
      
      const registerTemplate = utils.createElementFromTemplate('register-template');
      appElement.appendChild(registerTemplate);
      
      // Set up form submission
      document.getElementById('register-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const userData = {
          name: document.getElementById('reg-name').value,
          email: document.getElementById('reg-email').value,
          username: document.getElementById('reg-username').value,
          password: document.getElementById('reg-password').value
        };
        
        try {
          await auth.register(userData);
          this.showDashboard();
        } catch (error) {
          utils.showToast(error.message, 'error');
        }
      });
      
      // Set up login link
      document.getElementById('login-link').addEventListener('click', (event) => {
        event.preventDefault();
        this.showLoginPage();
      });
    },
    
    /**
     * Show the dashboard
     */
    showDashboard() {
      const appElement = document.getElementById('app');
      utils.clearElement(appElement);
      
      const dashboardTemplate = utils.createElementFromTemplate('dashboard-template');
      appElement.appendChild(dashboardTemplate);
      
      // Set user name
      const currentUser = auth.getUser();
      if (currentUser) {
        document.getElementById('user-name').textContent = currentUser.name;
      }
      
      // Set up logout button
      document.getElementById('logout-btn').addEventListener('click', () => {
        auth.logout();
      });
      
      // Load default page (groups)
      this.loadGroupsPage();
    },
    
    /**
     * Load the groups page
     */
    loadGroupsPage() {
      this.currentPage = 'groups';
      utils.setActivePage(this.currentPage);
      
      const contentElement = document.getElementById('main-content');
      utils.clearElement(contentElement);
      
      const groupsTemplate = utils.createElementFromTemplate('groups-template');
      contentElement.appendChild(groupsTemplate);
      
      // Set up create group button
      document.getElementById('create-group-btn').addEventListener('click', this.showCreateGroupModal);
      
      // Set up empty state create button
      const emptyCreateBtn = document.getElementById('empty-create-group-btn');
      if (emptyCreateBtn) {
        emptyCreateBtn.addEventListener('click', this.showCreateGroupModal);
      }
      
      // Load groups data
      this.loadGroups();
    },
    
    /**
     * Load study groups data
     */
    async loadGroups() {
      const groupsList = document.getElementById('groups-list');
      const emptyGroups = document.getElementById('empty-groups');
      
      try {
        const groups = await api.groups.getAll();
        
        if (groups.length === 0) {
          if (emptyGroups) emptyGroups.style.display = 'flex';
          return;
        }
        
        if (emptyGroups) emptyGroups.style.display = 'none';
        
        groups.forEach(group => {
          const groupCard = this.createGroupCard(group);
          groupsList.appendChild(groupCard);
        });
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },
    
    /**
     * Create a group card element
     * @param {Object} group - The group data
     * @returns {HTMLElement} - The group card element
     */
    createGroupCard(group) {
      const template = utils.createElementFromTemplate('group-card-template');
      const card = template.querySelector('.group-card');
      
      // Set group data
      card.dataset.groupId = group.id;
      template.querySelector('.group-name').textContent = group.name;
      template.querySelector('.group-subject').textContent = group.subject;
      
      // Set member count
      if (group.memberCount !== undefined) {
        template.querySelector('.member-count').textContent = group.memberCount;
      } else {
        template.querySelector('.member-count').textContent = '1';
      }
      
      // Set next session
      if (group.nextSession) {
        template.querySelector('.next-session').textContent = utils.formatDate(group.nextSession.startTime);
      } else {
        template.querySelector('.next-session').textContent = 'No upcoming sessions';
      }
      
      // Set up view button
      template.querySelector('.view-group-btn').addEventListener('click', () => {
        this.viewGroup(group.id);
      });
      
      return template;
    },
    
    /**
     * Show the create group modal
     */
    showCreateGroupModal() {
      const modalTemplate = utils.createElementFromTemplate('create-group-modal-template');
      utils.showModal(modalTemplate);
      
      // Set up form submission
      document.getElementById('submit-group-btn').addEventListener('click', async () => {
        const form = document.getElementById('create-group-form');
        
        const groupData = {
          name: document.getElementById('group-name').value,
          subject: document.getElementById('group-subject').value,
          description: document.getElementById('group-description').value,
          createdById: auth.getUserId()
        };
        
        if (!groupData.name || !groupData.subject) {
          utils.showToast('Group name and subject are required', 'error');
          return;
        }
        
        try {
          await api.groups.create(groupData);
          utils.closeModal(modalTemplate.querySelector('.modal-overlay'));
          utils.showToast('Group created successfully', 'success');
          
          // Reload groups page
          app.loadGroupsPage();
        } catch (error) {
          utils.showToast(error.message, 'error');
        }
      });
    },
    
    /**
     * View a group
     * @param {number} groupId - The ID of the group to view
     */
    async viewGroup(groupId) {
      this.currentGroupId = groupId;
      
      const contentElement = document.getElementById('main-content');
      utils.clearElement(contentElement);
      
      const groupDetailsTemplate = utils.createElementFromTemplate('group-details-template');
      contentElement.appendChild(groupDetailsTemplate);
      
      // Set up back button
      document.getElementById('back-to-groups').addEventListener('click', (event) => {
        event.preventDefault();
        this.loadGroupsPage();
      });
      
      try {
        const group = await api.groups.get(groupId);
        
        // Set group data
        document.querySelector('.group-title').textContent = group.name;
        document.querySelector('.group-description').textContent = group.description || 'No description';
        
        // Set up action buttons
        document.getElementById('schedule-session-btn').addEventListener('click', () => {
          this.showScheduleSessionModal(groupId);
        });
        
        document.getElementById('share-files-btn').addEventListener('click', () => {
          this.navigateTo('files');
        });
        
        document.getElementById('chat-btn').addEventListener('click', () => {
          this.showGroupChat(groupId);
        });
        
        // Load sessions
        this.loadGroupSessions(groupId);
        
        // Load members
        this.loadGroupMembers(group.members);
        
        // Set up empty schedule button
        const emptyScheduleBtn = document.getElementById('empty-schedule-btn');
        if (emptyScheduleBtn) {
          emptyScheduleBtn.addEventListener('click', () => {
            this.showScheduleSessionModal(groupId);
          });
        }
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },
    
    /**
     * Load group sessions
     * @param {number} groupId - The ID of the group
     */
    async loadGroupSessions(groupId) {
      const sessionsList = document.getElementById('sessions-list');
      const emptySessions = document.getElementById('empty-sessions');
      
      try {
        const sessions = await api.sessions.getForGroup(groupId);
        
        if (sessions.length === 0) {
          if (emptySessions) emptySessions.style.display = 'flex';
          return;
        }
        
        if (emptySessions) emptySessions.style.display = 'none';
        
        // Sort sessions by start time
        sessions.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        
        // Only show upcoming sessions
        const upcomingSessions = sessions.filter(session => new Date(session.startTime) > new Date());
        
        if (upcomingSessions.length === 0) {
          if (emptySessions) emptySessions.style.display = 'flex';
          return;
        }
        
        upcomingSessions.forEach(session => {
          const sessionCard = this.createSessionCard(session);
          sessionsList.appendChild(sessionCard);
        });
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },
    
    /**
     * Load group members
     * @param {Array} members - The group members
     */
    loadGroupMembers(members) {
      const membersList = document.getElementById('members-list');
      utils.clearElement(membersList);
      
      if (!members || members.length === 0) {
        const emptyEl = document.createElement('p');
        emptyEl.textContent = 'No members';
        membersList.appendChild(emptyEl);
        return;
      }
      
      members.forEach(member => {
        const memberEl = document.createElement('div');
        memberEl.className = 'member';
        
        const nameEl = document.createElement('span');
        nameEl.className = 'member-name';
        nameEl.textContent = member.username || 'Unknown user';
        
        const roleEl = document.createElement('span');
        roleEl.className = 'member-role';
        roleEl.textContent = member.role || 'member';
        
        memberEl.appendChild(nameEl);
        memberEl.appendChild(roleEl);
        membersList.appendChild(memberEl);
      });
    },
    
    /**
     * Create a session card element
     * @param {Object} session - The session data
     * @returns {HTMLElement} - The session card element
     */
    createSessionCard(session) {
      const template = utils.createElementFromTemplate('session-card-template');
      const card = template.querySelector('.session-card');
      
      // Set session data
      card.dataset.sessionId = session.id;
      template.querySelector('.session-title').textContent = session.title;
      template.querySelector('.session-date').textContent = utils.formatDate(session.startTime);
      
      // Parse date and time
      const startDate = new Date(session.startTime);
      const endDate = new Date(session.endTime);
      
      template.querySelector('.start-time').textContent = startDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      template.querySelector('.end-time').textContent = endDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      
      template.querySelector('.location-text').textContent = session.location || 'Online';
      
      // Set attendee count
      if (session.attendees) {
        template.querySelector('.attendee-count').textContent = session.attendees.length;
      } else {
        template.querySelector('.attendee-count').textContent = '0';
      }
      
      // Set up attendance buttons
      const attendBtn = template.querySelector('.attend-btn');
      const notAttendBtn = template.querySelector('.not-attend-btn');
      
      attendBtn.addEventListener('click', () => {
        this.updateSessionStatus(session.id, 'going');
        attendBtn.classList.add('active');
        notAttendBtn.classList.remove('active');
      });
      
      notAttendBtn.addEventListener('click', () => {
        this.updateSessionStatus(session.id, 'not-going');
        notAttendBtn.classList.add('active');
        attendBtn.classList.remove('active');
      });
      
      // Check current status
      if (session.attendees) {
        const userId = auth.getUserId();
        const userStatus = session.attendees.find(a => a.userId === userId)?.status;
        
        if (userStatus === 'going') {
          attendBtn.classList.add('active');
        } else if (userStatus === 'not-going') {
          notAttendBtn.classList.add('active');
        }
      }
      
      return template;
    },
    
    /**
     * Show the schedule session modal
     * @param {number} groupId - The ID of the group
     */
    showScheduleSessionModal(groupId) {
      const modalTemplate = utils.createElementFromTemplate('schedule-session-modal-template');
      utils.showModal(modalTemplate);
      
      // Set default date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('session-date').valueAsDate = tomorrow;
      
      // Set up form submission
      document.getElementById('submit-session-btn').addEventListener('click', async () => {
        const form = document.getElementById('schedule-session-form');
        
        const title = document.getElementById('session-title').value;
        const date = document.getElementById('session-date').value;
        const startTime = document.getElementById('session-start-time').value;
        const endTime = document.getElementById('session-end-time').value;
        const location = document.getElementById('session-location').value;
        const description = document.getElementById('session-description').value;
        
        if (!title || !date || !startTime || !endTime) {
          utils.showToast('Title, date, start time, and end time are required', 'error');
          return;
        }
        
        const startDateTime = utils.combineDateTime(date, startTime);
        const endDateTime = utils.combineDateTime(date, endTime);
        
        const sessionData = {
          title,
          startTime: startDateTime,
          endTime: endDateTime,
          location,
          description,
          createdById: auth.getUserId()
        };
        
        try {
          await api.sessions.create(groupId, sessionData);
          utils.closeModal(modalTemplate.querySelector('.modal-overlay'));
          utils.showToast('Session scheduled successfully', 'success');
          
          // Reload sessions
          this.loadGroupSessions(groupId);
        } catch (error) {
          utils.showToast(error.message, 'error');
        }
      });
    },
    
    /**
     * Update session attendance status
     * @param {number} sessionId - The ID of the session
     * @param {string} status - The attendance status
     */
    async updateSessionStatus(sessionId, status) {
      try {
        await api.sessions.updateStatus(sessionId, status);
        utils.showToast(`Marked as ${status}`, 'success');
      } catch (error) {
        utils.showToast(error.message, 'error');
      }
    },
    
    /**
     * Show group chat
     * @param {number} groupId - The ID of the group
     */
    showGroupChat(groupId) {
      const chatTemplate = utils.createElementFromTemplate('chat-template');
      document.body.appendChild(chatTemplate);
      
      const chatContainer = document.querySelector('.chat-container');
      const messagesContainer = document.getElementById('chat-messages');
      const chatForm = document.getElementById('chat-form');
      const messageInput = document.getElementById('message-input');
      
      // Position the chat
      chatContainer.style.position = 'fixed';
      chatContainer.style.bottom = '20px';
      chatContainer.style.right = '20px';
      chatContainer.style.zIndex = '1000';
      
      // Set up close button
      document.querySelector('.close-chat-btn').addEventListener('click', () => {
        document.body.removeChild(chatContainer);
      });
      
      // Set up WebSocket message handler
      websocket.onMessage('new_message', (data) => {
        if (data.message.groupId === groupId) {
          this.addChatMessage(messagesContainer, data.message);
        }
      });
      
      // Set up form submission
      chatForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        const content = messageInput.value.trim();
        if (!content) return;
        
        // Send the message via WebSocket
        websocket.sendGroupMessage(groupId, content);
        
        // Clear the input
        messageInput.value = '';
      });
    },
    
    /**
     * Add a chat message to the chat container
     * @param {HTMLElement} container - The container to add the message to
     * @param {Object} message - The message data
     */
    addChatMessage(container, message) {
      const template = utils.createElementFromTemplate('message-template');
      const messageEl = template.querySelector('.message');
      
      // Check if it's the current user's message
      const isCurrentUser = message.userId === auth.getUserId();
      if (isCurrentUser) {
        messageEl.classList.add('own-message');
      }
      
      // Set message data
      template.querySelector('.message-sender').textContent = message.username || 'Unknown user';
      template.querySelector('.message-content').textContent = message.content;
      
      // Format time
      const time = new Date(message.createdAt).toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit'
      });
      template.querySelector('.message-time').textContent = time;
      
      container.appendChild(template);
      
      // Scroll to bottom
      container.scrollTop = container.scrollHeight;
    },
    
    /**
     * Load the calendar page
     */
    loadCalendarPage() {
      this.currentPage = 'calendar';
      utils.setActivePage(this.currentPage);
      
      const contentElement = document.getElementById('main-content');
      utils.clearElement(contentElement);
      
      const calendarTemplate = utils.createElementFromTemplate('calendar-template');
      contentElement.appendChild(calendarTemplate);
      
      // Initialize the calendar
      this.initCalendar();
    },
    
    /**
     * Load the files page
     */
    loadFilesPage() {
      this.currentPage = 'files';
      utils.setActivePage(this.currentPage);
      
      const contentElement = document.getElementById('main-content');
      utils.clearElement(contentElement);
      
      const filesTemplate = utils.createElementFromTemplate('files-template');
      contentElement.appendChild(filesTemplate);
      
      // TODO: Implement files functionality
    },
    
    /**
     * Load the progress page
     */
    loadProgressPage() {
      this.currentPage = 'progress';
      utils.setActivePage(this.currentPage);
      
      const contentElement = document.getElementById('main-content');
      utils.clearElement(contentElement);
      
      const progressTemplate = utils.createElementFromTemplate('progress-template');
      contentElement.appendChild(progressTemplate);
      
      // TODO: Implement progress tracking functionality
    },
    
    /**
     * Initialize the calendar
     */
    initCalendar() {
      const calendarGrid = document.getElementById('calendar-grid');
      const currentMonthYearEl = document.getElementById('current-month-year');
      const selectedDateEl = document.getElementById('selected-date');
      const eventsListEl = document.getElementById('events-list');
      
      // Current date tracking
      let currentDate = new Date();
      let currentMonth = currentDate.getMonth();
      let currentYear = currentDate.getFullYear();
      
      // Update the calendar
      const updateCalendar = () => {
        // Clear the grid
        utils.clearElement(calendarGrid);
        
        // Update month/year display
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                            'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthYearEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        
        // Create day headers
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayNames.forEach(day => {
          const dayHeader = document.createElement('div');
          dayHeader.className = 'calendar-day-header';
          dayHeader.textContent = day;
          calendarGrid.appendChild(dayHeader);
        });
        
        // Get first day of month
        const firstDay = new Date(currentYear, currentMonth, 1);
        const startingDay = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Get number of days in month
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const totalDays = lastDay.getDate();
        
        // Add empty cells for days before the first of the month
        for (let i = 0; i < startingDay; i++) {
          const emptyCell = document.createElement('div');
          emptyCell.className = 'calendar-day empty';
          calendarGrid.appendChild(emptyCell);
        }
        
        // Add cells for each day of the month
        for (let day = 1; day <= totalDays; day++) {
          const dayCell = document.createElement('div');
          dayCell.className = 'calendar-day';
          dayCell.textContent = day;
          
          // Check if this is today
          const today = new Date();
          if (day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear()) {
            dayCell.classList.add('today');
          }
          
          // TODO: Check if this day has events and add 'has-events' class
          
          // Set up click handler
          dayCell.addEventListener('click', () => {
            // Remove 'selected' class from all days
            document.querySelectorAll('.calendar-day').forEach(cell => {
              cell.classList.remove('selected');
            });
            
            // Add 'selected' class to clicked day
            dayCell.classList.add('selected');
            
            // Update selected date display
            const selectedDate = new Date(currentYear, currentMonth, day);
            selectedDateEl.textContent = selectedDate.toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            
            // Load events for this day
            this.loadEventsForDate(selectedDate, eventsListEl);
          });
          
          calendarGrid.appendChild(dayCell);
        }
      };
      
      // Initialize the calendar
      updateCalendar();
      
      // Set up navigation buttons
      document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        updateCalendar();
      });
      
      document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        updateCalendar();
      });
      
      // Select today by default
      selectedDateEl.textContent = currentDate.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      this.loadEventsForDate(currentDate, eventsListEl);
    },
    
    /**
     * Load events for a specific date
     * @param {Date} date - The date to load events for
     * @param {HTMLElement} container - The container to display events in
     */
    async loadEventsForDate(date, container) {
      utils.clearElement(container);
      
      // TODO: Load actual events from API
      const event = document.createElement('div');
      event.className = 'calendar-event';
      event.innerHTML = '<p>No events scheduled for this day.</p>';
      container.appendChild(event);
    }
  };
  
  // Initialize the app when the DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    app.init();
  });