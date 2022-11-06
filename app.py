from flask import Flask
from flask import request, abort, render_template
from flask_cors import CORS
import json
from activatePumps import setup, stir, activatePumps, cleanup

app = Flask(__name__)
CORS(app)
MAKING_DRINK = False

@app.route("/")
def index():
	return render_template("drinks.html")

@app.route("/makedrink", methods=['POST'])
def makedrink():
	global MAKING_DRINK
	if (not MAKING_DRINK): 
		MAKING_DRINK = True
		result = activatePumps(json.loads(request.data))
		MAKING_DRINK = False
	else:
		result = "Making drink!"
	return result

@app.route("/pumps", methods=['GET', 'POST'])
def pumps():
	f = open('pumps.json', 'r+')
	pumps = json.load(f)

	if request.method == 'GET':
		result = json.dumps(pumps, separators=(",", ":"), indent=4)
		f.close()
		return result
	if request.method == 'POST':
		pumpData = json.loads(request.data.decode())
		f.truncate(0)
		f.seek(0)
		json.dump(pumpData, f)
		f.close()
		return "Success!"

@app.route("/recipes", methods=['GET', 'POST'])
def recipes():
	f = open('recipes.json', 'r+')
	recipes = json.load(f)

	if request.method == 'GET':
		result = json.dumps(recipes, separators=(",", ":"), indent=4)
		f.close()
		return result
	if request.method == 'POST':
		recipeData = json.loads(request.data.decode())
		recipes.append(recipeData)
		f.seek(0)
		json.dump(recipes, f)
		f.close()
		return "Success!"

@app.route("/pumpable", methods=['GET', 'POST'])
def pumpable():
	f = open('pumpable.json', 'r+')
	pumpable = json.load(f)

	if request.method == 'GET':
		result = json.dumps(pumpable, separators=(",", ":"), indent=4)
		f.close()
		return result
	if request.method == 'POST':
		new_ingredient = request.data.decode()
		new_ingredient.strip().replace("\r\n","")
		pumpable.append(new_ingredient)
		f.seek(0)
		json.dump(pumpable, f)
		f.close()
		return "Success!"

@app.route("/unpumpable", methods=['GET', 'POST'])
def unpumpable():
	f = open('unpumpable.json', 'r+')
	unpumpable = json.load(f)

	if request.method == 'GET':
		result = json.dumps(unpumpable, separators=(",", ":"), indent=4)
		f.close()
		return result
	if request.method == 'POST':
		new_ingredient = request.data.decode()
		new_ingredient.strip().replace("\r\n","")
		unpumpable.append(new_ingredient)
		f.seek(0)
		json.dump(unpumpable, f)
		f.close()
		return "Success!"

@app.route("/stir", methods=['GET'])
def run_stirrer():
	return stir()


if __name__ == "__main__":
	setup()
	app.run(host="0.0.0.0")
	cleanup()
