import RPi.GPIO as gpio
import time
SHOT_TIME = 60

def setup():
	gpio.setmode(gpio.BCM)
	gpio.setwarnings(False)

	gpio.setup(2, gpio.OUT)
	gpio.setup(3, gpio.OUT)
	gpio.setup(4, gpio.OUT)
	gpio.setup(5, gpio.OUT)
	gpio.setup(6, gpio.OUT)
	gpio.setup(7, gpio.OUT)
	gpio.setup(8, gpio.OUT)
	gpio.setup(9, gpio.OUT)

def activatePumps(pumpArray):
	for i in range(8):
		if pumpArray[i] > 0:
			gpio.output((i+2), gpio.HIGH)

	while(any(pump >= 0 for pump in pumpArray)):
		for i in range(8):
			if pumpArray[i] <= 0:
				gpio.output((i+2), gpio.LOW)
			pumpArray[i] -= 1
		time.sleep(SHOT_TIME)

def cleanup():
	gpio.cleanup()
