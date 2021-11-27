import RPi.GPIO as gpio
import time
SHOT_TIME = 17

def setup():
	gpio.setmode(gpio.BCM)
	gpio.setwarnings(False)

	# setup pumps:
	gpio.setup(2, gpio.OUT)
	gpio.setup(3, gpio.OUT)
	gpio.setup(4, gpio.OUT)
	gpio.setup(5, gpio.OUT)
	gpio.setup(6, gpio.OUT)
	gpio.setup(7, gpio.OUT)
	gpio.setup(8, gpio.OUT)
	gpio.setup(9, gpio.OUT)

	# setup pressure plate:
	gpio.setup(17, gpio.IN)
	# setup mixer:
	gpio.setup(27, gpio.OUT)

def activatePumps(pumpArray):
	if (gpio.input(17) == 0):
		return "No cup!"
	
	for i in range(8):
		if pumpArray[i] > 0:
			gpio.output((i+2), gpio.HIGH)

	while(any(pump >= 0 for pump in pumpArray)):
		for i in range(8):
			if pumpArray[i] <= 0:
				gpio.output((i+2), gpio.LOW)
			pumpArray[i] -= 1
		time.sleep(SHOT_TIME)
	
	# mix the ingredients!
	gpio.output(27, gpio.HIGH)
	time.sleep(5)
	gpio.output(27, gpio.LOW)

	return "Success!"

def cleanup():
	gpio.cleanup()
