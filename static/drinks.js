window.onload = function() {
  let pumps = "";
  let recipes = "";
  let pumpable = "";
  let unpumpable = "";

  let currentRecipe = "";
  let currentPump = 0;
  let makeable = false;

  checkDrink = function() { 
    makeable = true;
    let required = currentRecipe.pumpable;

    let check = false;
    for (r in required) {
      for (p in pumps) {
        if (pumps[p] == r)
          check = true;
      }
      if (!check)
        makeable = false;
      check = false;
    }

    if (makeable) {
      $("#make-drink").removeClass("btn-danger");
      $("#make-drink").addClass("btn-success");
    } else {
      $("#make-drink").removeClass("btn-success");
      $("#make-drink").addClass("btn-danger");
    }
  }

  document.onclick = function(e) {
    if (e.target.classList.value.includes("drink-display")) {
      if (e.target.id == "create-drink-container") {
        makeable = false;
        updateIngredientSelect();
        $('#create-drink-modal').css("display", "block");
        return;
      }
      
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
  }

  $('#make-drink').on("click", function() {
    convertRecipeToPumpArray();
    if (makeable) {
      $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "http://192.168.1.186:5000/makedrink",
        data: JSON.stringify(convertRecipeToPumpArray()),
        success: function(data) {
          if (data == "No cup!")
            alert("No cup in the machine! Make sure there is a cup there before trying to make a drink!");
          else if (data == "Making drink!")
            alert("Drink machine is currently in use! Please wait until the machine is done making the current drink before you make yours!")
          else
            console.log(data);
        },
        error: function(e) {
          console.error(e);
        } 
      });
    } else {
      alert("You don't have the correct ingredients in the pumps right now to make this drink!");
    }
  });
  $('#pumppicker-toggle').on("click", function() {
      if ($('#pump-picker.open').length == 0) {
          $('#pump-picker').addClass("open");
          $('#pump-picker').removeClass("closed");
          $('#header-bar').addClass("open");
          $('#header-bar').removeClass("closed");
      } else {
          $('#pump-picker').removeClass("open");
          $('#pump-picker').addClass("closed");
          $('#header-bar').removeClass("open");
          $('#header-bar').addClass("closed");
      }
  });

  addCreateDrink = function() {
    let block = '<div class="drink-display" style="background-color: #aaaaaa" id="create-drink-container">';
    block += '<h3>Create New Drink!</h3><span style="font-size: 150px; margin: 70px 130px" class="glyphicon glyphicon-plus"></span></div>';
    
    let html = $('#drink-container').html()
    $('#drink-container').html(html + block);
  }
  showDrinks = function() {
    $('#drink-container').html("");
    
    for (r in recipes) {
      let block = '<div class="drink-display" style="background-color: ' + recipes[r].color + '" id="drink-' + recipes[r].name + '">';
      block += '<h3>' + capitalize(recipes[r].name) + '</h3>';
      block += '<ul>';
      for (p in recipes[r].pumpable) {
        block += '<li>' + p + '</li>';
      }
      block += '</ul><ul>'
      for (u in recipes[r].unpumpable) {
        block += '<li>' + u + '</li>';
      }
      block += '</ul>'
      block += '<img src="../static/assets/' + recipes[r].glass_type + '.png" class="drink-display-icon">'
      block += '</div>';

      let html = $('#drink-container').html()
      $('#drink-container').html(html + block);
    }

    addCreateDrink();
  }
  updatePumps = function() {
    for (let i = 1; i < 9; i++) {
      document.getElementById("pump-button-"+i).innerHTML = capitalize(pumps[i-1]);
    }
  }

  updateRecipeList = function() {
    $.ajax({
      type: "GET",
      contentType: "application/json",
      url: "http://192.168.1.186:5000/recipes",
      success: function(data) {
        recipes = JSON.parse(data);

        showDrinks();
      },
      error: function(e) {
        console.error(e);
      }
    });
  }
  getPumps = function() {
    $.ajax({
      type: "GET",
      contentType: "application/json",
      url: "http://192.168.1.186:5000/pumps",
      success: function(data) {
        pumps = JSON.parse(data);

        updatePumps();
      },
      error: function(e) {
        console.error(e);
      }
    });
  }
  updateIngredientLists = function() {
    // Update pumpable ingredients: 
    $.ajax({
      type: "GET",
      contentType: "application/json",
      url: "http://192.168.1.186:5000/pumpable",
      success: function(data) {
        pumpable = JSON.parse(data);
      },
      error: function(e) {
        console.error(e);
      } 
    });
    // Update unpumpable ingredients: 
    $.ajax({
      type: "GET",
      contentType: "application/json",
      url: "http://192.168.1.186:5000/unpumpable",
      success: function(data) {
        unpumpable = JSON.parse(data);
      },
      error: function(e) {
        console.error(e);
      } 
    })
  }

  updateRecipeList();
  getPumps();
  updateIngredientLists();

  updateIngredientSelect = function() {
      updateIngredientLists();

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

  convertRecipeToPumpArray = function() {
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

  $('.btn-pump').click(function(e) {
      $('#choose-ingredient-modal').css("display", "block");

      currentPump = parseInt(e.target.id.substr(-1))-1;

      updateIngredientSelect();
  });
  $('#choose-ingredient-modal-close').on("click", function() {
      $('#choose-ingredient-modal').css("display", "none");
  });
  $('#create-drink-modal-close').on("click", function() {
    $('#create-drink-modal').css("display", "none");
  });
  $('#add-ingredient-button').click(function() {
      let field = document.getElementById("new-ingredient");
      let newIngredient = field.value;

      if (newIngredient == "")
          return;

      newIngredient.replaceAll(" ", "_");

      if ($("#pumpable-checkbox").prop('checked')) {
          for (p in pumpable)
              if (stringsAreSimilar(newIngredient, pumpable[p])) {
                  alert("This ingredient already exists in the system!");
                  return;
              }

          $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "http://192.168.1.186:5000/pumpable",
            data: newIngredient,
            success: function(data) {
              console.log(data);
            },
            error: function(e) {
              console.error(e);
            } 
          });

          updateIngredientSelect();
      }
      else {
          for (u in unpumpable)
              if (stringsAreSimilar(newIngredient, unpumpable[u])) {
                  alert("This ingredient already exists in the system!");
                  return;
              }

          $.ajax({
            type: "POST",
            contentType: "application/json",
            url: "http://192.168.1.186:5000/unpumpable",
            data: newIngredient,
            success: function(data) {
              console.log(data);
            },
            error: function(e) {
              console.error(e);
            } 
          });

          updateIngredientSelect();
      }

      $("#new-ingredient").val("");
  });

  $("#add-ingredient").click(function() {
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

    // Resore old ingredients
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

  splitIngredientList = function(arr) {
    let result = [];
    let pump = arr.filter(a => pumpable.includes(a));
    let unpump = arr.filter(a => unpumpable.includes(a));

    result.push(pump);
    result.push(unpump);
    return result;
  }
  $("#create-drink-button").click(function() {    
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
      $.ajax({
        type: "POST",
        contentType: "application/json",
        url: "http://192.168.1.186:5000/recipes",
        data: JSON.stringify(newRecipe),
        success: function(data) {
          console.log(data);

          // Reload recipe display
          updateRecipeList();
        },
        error: function(e) {
          console.error(e);
        } 
      });
    } else {
      alert("Invalid recipe! Please try again, make sure to add a name and to not have any duplicate ingredients!");
    }

    // Reset create drink modal
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

  $("#choose-ingredient-button").click(function() {
    let ingredient = document.getElementById("ingredient-select").value;
    pumps[currentPump] = ingredient;

    $.ajax({
      type: "POST",
      contentType: "application/json",
      url: "http://192.168.1.186:5000/pumps",
      data: JSON.stringify(pumps),
      success: function(data) {
        console.log(data);
      },
      error: function(e) {
        console.error(e);
      } 
    });

    updatePumps();
    $('#choose-ingredient-modal').css("display", "none");
  });
}

// Hard coded ingredient addition html for adding an ingredient to a recipe
function getAddIngredientElement() {
  let body = '<div class="row-md drink-ingredient-create">';
  body += '<div style="display: flex;">';
  body += '<h4>Ingredient: </h4>';
  body += '<select class="recipe-ingredient-select"></select>';
  body += '</div>';
  body += '<div style="display: flex;">';
  body += '<h4>Amount: </h4>';
  body += '<input type="range" min="0" max="9" step="1" value="1" class="recipe-ingredient-amount" style="width: 150px;" oninput="this.nextElementSibling.value = this.value">';
  body += '<output>1</output>'
  body += '</div>';
  body += '</div>';

  return body;
}
// Helper to capitalize first letter to make things pretty :)
function capitalize(s) {
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