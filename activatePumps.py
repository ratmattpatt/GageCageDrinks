import platform
if platform.system() == "Windows":
	__DEBUG__ = True
else:
	import RPi.GPIO as gpio
import time
SHOT_TIME = 17

def setup():
	if __DEBUG__:
		print("Setting up GPIO...")
		return

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

	# setup mixer:
	gpio.setup(27, gpio.OUT)

	# turn on cpu fan
	gpio.setup(20, gpio.OUT)
	gpio.output(20, gpio.HIGH)

def stir():
	if __DEBUG__:
		print("Stirring... ", end='')
		time.sleep(8)
		print("Done!")
		return
	
    # mix the ingredients!
	gpio.output(27, gpio.HIGH)
	time.sleep(8)
	gpio.output(27, gpio.LOW)

def activatePumps(pumpArray):
	for i in range(8):
		if pumpArray[i] > 0:
			if __DEBUG__:
				print("Starting pump #" + str(i+2) + "...")
			else:
				gpio.output((i+2), gpio.HIGH)

	while(any(pump > 0 for pump in pumpArray)):
		time.sleep(SHOT_TIME)
		for i in range(8):
			if pumpArray[i] <= 1:
				if __DEBUG__:
					print("Stopping pump #" + str(i+2) + "...")
				else:
					gpio.output((i+2), gpio.LOW)
			pumpArray[i] -= 1
	
	stir()

	return "Success!"

def cleanup():
	if __DEBUG__:
		print("Cleaning up GPIO...")
		return

	gpio.output(20, gpio.LOW)
	gpio.cleanup()
