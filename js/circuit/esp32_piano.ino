// ESP32: 7-key piano with a buzzer
// Each key connects a pin to GND. INPUT_PULLUP keeps the pin HIGH until
// the key is pressed, then it reads LOW.
// The buzzer is on D23 and tone() plays the note on it (frequencies in Hz).

const int KEYS[7]  = {13, 14, 27, 26, 25, 33, 32};   // Do Re Mi Fa Sol La Si
const int NOTES[7] = {262, 294, 330, 349, 392, 440, 494};
const int BUZZER   = 23;

void setup() {
  for (int i = 0; i < 7; i++) pinMode(KEYS[i], INPUT_PULLUP);
  pinMode(BUZZER, OUTPUT);
}

void loop() {
  bool played = false;
  for (int i = 0; i < 7; i++) {
    if (digitalRead(KEYS[i]) == LOW) {   // key pressed
      tone(BUZZER, NOTES[i]);
      played = true;
      break;                              // one note at a time
    }
  }
  if (!played) noTone(BUZZER);
}
