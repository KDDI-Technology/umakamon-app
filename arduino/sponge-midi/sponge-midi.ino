#include <Adafruit_NeoPixel.h>

#define LED_POWER 11
#define LED_PIN 12 // NeoPixel

Adafruit_NeoPixel pixels(1, LED_PIN);

#define LATCH_MAX 32 // INTERVAL_MS x 32 = 1600ms
#define INTERVAL_MS 50 // 50ms
#define CALIB_TIMES 500
#define CALIB_INTERVAL_MS 10

int calibData[CALIB_TIMES];
int median = 0;
int thrValue = 30; // てきとう
int mod = 0; // -1: negative start 0: stop 1: positive start
int value = 0;
int latchCnt = 0;
int prevMode = 0;

void ledOn(){
  pixels.setPixelColor(0, pixels.Color(32, 32, 0));
  pixels.show();
}

void ledOnP(){
  pixels.setPixelColor(0, pixels.Color(48, 0, 48));
  pixels.show();
}

void ledOnR(){
  pixels.setPixelColor(0, pixels.Color(0, 0, 48));
  pixels.show();
}
void ledOnG(){
  pixels.setPixelColor(0, pixels.Color(48, 0, 0));
  pixels.show();
}
void ledOnB(){
  pixels.setPixelColor(0, pixels.Color(0, 48, 0));
  pixels.show();
}

void ledOff(){
  pixels.clear(); 
  pixels.show();
}

void quickSortInt(int arr[], int left, int right) {
  int i = left, j = right;
  int pivot = arr[(left + right) / 2];
  while (i <= j) {
    while (arr[i] < pivot) i++;
    while (arr[j] > pivot) j--;
    if (i <= j) {
      int tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      i++;
      j--;
    }
  }
  if (left < j) quickSortInt(arr, left, j);
  if (i < right) quickSortInt(arr, i, right);
}

int medianPercentClipInt(int data[], int n, int percentile) {
  quickSortInt(data, 0, n - 1);
  int cut = (n * percentile) / 100;
  if (cut * 2 >= n) {
    cut = 0;
  }
  int start = cut;
  int end   = n - cut - 1;
  int m = end - start + 1;
  if (m <= 0) {
    return data[n / 2];
  }
  if (m % 2 == 1) {
    return data[start + m / 2];
  } else {
    int a = data[start + m / 2 - 1];
    int b = data[start + m / 2];
    return (a + b) / 2;
  }
}

void setup() {
  pixels.begin();
  pinMode(LED_POWER, OUTPUT);
  digitalWrite(LED_POWER, HIGH);

  Serial.begin(115200);
  ledOnB();
  delay(2000);
  ledOff();
  delay(500);
  calib();
}


void calib(){
  int cnt;
  Serial.println("Calibration Started.");
  Serial.println("Don't touch sensor.");
  ledOn();
  for(cnt=0;cnt<CALIB_TIMES;cnt++){
    int data = analogRead(A0);
    calibData[cnt] = data;
    delay(CALIB_INTERVAL_MS);
    
  }
  median = medianPercentClipInt(calibData,500,5);
  Serial.print("median = ");
  Serial.println(median);
  ledOff();
  Serial.println("Calibration finished.");
}

void loop() {
  int data = analogRead(A0);
  Serial.println(data);
  if(latchCnt > 0){
    latchCnt --;
    if(latchCnt == 0){
      prevMode = 0;
    }
  }
  if(mod == 0){
    if(data > (median + thrValue)){
      if(prevMode != -1){
        mod = 1;
      }else{
        value = data;
      }
    }else if(data < (median - thrValue)){
      if(prevMode != 1){
        mod = -1;
      }else{
        value = data;
      }
    }else{
      value = data;
    }
  }
  if(mod > 0){
    if(data > value){
      value = data;  
    }
    if(data < median){
      Serial.print("P fire = ");
      Serial.println(value);
      value = median;
      latchCnt = LATCH_MAX;
      prevMode = mod;
      mod = 0;
    }
  }
  if(mod < 0){
    if(data < value){
      value = data;  
    }
    if(data > median){
      Serial.print("N fire = ");
      Serial.println(value);
      value = median;
      latchCnt = LATCH_MAX;
      prevMode = mod;
      mod = 0;
    }
  }
  delay(INTERVAL_MS);
  if(BOOTSEL){
    calib();
  }
}
