const { SerialPort } = require('serialport');

async function troubleshootPorts() {
  console.log('🔍 RoboPuppy Port Troubleshooting\n');
  
  try {
    // List all available ports
    console.log('📋 Available Serial Ports:');
    const ports = await SerialPort.list();
    
    if (ports.length === 0) {
      console.log('❌ No serial ports found!');
      console.log('   - Make sure Arduino is connected via USB');
      console.log('   - Check USB cable (try a different one)');
      console.log('   - Try unplugging and reconnecting Arduino');
      return;
    }
    
    ports.forEach((port, index) => {
      console.log(`   ${index + 1}. ${port.path}`);
      console.log(`      Description: ${port.description || 'Unknown'}`);
      console.log(`      Manufacturer: ${port.manufacturer || 'Unknown'}`);
      console.log(`      Product ID: ${port.productId || 'Unknown'}`);
      console.log(`      Vendor ID: ${port.vendorId || 'Unknown'}`);
      console.log('');
    });
    
    // Try to identify Arduino ports
    console.log('🤖 Arduino Port Detection:');
    const arduinoPorts = ports.filter(port => 
      port.manufacturer && port.manufacturer.includes('Arduino') ||
      port.description && port.description.includes('Arduino') ||
      port.friendlyName && port.friendlyName.includes('Arduino') ||
      port.path.includes('usb') || port.path.includes('tty.usb')
    );
    
    if (arduinoPorts.length > 0) {
      console.log('✅ Found potential Arduino ports:');
      arduinoPorts.forEach(port => {
        console.log(`   - ${port.path} (${port.description || port.manufacturer})`);
      });
    } else {
      console.log('⚠️  No Arduino ports detected automatically');
      console.log('   Try connecting Arduino and running this script again');
    }
    
    // Test port availability
    console.log('\n🧪 Testing Port Availability:');
    for (const port of ports) {
      try {
        console.log(`Testing ${port.path}...`);
        
        const testPort = new SerialPort({
          path: port.path,
          baudRate: 9600,
          autoOpen: false,
          lock: false
        });
        
        await new Promise((resolve, reject) => {
          testPort.open((err) => {
            if (err) {
              console.log(`   ❌ ${port.path}: ${err.message}`);
              reject(err);
            } else {
              console.log(`   ✅ ${port.path}: Available`);
              testPort.close();
              resolve();
            }
          });
        });
        
      } catch (error) {
        if (error.message.includes('Resource temporarily unavailable') || 
            error.message.includes('Cannot lock port')) {
          console.log(`   🔒 ${port.path}: Port is locked/busy`);
          console.log('      Solutions:');
          console.log('      - Close Arduino IDE Serial Monitor');
          console.log('      - Close any other applications using this port');
          console.log('      - Wait a few seconds and try again');
        } else {
          console.log(`   ❌ ${port.path}: ${error.message}`);
        }
      }
    }
    
    console.log('\n💡 Troubleshooting Tips:');
    console.log('1. Close Arduino IDE Serial Monitor before connecting');
    console.log('2. Close any other applications that might use the serial port');
    console.log('3. Try unplugging and reconnecting the Arduino');
    console.log('4. On macOS, you might need to add your user to the dialout group:');
    console.log('   sudo dseditgroup -o edit -a $(whoami) -t user _developer');
    console.log('5. Try a different USB cable or USB port');
    console.log('6. Restart your computer if the issue persists');
    
  } catch (error) {
    console.error('❌ Error during troubleshooting:', error.message);
  }
}

// Run troubleshooting
if (require.main === module) {
  troubleshootPorts();
}

module.exports = troubleshootPorts;
