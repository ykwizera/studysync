const http = require('http');
const fs = require('fs');
const path = require('path');
const {WebSocket} = require('ws');
const url = require('url');

// Define MIME types for different file extensions
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// In-memory storage for users, study groups, sessions, etc.
const db = {
  users: [],
  studyGroups: [],
  studySessions: [],
  groupMembers: [],
  sessionAttendees: [],
  studyFiles: [],
  groupMessages: [],
  progressGoals: []
};

// Load the initial data if available
try {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
  Object.assign(db, data);
  console.log('Loaded initial data from data.json');
} catch (error) {
  console.log('No initial data found, starting with empty database');
  
  // Create a sample user
  db.users.push({
    id: 1,
    username: 'test',
    password: 'test',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null
  });
  
  // Create a sample study group
  db.studyGroups.push({
    id: 1,
    name: 'Computer Science 101',
    description: 'Study group for CS 101 class',
    subject: 'Computer Science',
    createdById: 1,
    createdAt: new Date().toISOString()
  });
  
  // Add user as a member of the group
  db.groupMembers.push({
    id: 1,
    groupId: 1,
    userId: 1,
    role: 'admin'
  });
}

// Save data to file periodically
setInterval(() => {
  fs.writeFile(
    path.join(__dirname, 'data.json'),
    JSON.stringify(db, null, 2),
    err => {
      if (err) console.error('Error saving data:', err);
      else console.log('Data saved successfully');
    }
  );
}, 60000); // Save every minute

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);
  
  // Parse URL to get pathname and query params
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;
  
  // Handle API requests
  if (pathname.startsWith('/api/')) {
    handleApiRequest(req, res, pathname, parsedUrl.query);
    return;
  }
  
  // Default to index.html for root and other non-asset paths
  if (pathname === '/' || !pathname.includes('.')) {
    pathname = '/index.html';
  }
  
  // Serve static files
  const filePath = path.join(__dirname, '../public', pathname);
  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // File not found
        res.writeHead(404);
        res.end('File not found');
      } else {
        // Server error
        res.writeHead(500);
        res.end('Server error: ' + err.message);
      }
      return;
    }
    
    // Determine content type based on file extension
    const extname = path.extname(filePath);
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Send the file
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Handle API requests
function handleApiRequest(req, res, pathname, query) {
  res.setHeader('Content-Type', 'application/json');
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests (for CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Implement API routes
  const apiPath = pathname.slice(5); // Remove '/api/' prefix
  
  try {
    // Authentication routes
    if (apiPath === 'auth/login' && req.method === 'POST') {
      handleLogin(req, res);
    }
    else if (apiPath === 'auth/register' && req.method === 'POST') {
      handleRegister(req, res);
    }
    // Study Groups routes
    else if (apiPath === 'groups' && req.method === 'GET') {
      handleGetGroups(req, res);
    }
    else if (apiPath === 'groups' && req.method === 'POST') {
      handleCreateGroup(req, res);
    }
    else if (apiPath.match(/^groups\/\d+$/) && req.method === 'GET') {
      const groupId = parseInt(apiPath.split('/')[1]);
      handleGetGroup(req, res, groupId);
    }
    // Study Sessions routes
    else if (apiPath.match(/^groups\/\d+\/sessions$/) && req.method === 'GET') {
      const groupId = parseInt(apiPath.split('/')[1]);
      handleGetSessions(req, res, groupId);
    }
    else if (apiPath.match(/^groups\/\d+\/sessions$/) && req.method === 'POST') {
      const groupId = parseInt(apiPath.split('/')[1]);
      handleCreateSession(req, res, groupId);
    }
    // Default response for unknown routes
    else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  } catch (error) {
    console.error('API error:', error);
    res.writeHead(500);
    res.end(JSON.stringify({ error: 'Server error' }));
  }
}

// Helper to parse request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

// Auth handlers
async function handleLogin(req, res) {
  try {
    const { username, password } = await parseRequestBody(req);
    const user = db.users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      res.writeHead(401);
      res.end(JSON.stringify({ error: 'Invalid username or password' }));
      return;
    }
    
    // Return user data (without password)
    const { password: _, ...userData } = user;
    res.writeHead(200);
    res.end(JSON.stringify(userData));
  } catch (error) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: error.message }));
  }
}

async function handleRegister(req, res) {
  try {
    const userData = await parseRequestBody(req);
    
    // Simple validation
    if (!userData.username || !userData.password || !userData.email || !userData.name) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'All fields are required' }));
      return;
    }
    
    // Check if username already exists
    if (db.users.some(u => u.username === userData.username)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Username already taken' }));
      return;
    }
    
    // Create new user
    const newUser = {
      id: db.users.length > 0 ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      ...userData,
      avatar: userData.avatar || null,
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    
    // Return user data (without password)
    const { password: _, ...newUserData } = newUser;
    res.writeHead(201);
    res.end(JSON.stringify(newUserData));
  } catch (error) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Study Group handlers
function handleGetGroups(req, res) {
  const groups = db.studyGroups;
  res.writeHead(200);
  res.end(JSON.stringify(groups));
}

async function handleCreateGroup(req, res) {
  try {
    const groupData = await parseRequestBody(req);
    
    // Simple validation
    if (!groupData.name || !groupData.subject || !groupData.createdById) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Name, subject, and createdById are required' }));
      return;
    }
    
    // Create new group
    const newGroup = {
      id: db.studyGroups.length > 0 ? Math.max(...db.studyGroups.map(g => g.id)) + 1 : 1,
      ...groupData,
      createdAt: new Date().toISOString()
    };
    
    db.studyGroups.push(newGroup);
    
    // Add creator as admin member
    db.groupMembers.push({
      id: db.groupMembers.length > 0 ? Math.max(...db.groupMembers.map(m => m.id)) + 1 : 1,
      groupId: newGroup.id,
      userId: newGroup.createdById,
      role: 'admin'
    });
    
    res.writeHead(201);
    res.end(JSON.stringify(newGroup));
  } catch (error) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: error.message }));
  }
}

function handleGetGroup(req, res, groupId) {
  const group = db.studyGroups.find(g => g.id === groupId);
  
  if (!group) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Group not found' }));
    return;
  }
  
  const members = db.groupMembers.filter(m => m.groupId === groupId);
  const sessions = db.studySessions.filter(s => s.groupId === groupId);
  
  const groupWithDetails = {
    ...group,
    members,
    sessions
  };
  
  res.writeHead(200);
  res.end(JSON.stringify(groupWithDetails));
}

// Study Session handlers
function handleGetSessions(req, res, groupId) {
  const sessions = db.studySessions.filter(s => s.groupId === groupId);
  
  // Enhance with attendee information
  const sessionsWithDetails = sessions.map(session => {
    const attendees = db.sessionAttendees.filter(a => a.sessionId === session.id);
    return {
      ...session,
      attendees
    };
  });
  
  res.writeHead(200);
  res.end(JSON.stringify(sessionsWithDetails));
}

async function handleCreateSession(req, res, groupId) {
  try {
    const sessionData = await parseRequestBody(req);
    
    // Simple validation
    if (!sessionData.title || !sessionData.startTime || !sessionData.endTime || !sessionData.createdById) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Title, start time, end time, and createdById are required' }));
      return;
    }
    
    // Check if group exists
    const group = db.studyGroups.find(g => g.id === groupId);
    if (!group) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Group not found' }));
      return;
    }
    
    // Create new session
    const newSession = {
      id: db.studySessions.length > 0 ? Math.max(...db.studySessions.map(s => s.id)) + 1 : 1,
      groupId,
      ...sessionData,
      createdAt: new Date().toISOString()
    };
    
    db.studySessions.push(newSession);
    
    // Add creator as attending
    db.sessionAttendees.push({
      id: db.sessionAttendees.length > 0 ? Math.max(...db.sessionAttendees.map(a => a.id)) + 1 : 1,
      sessionId: newSession.id,
      userId: newSession.createdById,
      status: 'going'
    });
    
    res.writeHead(201);
    res.end(JSON.stringify(newSession));
  } catch (error) {
    res.writeHead(400);
    res.end(JSON.stringify({ error: error.message }));
  }
}

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// WebSocket server for real-time features
const wss = new WebSocket.Server({ server, path: '/ws' });

// Keep track of connected clients
const clients = new Map();

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('WebSocket message received:', data);
      
      // Handle authentication
      if (data.type === 'authenticate') {
        const userId = data.userId;
        const user = db.users.find(u => u.id === userId);
        
        if (user) {
          // Store client information
          clients.set(ws, { userId, username: user.username });
          
          // Send confirmation back to client
          ws.send(JSON.stringify({
            type: 'auth_success',
            message: 'Authentication successful'
          }));
          
          // Notify about user status
          broadcastUserStatus(userId, user.username, 'online');
        }
      }
      // Handle group message
      else if (data.type === 'group_message' && data.groupId && data.content) {
        const client = clients.get(ws);
        
        if (!client) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Not authenticated'
          }));
          return;
        }
        
        // Create new message
        const newMessage = {
          id: db.groupMessages.length > 0 ? Math.max(...db.groupMessages.map(m => m.id)) + 1 : 1,
          groupId: data.groupId,
          userId: client.userId,
          content: data.content,
          createdAt: new Date().toISOString()
        };
        
        db.groupMessages.push(newMessage);
        
        // Broadcast to group members
        broadcastToGroup(data.groupId, {
          type: 'new_message',
          message: {
            ...newMessage,
            username: client.username
          }
        });
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    const client = clients.get(ws);
    if (client) {
      broadcastUserStatus(client.userId, client.username, 'offline');
      clients.delete(ws);
    }
    console.log('WebSocket client disconnected');
  });
});

// Helper function to broadcast messages to all users in a group
function broadcastToGroup(groupId, data) {
  // Get all members of the group
  const groupMembers = db.groupMembers.filter(m => m.groupId === groupId)
    .map(m => m.userId);
  
  // Send the message to all connected clients who are members of the group
  for (const [client, userData] of clients.entries()) {
    if (groupMembers.includes(userData.userId)) {
      client.send(JSON.stringify(data));
    }
  }
}

// Helper function to broadcast user status changes
function broadcastUserStatus(userId, username, status) {
  const statusUpdate = {
    type: 'user_status',
    userId,
    username,
    status,
    timestamp: new Date().toISOString()
  };
  
  // Broadcast to all connected clients
  for (const client of clients.keys()) {
    client.send(JSON.stringify(statusUpdate));
  }
}