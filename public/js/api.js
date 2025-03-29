/**
 * API Module - Handles all API requests
 */

const api = {
    /**
     * Base URL for API requests
     */
    baseUrl: "/api",
  
    /**
     * Helper function to make API requests
     * @param {string} url - The URL to make the request to
     * @param {string} method - The HTTP method to use
     * @param {Object} data - The data to send with the request
     * @returns {Promise} - A promise that resolves to the response data
     */
    async makeRequest(url, method = "GET", data = null) {
      const options = {
        method,
        headers: {
          "Content-Type": "application/json",
        },
      };
  
      if (data) {
        options.body = JSON.stringify(data);
      }
  
      try {
        const response = await fetch(`${this.baseUrl}${url}`, options);
  
        // Handle non-2xx status codes
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Request failed with status ${response.status}`,
          );
        }
  
        // Handle empty responses
        if (response.status === 204) {
          return null;
        }
  
        return await response.json();
      } catch (error) {
        console.error("API request error:", error);
        throw error;
      }
    },
  
    /**
     * Authentication
     */
    auth: {
      /**
       * Login user
       * @param {string} username - The username
       * @param {string} password - The password
       * @returns {Promise} - A promise that resolves to the user data
       */
      async login(username, password) {
        return api.makeRequest("/auth/login", "POST", { username, password });
      },
  
      /**
       * Register a new user
       * @param {Object} userData - The user data
       * @returns {Promise} - A promise that resolves to the user data
       */
      async register(userData) {
        return api.makeRequest("/auth/register", "POST", userData);
      },
    },
  
    /**
     * Study Groups
     */
    groups: {
      /**
       * Get all study groups
       * @returns {Promise} - A promise that resolves to an array of groups
       */
      async getAll() {
        return api.makeRequest("/groups");
      },
  
      /**
       * Get a specific study group
       * @param {number} groupId - The ID of the group to get
       * @returns {Promise} - A promise that resolves to the group data
       */
      async get(groupId) {
        return api.makeRequest(`/groups/${groupId}`);
      },
  
      /**
       * Create a new study group
       * @param {Object} groupData - The group data
       * @returns {Promise} - A promise that resolves to the created group
       */
      async create(groupData) {
        return api.makeRequest("/groups", "POST", groupData);
      },
  
      /**
       * Update a study group
       * @param {number} groupId - The ID of the group to update
       * @param {Object} groupData - The updated group data
       * @returns {Promise} - A promise that resolves to the updated group
       */
      async update(groupId, groupData) {
        return api.makeRequest(`/groups/${groupId}`, "PUT", groupData);
      },
  
      /**
       * Join a study group
       * @param {number} groupId - The ID of the group to join
       * @returns {Promise} - A promise that resolves when the group is joined
       */
      async join(groupId) {
        return api.makeRequest(`/groups/${groupId}/join`, "POST");
      },
  
      /**
       * Leave a study group
       * @param {number} groupId - The ID of the group to leave
       * @returns {Promise} - A promise that resolves when the group is left
       */
      async leave(groupId) {
        return api.makeRequest(`/groups/${groupId}/leave`, "POST");
      },
    },
  
    /**
     * Study Sessions
     */
    sessions: {
      /**
       * Get all sessions for a group
       * @param {number} groupId - The ID of the group
       * @returns {Promise} - A promise that resolves to an array of sessions
       */
      async getForGroup(groupId) {
        return api.makeRequest(`/groups/${groupId}/sessions`);
      },
  
      /**
       * Create a new study session
       * @param {number} groupId - The ID of the group
       * @param {Object} sessionData - The session data
       * @returns {Promise} - A promise that resolves to the created session
       */
      async create(groupId, sessionData) {
        return api.makeRequest(
          `/groups/${groupId}/sessions`,
          "POST",
          sessionData,
        );
      },
  
      /**
       * Update a study session
       * @param {number} sessionId - The ID of the session to update
       * @param {Object} sessionData - The updated session data
       * @returns {Promise} - A promise that resolves to the updated session
       */
      async update(sessionId, sessionData) {
        return api.makeRequest(`/sessions/${sessionId}`, "PUT", sessionData);
      },
  
      /**
       * Update attendance status for a session
       * @param {number} sessionId - The ID of the session
       * @param {string} status - The attendance status (going, not-going)
       * @returns {Promise} - A promise that resolves when the status is updated
       */
      async updateStatus(sessionId, status) {
        return api.makeRequest(`/sessions/${sessionId}/status`, "POST", {
          status,
        });
      },
    },
  
    /**
     * Files
     */
    files: {
      /**
       * Get all files for a group
       * @param {number} groupId - The ID of the group
       * @returns {Promise} - A promise that resolves to an array of files
       */
      async getForGroup(groupId) {
        return api.makeRequest(`/groups/${groupId}/files`);
      },
  
      /**
       * Upload a file
       * @param {number} groupId - The ID of the group
       * @param {Object} fileData - The file data
       * @param {File} fileData.file - The file to upload
       * @returns {Promise} - A promise that resolves to the uploaded file data
       */
      async upload(groupId, fileData) {
        const formData = new FormData();
  
        // Add file metadata
        for (const [key, value] of Object.entries(fileData)) {
          if (key !== "file") {
            formData.append(key, value);
          }
        }
  
        // Add the file
        formData.append("file", fileData.file);
  
        const options = {
          method: "POST",
          body: formData,
        };
  
        try {
          const response = await fetch(
            `${api.baseUrl}/groups/${groupId}/files`,
            options,
          );
  
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error || `Request failed with status ${response.status}`,
            );
          }
  
          return await response.json();
        } catch (error) {
          console.error("File upload error:", error);
          throw error;
        }
      },
    },
  
    /**
     * Progress Goals
     */
    goals: {
      /**
       * Get all goals for a user
       * @returns {Promise} - A promise that resolves to an array of goals
       */
      async getAll() {
        return api.makeRequest("/goals");
      },
  
      /**
       * Create a new goal
       * @param {Object} goalData - The goal data
       * @returns {Promise} - A promise that resolves to the created goal
       */
      async create(goalData) {
        return api.makeRequest("/goals", "POST", goalData);
      },
  
      /**
       * Update a goal
       * @param {number} goalId - The ID of the goal to update
       * @param {Object} goalData - The updated goal data
       * @returns {Promise} - A promise that resolves to the updated goal
       */
      async update(goalId, goalData) {
        return api.makeRequest(`/goals/${goalId}`, "PUT", goalData);
      },
  
      /**
       * Toggle completion status of a goal
       * @param {number} goalId - The ID of the goal
       * @returns {Promise} - A promise that resolves to the updated goal
       */
      async toggleCompletion(goalId) {
        return api.makeRequest(`/goals/${goalId}/toggle`, "POST");
      },
  
      /**
       * Delete a goal
       * @param {number} goalId - The ID of the goal to delete
       * @returns {Promise} - A promise that resolves when the goal is deleted
       */
      async delete(goalId) {
        return api.makeRequest(`/goals/${goalId}`, "DELETE");
      },
    },
  };
  
  // Export api object
  window.api = api;
  