const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const RoboPuppyController = require('./controller');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('public'));
app.use(express.json());

let robot = null;

// REST API endpoints
app.post('/api/connect', async (req, res) => {
  try {
    const { port } = req.body;
    robot = new RoboPuppyController(port);
    await robot.connect();
    res.json({ success: true, message: 'Connected to RoboPuppy' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/disconnect', (req, res) => {
  if (robot) {
    robot.disconnect();
    robot = null;
    res.json({ success: true, message: 'Disconnected' });
  } else {
    res.json({ success: false, message: 'Not connected' });
  }
});

app.post('/api/command', async (req, res) => {
  try {
    if (!robot) {
      return res.status(400).json({ success: false, message: 'Not connected to robot' });
    }

    const { command, legId, joint, angle } = req.body;
    
    switch (command) {
      case 'stand':
        await robot.stand();
        break;
      case 'sit':
        await robot.sit();
        break;
      case 'walk':
        await robot.walk();
        break;
      case 'neutral':
        await robot.neutral();
        break;
      case 'down':
        await robot.down();
        break;
      case 'leg':
        await robot.moveLeg(legId, joint, angle);
        break;
      case 'help':
        await robot.help();
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unknown command' });
    }
    
    res.json({ success: true, message: `Command ${command} executed` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get('/api/ports', async (req, res) => {
  try {
    const { SerialPort } = require('serialport');
    const ports = await SerialPort.list();
    res.json({ ports: ports.map(port => ({ path: port.path, description: port.description })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Socket.IO for real-time communication
io.on('connection', (socket) => {
  console.log('Client connected');
  
  socket.on('robot-command', async (data) => {
    try {
      if (!robot) {
        socket.emit('robot-response', { success: false, message: 'Not connected to robot' });
        return;
      }

      const { command, legId, joint, angle } = data;
      
      switch (command) {
        case 'stand':
          await robot.stand();
          break;
        case 'sit':
          await robot.sit();
          break;
        case 'walk':
          await robot.walk();
          break;
        case 'neutral':
          await robot.neutral();
          break;
        case 'down':
          await robot.down();
          break;
        case 'leg':
          await robot.moveLeg(legId, joint, angle);
          break;
        case 'help':
          await robot.help();
          break;
        default:
          socket.emit('robot-response', { success: false, message: 'Unknown command' });
          return;
      }
      
      socket.emit('robot-response', { success: true, message: `Command ${command} executed` });
    } catch (error) {
      socket.emit('robot-response', { success: false, message: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`RoboPuppy Web Controller running on http://localhost:${PORT}`);
});
