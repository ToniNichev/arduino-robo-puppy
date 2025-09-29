const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');

class RoboPuppyController {
  constructor(portPath = null) {
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.portPath = portPath;
  }

  async connect(portPath = null) {
    try {
      // Disconnect any existing connection first
      if (this.port && this.isConnected) {
        console.log('Disconnecting existing connection...');
        this.disconnect();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for cleanup
      }

      if (portPath) {
        this.portPath = portPath;
      }

      // If no port specified, try to find Arduino automatically
      if (!this.portPath) {
        const ports = await SerialPort.list();
        const arduinoPort = ports.find(port => 
          port.manufacturer && port.manufacturer.includes('Arduino') ||
          port.description && port.description.includes('Arduino') ||
          port.friendlyName && port.friendlyName.includes('Arduino') ||
          port.path.includes('usb') || port.path.includes('tty.usb')
        );
        
        if (arduinoPort) {
          this.portPath = arduinoPort.path;
          console.log(`Found Arduino at: ${this.portPath}`);
        } else {
          throw new Error('Arduino not found. Please specify the port manually.');
        }
      }

      console.log(`Attempting to connect to: ${this.portPath}`);

      // Create serial connection with additional options
      this.port = new SerialPort({
        path: this.portPath,
        baudRate: 9600,
        autoOpen: false,
        lock: false,  // Don't lock the port
        parity: 'none',
        stopBits: 1,
        dataBits: 8
      });

      // Create parser for line-by-line reading
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));

      // Set up event handlers
      this.port.on('open', () => {
        console.log('Connected to RoboPuppy!');
        this.isConnected = true;
      });

      this.port.on('error', (err) => {
        console.error('Serial port error:', err.message);
        this.isConnected = false;
        
        // Provide specific error messages
        if (err.message.includes('Resource temporarily unavailable') || 
            err.message.includes('Cannot lock port')) {
          console.error('Port is busy. Please:');
          console.error('1. Close Arduino IDE Serial Monitor');
          console.error('2. Close any other applications using the port');
          console.error('3. Wait a few seconds and try again');
        }
      });

      this.port.on('close', () => {
        console.log('Disconnected from RoboPuppy');
        this.isConnected = false;
      });

      // Listen for responses from Arduino
      this.parser.on('data', (data) => {
        console.log('Arduino response:', data.trim());
      });

      // Open the port with retry logic
      let retries = 3;
      while (retries > 0) {
        try {
          await new Promise((resolve, reject) => {
            this.port.open((err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          break; // Success, exit retry loop
        } catch (err) {
          retries--;
          if (retries > 0) {
            console.log(`Connection attempt failed, retrying in 2 seconds... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw err; // Re-throw the error if all retries failed
          }
        }
      }

      // Wait a moment for Arduino to initialize
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error('Connection failed:', error.message);
      throw error;
    }
  }

  async sendCommand(command) {
    if (!this.isConnected) {
      throw new Error('Not connected to Arduino');
    }

    return new Promise((resolve, reject) => {
      this.port.write(command + '\n', (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Sent command: ${command}`);
          resolve();
        }
      });
    });
  }

  // Robot control methods
  async stand() {
    await this.sendCommand('stand');
  }

  async sit() {
    await this.sendCommand('sit');
  }

  async walk() {
    await this.sendCommand('walk');
  }

  async neutral() {
    await this.sendCommand('neutral');
  }

  async down() {
    await this.sendCommand('down');
  }

  async moveLeg(legId, joint, angle) {
    if (legId < 0 || legId > 3) {
      throw new Error('Leg ID must be 0-3');
    }
    if (!['hip', 'knee'].includes(joint)) {
      throw new Error('Joint must be "hip" or "knee"');
    }
    if (angle < -90 || angle > 90) {
      throw new Error('Angle must be between -90 and 90 degrees');
    }

    const command = `leg ${legId} ${joint} ${angle}`;
    await this.sendCommand(command);
  }

  async help() {
    await this.sendCommand('help');
  }

  disconnect() {
    if (this.port) {
      try {
        if (this.isConnected) {
          this.port.close();
        }
        this.isConnected = false;
        this.port = null;
        this.parser = null;
        console.log('Disconnected from RoboPuppy');
      } catch (error) {
        console.error('Error during disconnect:', error.message);
      }
    }
  }
}

// Example usage
async function main() {
  const robot = new RoboPuppyController();
  
  try {
    // Connect to Arduino (will auto-detect if no port specified)
    await robot.connect();
    
    // Wait for Arduino to be ready
    console.log('Waiting for Arduino to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Example commands
    console.log('Testing basic commands...');
    
    await robot.stand();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await robot.sit();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await robot.neutral();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test individual leg control
    console.log('Testing leg control...');
    await robot.moveLeg(0, 'hip', 30);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await robot.moveLeg(0, 'knee', -30);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await robot.moveLeg(0, 'hip', 0);
    await robot.moveLeg(0, 'knee', 0);
    
    console.log('Demo completed!');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    robot.disconnect();
  }
}

// Export for use as module
module.exports = RoboPuppyController;

// Run demo if this file is executed directly
if (require.main === module) {
  main();
}
