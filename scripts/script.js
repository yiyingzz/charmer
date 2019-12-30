const app = {};

app.movieKey = "38f9a8f5c677f0356adca226f357b762";
app.movieUrl = `https://api.themoviedb.org/3/discover/movie`;
app.movieInfoUrl = `https://www.themoviedb.org/movie/`;
app.movieImgUrl = `https://image.tmdb.org/t/p/w300`;

app.recipeKey = `37d5d0c2cce74758b4307f9f5c729c0d`;
app.recipeUrl = `https://api.spoonacular.com/recipes/random`;

/*
    AJAX CALLS
*/
app.getMovies = function(query, page, releaseDate) {
  return $.ajax({
    url: app.movieUrl,
    method: "GET",
    dataType: "json",
    data: {
      api_key: app.movieKey,
      with_genres: query,
      page: page,
      "primary_release_date.lte": releaseDate,
      include_adult: false
    }
  });
};

app.getRecipes = function(query) {
  return $.ajax({
    url: app.recipeUrl,
    method: "GET",
    dataType: "json",
    headers: {
      "Content-Type": "application/json"
    },
    data: {
      apiKey: app.recipeKey,
      tags: query,
      number: 4
    }
  });
};

/*
    METHODS
*/
// method for using Promises in AJAX calls
app.makeApiCalls = function(
  usersGenreChoice,
  moviePage,
  movieReleaseDate,
  usersFoodChoice
) {
  $.when(
    app.getMovies(usersGenreChoice, moviePage, movieReleaseDate),
    app.getRecipes(usersFoodChoice)
  )
    .then(function(movieChoices, recipeChoices) {
      $(".loading-screen").hide();
      $("h3").show();
      $(".search-again").show();
      $("footer").show();

      $("html, body").animate(
        {
          scrollTop: $("#results").offset().top
        },
        500
      );

      // prep results for printing to page
      app.prepMovieResults(movieChoices[0].results);
      app.prepRecipeResults(recipeChoices[0].recipes);

      $("#food-search").val(""); // reset inputs
      $("#genre-search").val(28);
    })
    .fail(function(error) {
      $(".loading-screen").hide();
      app.showErrorMessage(
        "Sorry, no results found! Please try another search."
      );
    });
};

// getting the current date so the movie API won't return unreleased movies
app.setMovieReleaseDate = function() {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const day = today.getDate() + 1;
  app.movieReleaseDate = `${year}-${month}-${day}`;
};

// method to get "ready in x min" info & convert to a readable format
app.getRecipeReadyTime = function(recipeTimeData) {
  if (recipeTimeData < 60) {
    const readyTimeString = `${recipeTimeData} minutes`;
    return readyTimeString;
  } else {
    const hours = Math.round(recipeTimeData / 60);
    if (recipeTimeData % 60 === 0) {
      const readyTimeString = `${hours} hours`;
      return readyTimeString;
    } else {
      const minutes = Math.round(recipeTimeData % 60);
      const readyTimeString = `${hours}h ${minutes}min`;
      return readyTimeString;
    }
  }
};

// method to get dish types
app.getDishType = function(dishTypes) {
  const dishTypeList = dishTypes;
  let dishTypeString = `<p>Dish Type(s): `;
  if (dishTypeList == false) {
    dishTypeString = "";
    return dishTypeString;
  } else {
    for (let i = 0; i < dishTypeList.length; i++) {
      if (i === dishTypeList.length - 1) {
        dishTypeString += `${dishTypeList[i]}</p>`;
      } else {
        dishTypeString += `${dishTypeList[i]}, `;
      }
    }
    return dishTypeString;
  }
};

// method to get wine pairings
app.getWinePairings = function(wineList) {
  const winePairingList = wineList;
  let wineString = `<p>Wine Pairing(s): `;
  if (winePairingList === undefined) {
    wineString = "";
    return wineString;
  } else {
    for (let i = 0; i < winePairingList.length; i++) {
      if (i === winePairingList.length - 1) {
        wineString += `${winePairingList[i]}</p>`;
      } else {
        wineString += `${winePairingList[i]}, `;
      }
    }
    return wineString;
  }
};

// Shuffle the movie results using Fisher-Yates algorithm for more randomization
app.shuffleMovieResults = function(movieResults) {
  const newMoviesArray = [...movieResults];
  for (let i = newMoviesArray.length - 1; i > 0; i--) {
    const newIndex = Math.floor(Math.random() * (i + 1));
    const currentMovie = newMoviesArray[i];
    const movieToSwap = newMoviesArray[newIndex];
    newMoviesArray[i] = movieToSwap;
    newMoviesArray[newIndex] = currentMovie;
  }
  return newMoviesArray;
};

// method for prepping movie results for displaying them on the pate
app.prepMovieResults = function(movieResults) {
  $(".movie-results").empty();
  const shuffledMovies = app.shuffleMovieResults(movieResults);
  for (let i = 0; i < 4; i++) {
    const movie = shuffledMovies[i];
    const movieYear = movie.release_date.slice(0, 4);

    // making the movie blurbs a bit shorter so they don't stretch the page
    const movieBlurb = movie.overview.slice(0, 241);

    app.printMoviesToPage(movie, movieYear, movieBlurb);
  } // end of for loop - movies
};

// method for prepping recipe results for displaying them on the page
app.prepRecipeResults = function(recipeResults) {
  $(".recipe-results").empty();
  for (let i = 0; i < 4; i++) {
    const recipe = recipeResults[i];
    const readyTime = app.getRecipeReadyTime(recipe.readyInMinutes);

    // get dish types & wine pairings for each recipe, if available
    const dishTypeHtml = app.getDishType(recipe.dishTypes);
    const wineHtml = app.getWinePairings(recipe.winePairing.pairedWines);

    app.printRecipesToPage(recipe, readyTime, dishTypeHtml, wineHtml);
  } // end of for loop - recipes
};

app.checkFormInputs = function(usersFoodChoice, usersGenreChoice) {
  // check for blank inputs
  const inputChecker = RegExp(/\w/);
  if (!inputChecker.test(usersFoodChoice)) {
    app.showErrorMessage(
      "Please make sure you entered a recipe to search for!"
    );
  } else {
    $("h3").hide();
    $(".search-again").hide();
    $("footer").hide();
    $(".movie-results").empty();
    $(".recipe-results").empty();
    $(".loading-screen").show();

    // use Math.random() to add some randomization to the movie results
    const moviePage = Math.ceil(Math.random() * 100);
    app.setMovieReleaseDate();

    // make API calls & then print results
    app.makeApiCalls(
      usersGenreChoice,
      moviePage,
      app.movieReleaseDate,
      usersFoodChoice
    );
  }
};

app.showErrorMessage = function(message) {
  $(".error-message")
    .show()
    .text(message);
};

// method to print movies to page
app.printMoviesToPage = function(movie, year, blurb) {
  const movieHtml = `
        <div class="movie-card flex-container" data-aos="fade-up" data-aos-duration="500">
            <div class="movie-img">
                <img src="${app.movieImgUrl}${movie.poster_path}" alt="Movie poster for ${movie.title}">
            </div>
            <div class="card-text">
                <p class="card-title">${movie.title} <span class="movie-year">(${year})</span></p>
                <p>${blurb}... <a href="${app.movieInfoUrl}${movie.id}" target="_blank"
            rel="noopener noreferrer">Read more</a></p>
            </div>
        </div>
    `;
  $(".movie-results").append(movieHtml);
};

// method to print recipes to page
app.printRecipesToPage = function(recipe, readyTime, dishTypes, wines) {
  const recipeHtml = `
        <div class="recipe-card flex-container" data-aos="fade-up" data-aos-duration="500">
            <div class="recipe-img">
                <img src="${recipe.image}" alt="${recipe.title}">
            </div>
            <div class="card-text">
                <p class="card-title">${recipe.title}</p>
                <p>Ready in ${readyTime}</p>
                <p>${recipe.analyzedInstructions[0].steps.length} steps, ${recipe.extendedIngredients.length} ingredients</p>
                ${dishTypes}
                ${wines}
                <p><a href="${recipe.sourceUrl}" target="_blank"
            rel="noopener noreferrer">Go to recipe</a></p>
            </div>
        </div>
    `;
  $(".recipe-results").append(recipeHtml);
};

app.init = function() {
  /*
        METHODS THAT NEED TO INITIALIZE
    */
  $("h3").hide();
  $(".search-again").hide();
  $("footer").hide();
  $(".loading-screen").hide();
  $(".error-message").hide();

  /*
        EVENT HANDLERS
    */
  // submit a search
  $("form").on("submit", function(e) {
    e.preventDefault();
    $(".error-message")
      .hide()
      .text(""); // clear error message

    // get user's choices
    app.usersFoodChoice = $("#food-search")
      .val()
      .toLowerCase();
    app.usersGenreChoice = parseInt($("#genre-search").val());

    // make sure the user has made choices & didn't leave a blank input
    app.checkFormInputs(app.usersFoodChoice, app.usersGenreChoice);
  }); // end of form submit event handler

  // changing the heart icon to utensils on hover when searching recipes
  $(".food-search-container").hover(
    function() {
      $(".icon").removeClass("fa-heart");
      $(".icon").addClass("fa-utensils");
    },
    function() {
      $(".icon").removeClass("fa-utensils");
      $(".icon").addClass("fa-heart");
    }
  );

  // changing the heart icon to film on hover when searching movies
  $(".genre-search-container").hover(
    function() {
      $(".icon").removeClass("fa-heart");
      $(".icon").addClass("fa-film");
    },
    function() {
      $(".icon").removeClass("fa-film");
      $(".icon").addClass("fa-heart");
    }
  );

  // smooth scrolling up to search again
  $(".search-again-button").on("click", function() {
    $("html, body").animate(
      {
        scrollTop: $("#landing").offset().top
      },
      1000
    );
  });
}; // end of app.init()

$(function() {
  AOS.init(); // animate on scroll
  app.init();
});
