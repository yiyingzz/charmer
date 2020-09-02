const app = {};

app.movieKey = "38f9a8f5c677f0356adca226f357b762";
app.movieUrl = `https://api.themoviedb.org/3/discover/movie`;
app.movieInfoUrl = `https://www.themoviedb.org/movie/`;
app.movieImgUrl = `https://image.tmdb.org/t/p/w300`;

app.recipeKey = `37d5d0c2cce74758b4307f9f5c729c0d`;
app.recipeUrl = `https://api.spoonacular.com/recipes/random`;

app.noResultsError = "No results found. Please try another search.";
app.foodInputError = "Please make sure you entered a recipe to search for!";

/*
    AJAX CALLS
*/
app.getMovies = function (query, page, releaseDate) {
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

app.getRecipes = function (query) {
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
app.makeApiCalls = function (
  usersGenreChoice,
  moviePage,
  movieReleaseDate,
  usersFoodChoice
) {
  $.when(
    app.getMovies(usersGenreChoice, moviePage, movieReleaseDate),
    app.getRecipes(usersFoodChoice)
  )
    .then(function (movieChoices, recipeChoices) {
      if (
        movieChoices[0].results.length > 0 &&
        recipeChoices[0].recipes.length > 0
      ) {
        $(".loading-screen").hide();
        $("h3").show();
        $("#results").show();
        $("footer").show();
        $("#accessibility-results-heading").show();
        app.readSrText("");

        $("html, body").animate(
          {
            scrollTop: $("#results").offset().top
          },
          500
        );

        // prep results for printing to page
        app.prepMovieResults(movieChoices[0].results);
        app.prepRecipeResults(recipeChoices[0].recipes);
      } else {
        $(".loading-screen").hide();
        $("#results").hide();
        $("footer").hide();
        app.showErrorModal(app.noResultsError);
      }

      $("#food-search").val(""); // reset inputs
      $("#genre-search").val(28);
    })
    .fail(function (error) {
      $(".loading-screen").hide();
      $("#results").hide();
      $("footer").hide();
      app.showErrorModal(app.noResultsError);
    });
};

// getting the current date so the movie API won't return unreleased movies
app.setMovieReleaseDate = function () {
  const today = new Date();
  const year = today.getFullYear();
  let month = today.getMonth() + 1;
  if (month.toString().length === 1) {
    month = `0${month}`;
  }
  let day = today.getDate() + 1;
  if (day.toString().length === 1) {
    day = `0${day}`;
  }
  app.movieReleaseDate = `${year}-${month}-${day}`;
};

// method to get "ready in x min" info & convert to a readable format
app.getRecipeReadyTime = function (recipeTimeData) {
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
app.getDishType = function (dishTypes) {
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
app.getWinePairings = function (wineList) {
  const winePairingList = wineList;
  let wineString = `<p>Wine Pairing(s): `;
  if (winePairingList === undefined || winePairingList.length === 0) {
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

app.getMoviePosterHtml = function (movie) {
  let html = `
    <img src="${app.movieImgUrl}${movie.poster_path}" alt="">
  `;
  if (!movie.poster_path) {
    html = `
      <img src="./assets/film-solid.svg" class="placeholder-img" alt="">  
    `;
  }
  return html;
};

app.getRecipeImgHtml = function (recipe) {
  let html = `
    <img src="${recipe.image}" alt="">
  `;
  if (!recipe.image) {
    html = `
      <img src="./assets/utensils-solid.svg" class="placeholder-img" alt="">  
    `;
  }
  return html;
};

// Shuffle the movie results using Fisher-Yates algorithm for more randomization
app.shuffleMovieResults = function (movieResults) {
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
app.prepMovieResults = function (movieResults) {
  $(".movie-results").empty();
  const shuffledMovies = app.shuffleMovieResults(movieResults);
  for (let i = 0; i < 4; i++) {
    const movie = shuffledMovies[i];
    const movieYear = movie.release_date.slice(0, 4);

    // making the movie blurbs a bit shorter so they don't stretch the page
    const movieBlurb = movie.overview.slice(0, 241);
    const moviePosterHtml = app.getMoviePosterHtml(movie);

    app.printMoviesToPage(movie, movieYear, movieBlurb, moviePosterHtml);
  } // end of for loop - movies
};

// method for prepping recipe results for displaying them on the page
app.prepRecipeResults = function (recipeResults) {
  $(".recipe-results").empty();
  for (let i = 0; i < 4; i++) {
    const recipe = recipeResults[i];
    const readyTime = app.getRecipeReadyTime(recipe.readyInMinutes);

    // get dish types & wine pairings for each recipe, if available
    const dishTypeHtml = app.getDishType(recipe.dishTypes);
    let wineHtml = "";
    if (recipe.winePairing !== undefined) {
      wineHtml = app.getWinePairings(recipe.winePairing.pairedWines);
    }
    const recipeImgHtml = app.getRecipeImgHtml(recipe);

    app.printRecipesToPage(
      recipe,
      readyTime,
      dishTypeHtml,
      wineHtml,
      recipeImgHtml
    );
  } // end of for loop - recipes
};

app.checkFormInputs = function (usersFoodChoice, usersGenreChoice) {
  // check for blank inputs
  const inputChecker = RegExp(/\w/);
  if (!inputChecker.test(usersFoodChoice)) {
    app.showErrorModal(app.foodInputError);
  } else {
    $("h3").hide();
    $("#results").hide();
    $("footer").hide();
    $(".movie-results").empty();
    $(".recipe-results").empty();
    $(".loading-screen").show();

    // use Math.random() to add some randomization to the movie results
    const moviePage = Math.ceil(Math.random() * 100);
    app.setMovieReleaseDate();

    app.getMovies(usersGenreChoice, moviePage, app.movieReleaseDate);
    app.readSrText("Loading your results");

    // make API calls & then print results
    app.makeApiCalls(
      usersGenreChoice,
      moviePage,
      app.movieReleaseDate,
      usersFoodChoice
    );
  }
};

app.showErrorModal = function (message) {
  $(".error-modal").show();
  $(".error-message").text(message);
  $(".error-modal")[0].focus();
};

// method to print movies to page
app.printMoviesToPage = function (movie, year, blurb, imgHtml) {
  const movieHtml = `
      <li class="movie-card flex-container" data-aos="fade-up" data-aos-duration="500">
          <div class="movie-img">
              ${imgHtml}
          </div>
          <div class="card-text">
              <h4 class="card-title">${movie.title} <span class="movie-year">(${year})</span></h4>
              <p>${blurb}... <a href="${app.movieInfoUrl}${movie.id}" target="_blank"
          rel="noopener noreferrer">Read more</a></p>
          </div>
      </li>
    `;
  $(".movie-results").append(movieHtml);
};

// method to print recipes to page
app.printRecipesToPage = function (
  recipe,
  readyTime,
  dishTypes,
  wines,
  imgHtml
) {
  const recipeHtml = `
      <li class="recipe-card flex-container" data-aos="fade-up" data-aos-duration="500">
          <div class="recipe-img">
            ${imgHtml}
          </div>
          <div class="card-text">
            <h4 class="card-title">${recipe.title}</h4>
            <p>Ready in ${readyTime}</p>
            <p>${recipe.analyzedInstructions[0].steps.length} steps, ${recipe.extendedIngredients.length} ingredients</p>
            ${dishTypes}
            ${wines}
            <p><a href="${recipe.sourceUrl}" target="_blank"
        rel="noopener noreferrer">Go to recipe</a></p>
          </div>
      </li>
    `;
  $(".recipe-results").append(recipeHtml);
};

// icon change
app.showUtensilsIcon = function () {
  $(".icon").removeClass("fa-heart");
  $(".icon").addClass("fa-utensils");
};

app.showMoviesIcon = function () {
  $(".icon").removeClass("fa-heart");
  $(".icon").addClass("fa-film");
};

app.showHeartIcon = function (currentIcon) {
  $(".icon").removeClass(currentIcon);
  $(".icon").addClass("fa-heart");
};

// close error modal & return focus
app.closeErrorModal = function () {
  $(".error-modal").hide();
  $("#food-search")[0].focus();
};

// accessibility - read text for screenreaders
app.readSrText = function (text) {
  $("#accessibility-read-text").text(""); //clear existing text
  setTimeout(function () {
    $("#accessibility-read-text").text(text);
  }, 50);
};

app.init = function () {
  /*
        METHODS THAT NEED TO INITIALIZE
    */
  $("h3").hide();
  $("#results").hide();
  $("footer").hide();
  $(".loading-screen").hide();
  $(".error-modal").hide();
  $("#accessibility-results-heading").hide();

  /*
        EVENT HANDLERS
    */
  // submit a search
  $("form").on("submit", function (e) {
    e.preventDefault();

    // get user's choices
    app.usersFoodChoice = $("#food-search").val().toLowerCase();
    app.usersGenreChoice = parseInt($("#genre-search").val());

    // make sure the user has made choices & didn't leave a blank input
    app.checkFormInputs(app.usersFoodChoice, app.usersGenreChoice);
  }); // end of form submit event handler

  // changing the heart icon to utensils on hover/focus when searching recipes
  $(".food-search-container").hover(app.showUtensilsIcon, function () {
    app.showHeartIcon("fa-utensils");
  });

  $("#food-search")
    .focusin(app.showUtensilsIcon)
    .focusout(function () {
      app.showHeartIcon("fa-utensils");
    });

  // changing the heart icon to film on hover/focus when searching movies
  $(".genre-search-container").hover(app.showMoviesIcon, function () {
    app.showHeartIcon("fa-film");
  });

  $("#genre-search")
    .focusin(app.showMoviesIcon)
    .focusout(function () {
      app.showHeartIcon("fa-film");
    });

  // smooth scrolling up to search again
  $(".search-again-button").on("click", function () {
    $("html, body").animate(
      {
        scrollTop: $("#landing").offset().top
      },
      1000
    );
    $("#food-search")[0].focus();
  });

  // close error modal
  $(".error-modal-button, .error-modal-close").on("click", app.closeErrorModal);

  $(".error-modal").on("click", function (e) {
    if (e.target === $(".error-modal")[0]) {
      app.closeErrorModal();
    }
  });
}; // end of app.init()

$(function () {
  AOS.init(); // animate on scroll
  app.init();
});
