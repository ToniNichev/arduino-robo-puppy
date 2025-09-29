# RoboPuppy Node.js Controller

This project provides a Node.js interface to control your Arduino RoboPuppy robot via serial communication.

## Features

- **Serial Communication**: Direct communication with Arduino via USB serial port
- **Auto-Detection**: Automatically finds Arduino ports
- **Web Interface**: Beautiful web-based control panel
- **Real-time Control**: Socket.IO for real-time communication
- **REST API**: Programmatic control via HTTP endpoints
- **Individual Leg Control**: Precise control of each joint

## Installation

1. Install Node.js dependencies:
```bash
npm install
```

2. Make sure your Arduino is connected and the RoboPuppy firmware is uploaded.

## Usage

### Command Line Controller

Run the basic controller with demo commands:
```bash
npm start
```

This will:
- Auto-detect your Arduino
- Connect to it
- Run through a series of demo commands
- Disconnect when done

### Web Interface

Start the web server:
```bash
npm run web
```

Then open your browser to `http://localhost:3000`

The web interface provides:
- **Connection Panel**: Select Arduino port and connect/disconnect
- **Basic Controls**: Stand, sit, walk, neutral, down, help
- **Leg Controls**: Individual control of each leg's hip and knee joints
- **Real-time Feedback**: See Arduino responses in the log

### Programmatic Control

Use the controller class in your own Node.js applications:

```javascript
const RoboPuppyController = require('./controller');

async function controlRobot() {
  const robot = new RoboPuppyController();
  
  try {
    // Connect (auto-detects Arduino)
    await robot.connect();
    
    // Basic commands
    await robot.stand();
    await robot.sit();
    await robot.walk();
    await robot.neutral();
    
    // Individual leg control
    await robot.moveLeg(0, 'hip', 30);    // Move leg 0 hip to 30 degrees
    await robot.moveLeg(0, 'knee', -45);  // Move leg 0 knee to -45 degrees
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    robot.disconnect();
  }
}
```

### REST API

The web server also provides REST endpoints:

- `POST /api/connect` - Connect to Arduino
- `POST /api/disconnect` - Disconnect from Arduino
- `POST /api/command` - Send robot command
- `GET /api/ports` - List available serial ports

Example API usage:
```bash
# Connect to Arduino
curl -X POST http://localhost:3000/api/connect \
  -H "Content-Type: application/json" \
  -d '{"port": "/dev/tty.usbmodem14101"}'

# Send command
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "stand"}'

# Move individual leg
curl -X POST http://localhost:3000/api/command \
  -H "Content-Type: application/json" \
  -d '{"command": "leg", "legId": 0, "joint": "hip", "angle": 45}'
```

## Available Commands

Based on your Arduino code, the following commands are supported:

### Basic Commands
- `stand` - Make robot stand up
- `sit` - Make robot sit down  
- `walk` - Start walking gait
- `neutral` - Return to neutral position
- `down` - Lay down
- `help` - Show help message

### Individual Leg Control
- `leg <0-3> <hip|knee> <angle>` - Control specific joints
  - Leg IDs: 0=Front Left, 1=Front Right, 2=Back Left, 3=Back Right
  - Joints: `hip` or `knee`
  - Angle: -90 to 90 degrees

## Troubleshooting

### Connection Issues
- Make sure Arduino is connected via USB
- Check that the correct port is selected
- Ensure Arduino firmware is uploaded and running
- Try refreshing the port list

### Permission Issues (Linux/macOS)
You may need to add your user to the dialout group:
```bash
sudo usermod -a -G dialout $USER
```
Then log out and back in.

### Port Not Found
- Check Arduino IDE's Tools > Port menu to see available ports
- Try unplugging and reconnecting the Arduino
- On Windows, you may need to install Arduino drivers

## File Structure

```
main/
├── main.ino              # Arduino firmware
├── servo.h               # Servo control library
├── package.json          # Node.js dependencies
├── controller.js          # Basic Node.js controller
├── web-controller.js      # Web server with Socket.IO
└── public/
    └── index.html        # Web interface
```

## Dependencies

- `serialport` - Serial communication with Arduino
- `express` - Web server framework
- `socket.io` - Real-time communication

## Next Steps

You can extend this controller by:
- Adding more complex movement patterns
- Implementing sensor feedback
- Creating custom gaits and behaviors
- Adding voice control
- Integrating with other APIs or services
