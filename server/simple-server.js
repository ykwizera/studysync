// NOTE: This is a simple Node.js HTTP server without Express,
// to match the client implementation which uses plain JavaScript, jQuery and Bootstrap

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse as parseUrl } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple Node.js server (not Express)
const server = http.createServer((req, res) => {
  // Parse request URL
  const parsedUrl = parseUrl(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Parse cookies
  const cookies = {};
  const cookieHeader = req.headers.cookie;
  
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const parts = cookie.split('=');
      cookies[parts[0].trim()] = (parts[1] || '').trim();
    });
  }
  
  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${pathname}`);
  
  // Handle API requests
  if (pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    // API routes
    
    // Authentication endpoints
    if (pathname === '/api/register' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { name, email, password } = data;
          
          // In a real app, we would check if the user already exists,
          // hash the password, and save to the database
          
          // Create a new user
          const user = { 
            id: Date.now(), // Use timestamp as a simple ID
            name,
            email
          };
          
          // Set auth cookie
          res.setHeader('Set-Cookie', `auth=${JSON.stringify(user)}; Path=/; HttpOnly`);
          
          res.statusCode = 201; // Created
          res.end(JSON.stringify(user));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ message: 'Invalid request format' }));
        }
      });
      return;
    }
    
    if (pathname === '/api/login' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });
      
      req.on('end', () => {
        try {
          const data = JSON.parse(body);
          const { email, password } = data;
          
          // Simplified login for demo purposes
          // In a real app, we'd validate against a database
          const user = { 
            id: 1, 
            name: email.split('@')[0], // Create a simple name from the email
            email 
          };
          
          // Set auth cookie
          res.setHeader('Set-Cookie', `auth=${JSON.stringify(user)}; Path=/; HttpOnly`);
          
          res.statusCode = 200;
          res.end(JSON.stringify(user));
        } catch (err) {
          res.statusCode = 400;
          res.end(JSON.stringify({ success: false, message: 'Invalid request' }));
        }
      });
      return;
    }
    
    // Current user
    if (pathname === '/api/user' && req.method === 'GET') {
      const authCookie = cookies.auth;
      
      if (authCookie) {
        try {
          const user = JSON.parse(authCookie);
          res.statusCode = 200;
          res.end(JSON.stringify(user));
        } catch (err) {
          res.statusCode = 401;
          res.end(JSON.stringify({ message: 'Not authenticated' }));
        }
      } else {
        res.statusCode = 401;
        res.end(JSON.stringify({ message: 'Not authenticated' }));
      }
      return;
    }
    
    // Logout
    if (pathname === '/api/logout' && req.method === 'POST') {
      res.setHeader('Set-Cookie', 'auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }
    
    // Groups
    if (pathname === '/api/groups' && req.method === 'GET') {
      const authCookie = cookies.auth;
      
      if (!authCookie) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, message: 'Not authenticated' }));
        return;
      }
      
      // Mock groups data for demo
      const groups = [
        { 
          id: 1, 
          name: 'Math Study Group', 
          subject: 'Mathematics',
          description: 'Group for studying advanced calculus',
          inviteCode: 'MATH123',
          members: [
            { id: 1, userId: 1, groupId: 1, isAdmin: true, user: JSON.parse(authCookie) }
          ]
        },
        { 
          id: 2, 
          name: 'Physics Group', 
          subject: 'Physics',
          description: 'Quantum mechanics study sessions',
          inviteCode: 'PHYS456',
          members: [
            { id: 2, userId: 1, groupId: 2, isAdmin: false, user: JSON.parse(authCookie) }
          ]
        }
      ];
      
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: groups }));
      return;
    }
    
    // Get specific group (would fetch from DB in a real app)
    if (pathname.match(/^\/api\/groups\/\d+$/) && req.method === 'GET') {
      const groupId = parseInt(pathname.split('/').pop());
      const authCookie = cookies.auth;
      
      if (!authCookie) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, message: 'Not authenticated' }));
        return;
      }
      
      // Mock group data
      const group = {
        id: groupId,
        name: groupId === 1 ? 'Math Study Group' : 'Physics Group',
        subject: groupId === 1 ? 'Mathematics' : 'Physics',
        description: groupId === 1 
          ? 'Group for studying advanced calculus'
          : 'Quantum mechanics study sessions',
        inviteCode: groupId === 1 ? 'MATH123' : 'PHYS456',
        members: [
          { 
            id: groupId, 
            userId: 1, 
            groupId, 
            isAdmin: groupId === 1,
            user: JSON.parse(authCookie)
          }
        ]
      };
      
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: group }));
      return;
    }
    
    // Meetings
    if (pathname === '/api/meetings' && req.method === 'GET') {
      const authCookie = cookies.auth;
      
      if (!authCookie) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, message: 'Not authenticated' }));
        return;
      }
      
      // Mock meetings data
      const meetings = [
        { 
          id: 1, 
          title: 'Math Exam Prep',
          description: 'Preparing for upcoming calculus exam',
          date: new Date(2025, 3, 10, 15, 0).toISOString(), // April 10, 2025 3:00 PM
          duration: 120, // minutes
          groupId: 1,
          group: {
            id: 1,
            name: 'Math Study Group'
          },
          attendees: [
            { 
              id: 1, 
              userId: 1, 
              meetingId: 1, 
              status: true,
              user: JSON.parse(authCookie)
            }
          ]
        },
        { 
          id: 2, 
          title: 'Physics Project Review',
          description: 'Review session for semester project',
          date: new Date(2025, 3, 15, 14, 0).toISOString(), // April 15, 2025 2:00 PM
          duration: 90, // minutes
          groupId: 2,
          group: {
            id: 2,
            name: 'Physics Group'
          },
          attendees: [
            { 
              id: 2, 
              userId: 1, 
              meetingId: 2, 
              status: true,
              user: JSON.parse(authCookie)
            }
          ]
        }
      ];
      
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, data: meetings }));
      return;
    }
    
    // Users (for People page)
    if (pathname === '/api/users' && req.method === 'GET') {
      const authCookie = cookies.auth;
      
      if (!authCookie) {
        res.statusCode = 401;
        res.end(JSON.stringify({ success: false, message: 'Not authenticated' }));
        return;
      }
      
      // Create a demo list of users
      const currentUser = JSON.parse(authCookie);
      const users = [
        {
          id: currentUser.id,
          name: currentUser.name,
          email: currentUser.email,
          createdAt: new Date(2024, 0, 15).toISOString() // January 15, 2024
        },
        {
          id: 2,
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          createdAt: new Date(2024, 1, 5).toISOString() // February 5, 2024
        },
        {
          id: 3,
          name: 'Alex Johnson',
          email: 'alex.johnson@example.com',
          createdAt: new Date(2024, 2, 10).toISOString() // March 10, 2024
        },
        {
          id: 4,
          name: 'Sam Wilson',
          email: 'sam.wilson@example.com',
          createdAt: new Date(2024, 2, 25).toISOString() // March 25, 2024
        }
      ];
      
      res.statusCode = 200;
      res.end(JSON.stringify(users));
      return;
    }
    
    // Default response for unhandled API routes
    res.statusCode = 404;
    res.end(JSON.stringify({ success: false, message: 'API endpoint not found' }));
    return;
  }
  
  // Handle static file requests
  let filePath;
  
  if (pathname === '/' || pathname === '/index.html') {
    filePath = path.join(__dirname, '../public', 'index.html');
  } else {
    filePath = path.join(__dirname, '../public', pathname);
  }
  
  // Get file extension
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  
  // Set content type based on file extension
  switch (extname) {
    case '.js':
      contentType = 'text/javascript';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.json':
      contentType = 'application/json';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.svg':
      contentType = 'image/svg+xml';
      break;
  }
  
  // Read and serve the file
  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        // Page not found - serve 404 page
        fs.readFile(path.join(__dirname, '../public', '404.html'), (err, content) => {
          if (err) {
            // If 404 page fails, send simple message
            res.writeHead(500);
            res.end('Error loading 404 page');
          } else {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      } else {
        // Server error
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      // Success - serve the file
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

// Specify the port to listen on (environment variable or default)
const PORT = 5000; // Use port 5000 to match the workflow configuration

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`StudySync simple server is running on port ${PORT}`);
});