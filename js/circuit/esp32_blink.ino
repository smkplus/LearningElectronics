// ESP32: two LEDs blinking in turn
// On the ESP32 the pin number is the GPIO number, so D27 means GPIO27.
// Pin voltage is 3.3 V (not the 5 V of an Arduino). With a 330 ohm resistor
// the LED current is about 4 mA.

const int REDLED   = 27;   // red LED
const int GREENLED = 26;   // green LED
const int ONBOARD  = 2;    // blue LED on the board itself

void setup() {
  pinMode(REDLED, OUTPUT);
  pinMode(GREENLED, OUTPUT);
  pinMode(ONBOARD, OUTPUT);
}

void loop() {
  // red on, green off
  digitalWrite(REDLED, HIGH);
  digitalWrite(ONBOARD, HIGH);
  digitalWrite(GREENLED, LOW);
  delay(500);

  // green on, red off
  digitalWrite(REDLED, LOW);
  digitalWrite(ONBOARD, LOW);
  digitalWrite(GREENLED, HIGH);
  delay(500);
}
