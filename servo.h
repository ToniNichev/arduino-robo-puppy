Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

struct Step {
  float pos;
  float speed;
};

class Servo {
  public:
    int pin = 0;
    float pos = 0;
    float targetPos = 0;
    float trim = 0;
    float minAngle = -90;  // Servo limits
    float maxAngle = 90;
    bool reverse = false;  // For inverted servos
    int legId = 0;         // Which leg this servo belongs to (0-3)
    bool isHip = false;    // True for hip servos, false for knee servos
    
    bool moveServo(float newPos, float speed) {
      // Clamp target position to servo limits
      targetPos = constrain(newPos, minAngle, maxAngle);
      
      // Calculate movement direction
      float diff = targetPos - pos;
      
      if (abs(diff) < 0.1) {
        pos = targetPos;
        return true; // Reached target
      }
      
      // Move towards target
      if (diff > 0) {
        pos = min(pos + speed, targetPos);
      } else {
        pos = max(pos - speed, targetPos);
      }
      
      // Convert to PWM value
      float angle = pos + trim;
      if (reverse) angle = -angle;
      
      int pwmValue = map(angle, -90, 90, 150, 600); // Adjust PWM range as needed
      pwm.setPWM(pin, 0, pwmValue);
      
      return false; // Still moving
    }
    
    // Apply hardware-specific servo inversions based on leg and joint type
    float applyHardwareInversion(float angle) {
      // Leg 3 hip servo is mounted backwards
      if (legId == 3 && isHip) {
        return -angle;
      }
      // Leg 1 and 3 knee servos are mounted backwards
      if ((legId == 1 || legId == 3) && !isHip) {
        return -angle;
      }
      return angle;
    }
    
    void setPosition(float angle) {
      // Apply hardware-specific inversions before setting position
      angle = applyHardwareInversion(angle);
      targetPos = constrain(angle, minAngle, maxAngle);
    }
};