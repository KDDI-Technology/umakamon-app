#include <Adafruit_NeoPixel.h>

#define LED_POWER 11
#define LED_PIN 12 // NeoPixel

Adafruit_NeoPixel pixels(1, LED_PIN);

void ledOn(){
  pixels.setPixelColor(0, pixels.Color(32, 32, 0));
  pixels.show();
}

void ledOnP(){
  pixels.setPixelColor(0, pixels.Color(48, 0, 48));
  pixels.show();
}

void ledOff(){
  pixels.clear(); 
  pixels.show();
}

void setup() {
  pinMode(LED_POWER, OUTPUT);
  digitalWrite(LED_POWER, HIGH);
  ledOn();
  delay(1000);
  

  Serial.begin(115200);
}

void loop() {
  int data = analogRead(A0);
  Serial.println(data);
  delay(100);
}
