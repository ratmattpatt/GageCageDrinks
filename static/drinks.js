//const DRINKSERVER = "http://192.168.1.188:5000/";
const DRINKSERVER = "http://localhost:5000/";

var serverData = {};
serverData["pumps"] = {};
serverData["recipes"] = {};
serverData["pumpable"] = {};
serverData["unpumpable"] = {};

var showAllRecipes = false;
var currentRecipe = "";
var currentPump = 0;
var makeable = false;

function ajaxGET(address) {
  return $.ajax({
    type: "GET",
    contentType: "application/json",
    url: DRINKSERVER + address,
    success: function(data) {
      serverData[address] = JSON.parse(data);
    },
    error: function(e) {
      console.error(e);
    }
  });
}
function ajaxPOST(address, data) { 
  return $.ajax({
    type: "POST",
    contentType: "application/json",
    url: DRINKSERVER + address,
    data: data,
    success: function(d) {
      if (d == "Making drink!")
        alert("Drink machine is currently in use! Please wait until the machine is done making the current drink before you make yours!")
      else
        console.log(d);
    },
    error: function(e) {
      console.error(e);
    } 
  });
}

function checkDrink() { 
  let required = currentRecipe.pumpable;
  let pumps = serverData["pumps"];

  if (required == null || required == undefined)
    return false;
  
  let canMake = (p, r) =>  Object.keys(r).every(i => p.includes(i));
  let makeable = canMake(pumps, required);

  if (makeable) {
    $("#make-drink").removeClass("btn-danger");
    $("#make-drink").addClass("btn-success");
  } else {
    $("#make-drink").removeClass("btn-success");
    $("#make-drink").addClass("btn-danger");
  }
}
function checkRecipe(recipe) { 
  let required = recipe.pumpable;
  let pumps = serverData["pumps"];

  if (required == null || required == undefined)
    return false;

  let canMake = (p, r) => Object.keys(r).every(i => p.includes(i));
  return canMake(pumps, required);
}

function updateDrinkPanels() {
  ajaxGET("recipes").then(() => {
    let recipes = serverData["recipes"];

    recipes.sort((a, b) => b.times_mixed - a.times_mixed);

    $('#drink-container').html("");
    
    for (r in recipes) {
      let color = recipes[r].color;

      if (!checkRecipe(recipes[r])) {
        if (showAllRecipes)
          color = "#888888";
        else
          continue;
      }

      let block = '<div class="drink-display" style="background-color: ' + color + '" id="drink-' + recipes[r].name + '">';
      block += '<h3>' + capitalize(recipes[r].name) + '</h3>';
      block += '<ul>';
      for (p in recipes[r].pumpable) {
        block += '<li>' + capitalize(p) + '</li>';
      }
      block += '</ul><ul>'
      for (u in recipes[r].unpumpable) {
        block += '<li>' + capitalize(u) + '</li>';
      }
      block += '</ul>'
      block += '<img src="../static/assets/' + recipes[r].glass_type + '.png" class="drink-display-icon">'
      block += '</div>';

      let html = $('#drink-container').html()
      $('#drink-container').html(html + block);
    }

    addCreateDrinkPanel();
  });
}
function addCreateDrinkPanel() {
  let block = '<div class="drink-display" style="background-color: #aaaaaa" id="create-drink-container">';
  block += '<h3>Create New Drink!</h3><span style="font-size: 150px; margin: 70px 130px" class="glyphicon glyphicon-plus"></span></div>';
  
  let html = $('#drink-container').html()
  $('#drink-container').html(html + block);
}

function updateIngredientSelector() { 
  updateIngredientLists();
  let pumpable = serverData["pumpable"];
  let unpumpable = serverData["unpumpable"];

    var pumpSelect = document.getElementById("ingredient-select");
    pumpSelect.options.length = 0;

    for (p in pumpable) 
      pumpSelect.options[pumpSelect.options.length] = new Option(capitalize(pumpable[p]), pumpable[p]);

    var createSelect = document.getElementsByClassName("recipe-ingredient-select");
    for (let i = 0; i < createSelect.length; i++) {
      let s = createSelect[i];
      s.options.length = 0;
      
      for (p in pumpable) 
      s.options[s.options.length] = new Option(capitalize(pumpable[p]), pumpable[p]);
      for (u in unpumpable)
      s.options[s.options.length] = new Option(capitalize(unpumpable[u]), unpumpable[u]);
    }

}

function convertRecipeToPumpArray() {
  let pumps = serverData["pumps"];
  let ingredients = currentRecipe.pumpable;
  let result = [];
  let found = false;
  for (p in pumps) {
    for (i in ingredients) {
      if (pumps[p] == i) {
        result.push(parseInt(ingredients[i]));
        found = true;
        break;
      }
    }

    if (!found)
      result.push(0);

    found = false;
  }

  return result;
}

function updateCurrentPumpIngredients() {
  ajaxGET("pumps").then(() => {
    let pumps = serverData["pumps"];

    for (let i = 1; i < 9; i++) {
      document.getElementById("pump-button-"+i).innerHTML = capitalize(pumps[i-1]);
    }
  });
}
function updateIngredientLists() {
  ajaxGET("pumpable");
  ajaxGET("unpumpable");
}

window.addEventListener('load', function() {
  updateCurrentPumpIngredients();
  updateDrinkPanels();
  updateIngredientLists();
});
// Add click listeners:
$(document).ready(function() {
  $('#make-drink').on("click touchstart", function() {
    let manualAdditions = "";
    
    if (currentRecipe.times_mixed == undefined)
      currentRecipe.times_mixed = 0;

    if (makeable) {
      if (confirm("Please confirm that you would like to make a " + capitalize(currentRecipe.name) + ", and that there is a cup in the machine.")) {
        for (u in currentRecipe.unpumpable) {
          manualAdditions += "    ";
          if (currentRecipe.unpumpable[u] == 8)
            manualAdditions += "Top up with ";
          else {
            manualAdditions += currentRecipe.unpumpable[u] + " shot";
            if (currentRecpie.unpumpable[u] > 1)
              manualAdditions += "s";
            manualAdditions += " of ";
          }
          manualAdditions += capitalize(u) + "\n";
        }
        if (manualAdditions.length > 0)
          alert("Add the following ingredients to you drink manually:\n" + manualAdditions);

        ajaxPOST("makedrink", JSON.stringify(convertRecipeToPumpArray()));
        currentRecipe.times_mixed++;
      }
    } else {
      alert("You don't have the correct ingredients in the pumps right now to make this drink!");
    }
  });
  $("#list-all-button").on("click touchstart", function() {
    showAllRecipes = !showAllRecipes;
    updateDrinkPanels();

    if (showAllRecipes)
      $("#list-all-button").css("background-color", "#66dd66");
    else
      $("#list-all-button").css("background-color", "#ffffff");
  })
  $('#pump-picker-open').on("click touchend", function() {
    $('#pump-picker').addClass("open");
    $('#pump-picker').removeClass("closed");
  });
  $('#pump-picker-close').on("click touchend", function() {
    $('#pump-picker').addClass("closed");
    $('#pump-picker').removeClass("open");
  });
  $('#stir-button').on("click touchstart", function() {
    if (confirm("Would you like to stir your drink again?"))
      ajaxGET("stir");
  });
  
  $('.btn-pump').on("click touchstart", function(e) {
      $('#choose-ingredient-modal').css("display", "block");
  
      currentPump = parseInt(e.target.id.substr(-1))-1;
  
      updateIngredientSelector();
  });
  $("#create-ingredient-modal-button1").on("click touchstart", function() {
    $('#create-ingredient-modal').css("display", "block");
    console.log("opening modal...");
  });
  $("#create-ingredient-modal-button2").on("click touchstart", function() {
    $('#create-ingredient-modal').css("display", "block");
    console.log("opening modal...");
  });
  $('#choose-ingredient-modal-close').on("click touchstart", function() {
    $('#choose-ingredient-modal').css("display", "none");
  });
  $('#create-ingredient-modal-close').on("click touchstart", function() {
    $('#create-ingredient-modal').css("display", "none");
  });
  $('#create-drink-modal-close').on("click touchstart", function() {
    $('#create-drink-modal').css("display", "none");
  });
  $('#create-ingredient-button').on("click touchstart", function() {
    let pumpable = serverData["pumpable"];
    let unpumpable = serverData["unpumpable"]; 
    let field = document.getElementById("new-ingredient");
    let newIngredient = field.value;
  
    if (newIngredient == "") {
      $("#create-ingredient-modal").css("display", "none");
      return;
    }
  
    newIngredient.replaceAll(" ", "_");
    newIngredient = newIngredient.toLowerCase();
  
    if ($("#pumpable-checkbox").prop('checked')) {
      for (p in pumpable)
        if (stringsAreSimilar(newIngredient, pumpable[p])) {
          alert("This ingredient already exists in the system!");
          return;
        }
  
      ajaxPOST("pumpable", newIngredient).then(() => {
        updateIngredientSelector();
      });
    }
    else {
      for (u in unpumpable)
        if (stringsAreSimilar(newIngredient, unpumpable[u])) {
          alert("This ingredient already exists in the system!");
          return;
        }
  
      ajaxPOST("unpumpable", newIngredient).then(() => {
        updateIngredientSelector();
      });
    }
  
    $("#create-ingredient-modal").css("display", "none");
    $("#new-ingredient").val("");
  });
  
  $("#add-ingredient").on("click touchstart", function() {
    let pumpable = serverData["pumpable"];
    let unpumpable = serverData["unpumpable"];
  
    // Save old ingredients
    let createSelect = document.getElementsByClassName("recipe-ingredient-select");
    let createAmount = document.getElementsByClassName("recipe-ingredient-amount");
    let values = [];
    let amounts = [];
    for (let i = 0; i < createSelect.length; i++) {
      values.push(createSelect[i].value);
      amounts.push(createAmount[i].value);
    }
  
    let body = getAddIngredientElement();
  
    let html = $("#create-drink-modal-body").html();
    $("#create-drink-modal-body").html(html + body);
  
    // Restore old ingredients
    createSelect = document.getElementsByClassName("recipe-ingredient-select");
    createAmount = document.getElementsByClassName("recipe-ingredient-amount");
    for (let i = 0; i < createSelect.length - 1; i++) {
      createSelect[i].value = values[i];
      createAmount[i].value = amounts[i];
    }
  
    // Update ingredients list for new selector
    let i = createSelect.length - 1;
    let s = createSelect[i];
    s.options.length = 0;
    
    for (p in pumpable) 
      s.options[s.options.length] = new Option(capitalize(pumpable[p]), pumpable[p]);
    for (u in unpumpable)
      s.options[s.options.length] = new Option(capitalize(unpumpable[u]), unpumpable[u]);
  });
  
  $("#create-drink-button").on("click touchstart", function() {    
    // Get the new recipe data
    let name = $("#create-drink-name").val();
    let createSelect = document.getElementsByClassName("recipe-ingredient-select");
    let createAmount = document.getElementsByClassName("recipe-ingredient-amount");
    let values = [];
    let amounts = [];
    for (let i = 0; i < createSelect.length; i++) {
      values.push(createSelect[i].value);
      if (createAmount[i] == 0)
        amounts.push("dash");
      else if (createAmount[0] == 9)
        amounts.push("top_up");
      else
        amounts.push(createAmount[i].value);
    }
    let glasstype = $("#create-drink-glass-type").val();
    let color = $("#create-drink-color-picker").val();
    
    // Check new recipe data
    let goodRecipe = true;
    if (name == null || name == undefined)
      goodRecipe = false;
    else if (name.length < 3)
      goodRecipe = false;
    else if (hasDuplicates(values))
      goodRecipe = false;
  
  
    if (goodRecipe) {
      // Create recipe object
      let newRecipe = {};
      newRecipe.name = name.replaceAll(" ", "_");
      let splitIngredients = splitIngredientList(values);
      let pump = splitIngredients[0];
      let unpump = splitIngredients[1];
  
      let pumpableObj = {};
      for (let i = 0; i < pump.length; i++) {
        pumpableObj[pump[i]] = amounts[values.indexOf(pump[i])];
      }
      let unpumpableObj = {};
      for (let i = 0; i < unpump.length; i++) {
        unpumpableObj[unpump[i]] = amounts[values.indexOf(unpump[i])];
      }
  
      newRecipe.pumpable = pumpableObj;
      newRecipe.unpumpable = unpumpableObj;
      newRecipe.color = color;
      newRecipe.glass_type = glasstype;
  
      // Send new recipe to the server
      ajaxPOST("recipes", JSON.stringify(newRecipe));
    } else {
      alert("Invalid recipe! Please try again, make sure to add a name and to not have any duplicate ingredients!");
    }
  
    // Reset create drink modal
    let pumpable = serverData["pumpable"];
    let unpumpable = serverData["unpumpable"];
    $("#create-drink-modal-body").html(getAddIngredientElement());
    let i = createSelect.length - 1;
    let s = createSelect[i];
    s.options.length = 0;
    
    for (p in pumpable) 
      s.options[s.options.length] = new Option(capitalize(pumpable[p]), pumpable[p]);
    for (u in unpumpable)
      s.options[s.options.length] = new Option(capitalize(unpumpable[u]), unpumpable[u]);
  
    $("#create-drink-name").val("");
    
    // Close the modal
    $('#create-drink-modal').css("display", "none");
  });
  
  $("#choose-ingredient-button").on("click touchstart", function() {
    let pumps = serverData["pumps"];
    let ingredient = document.getElementById("ingredient-select").value;

    if (ingredient in pumps) {
      alert("This ingredient is already in the machine!");
      $('#choose-ingredient-modal').css("display", "none");
      return;
    }

    pumps[currentPump] = ingredient;
  
    ajaxPOST("pumps", JSON.stringify(pumps)).then(() => {
      updateCurrentPumpIngredients();
    });
  
    $('#choose-ingredient-modal').css("display", "none");
  });

  $("#clean-pump-button").on("click touchstart", function() {
    if (confirm("Please confirm that the selected pump has water in it and there is a cup in the machine.")) {
      let tempPumpArray = [];
      let pumps = serverData["pumps"];

      for (let i = 0; i < 8; i++) {
        if (i == currentPump)
          tempPumpArray.push(3);
        else
          tempPumpArray.push(0);
      }

      pumps[currentPump] = "None";
  
      ajaxPOST("makedrink", JSON.stringify(tempPumpArray));
      ajaxPOST("pumps", JSON.stringify(pumps));

      updateCurrentPumpIngredients();
      $('#choose-ingredient-modal').css("display", "none");
    }
  });

  $("#create-drink-color-picker").on("input", function() {
    color = document.getElementById("create-drink-color-picker").value;
    document.getElementById("color-input-wrapper").style.backgroundColor = color;
  });
});
$(document).on("click touchstart", function(e) {
  let recipes = serverData["recipes"];

  if (e.target.classList.value.includes("drink-display")) {
    if (e.target.id == "create-drink-container") {
      makeable = false;
      updateIngredientSelector();
      $('#create-drink-modal').css("display", "block");
      return;
    }
    console.log("click");
    for (r in recipes) {
      if (recipes[r].name == e.target.id.substr(6))
        // Recipe exists, set it as the current recipe
        currentRecipe = recipes[r];
        // Set the current drink name
        $("#current-drink").html(capitalize(currentRecipe.name));
        // Check if the drink can be made with the current pump ingredients
        checkDrink();
    }
  }
});

// Hard coded ingredient addition html for adding an ingredient to a recipe
function getAddIngredientElement() {
  let body = '<div class="row-md drink-ingredient-create">';
  body += '<input type="number" min="0.5" max="8" step="0.5" value="1" class="recipe-ingredient-amount">';
  body += '<h4 style="margin: 8px 0px 0px 0px;">Shots: </h4>';
  body += '<select class="recipe-ingredient-select"></select>';
  body += '</div>';

  return body;
}
// Helper to split a full ingredient list into the pumpable ingredients and unpumpable ones
function splitIngredientList(arr) {
  let pumpable = serverData["pumpable"];
  let unpumpable = serverData["unpumpable"];

  let result = [];
  let pump = arr.filter(a => pumpable.includes(a));
  let unpump = arr.filter(a => unpumpable.includes(a));

  result.push(pump);
  result.push(unpump);
  return result;
}
// Helper to capitalize first letter to make things pretty :)
function capitalize(s) {
  if (s == undefined || s == null)
    return s;

  let words = s.split("_");

  for (let i = 0; i < words.length; i++) {
    words[i] = words[i][0].toUpperCase() + words[i].substr(1);
  }

  return words.join(" ");
}
// From the internet to hopefully avoid any duplicate ingredients :)
function getStringDifference(stringA, stringB) {
    var cost = [],
      str1 = stringA,
      str2 = stringB,
      n = str1.length,
      m = str2.length,
      i, j;
  
    var minimum = function (a, b, c) {
      var min = a;
      if (b < min) {
        min = b;
      }
      if (c < min) {
        min = c;
      }
      return min;
    };
  
    if (n == 0) {
      return;
    }
    if (m == 0) {
      return;
    }
  
    for (var i = 0; i <= n; i++) {
      cost[i] = [];
    }
  
    for (i = 0; i <= n; i++) {
      cost[i][0] = i;
    }
  
    for (j = 0; j <= m; j++) {
      cost[0][j] = j;
    }
  
    for (i = 1; i <= n; i++) {
  
      var x = str1.charAt(i - 1);
  
      for (j = 1; j <= m; j++) {
  
        var y = str2.charAt(j - 1);
  
        if (x == y) {
  
          cost[i][j] = cost[i - 1][j - 1];
  
        } else {
  
          cost[i][j] = 1 + minimum(cost[i - 1][j - 1], cost[i][j - 1], cost[i - 1][j]);
        }
  
      }
  
    }
  
    return cost[n][m];
} 
function stringsAreSimilar(stringA, stringB) {
    return getStringDifference(stringA, stringB) < 3;
}
function hasDuplicates(arr) {
  for (a in arr) {
    if (arr.indexOf(arr[a]) != a)
      return true;
  }

  return false;
}