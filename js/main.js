import { localeCountry, localeString } from './localeUtils.js';
import { regions } from '../data/regions.js';

let myMap;
let leafletContinentLayer;
let continentGeoJSON;
let selectedContinent;
let overallCountriesToQuery;
let countryNumbersArray;
let correctAnswers = 0;
let timer;
let timePlayed = 0;

//Add the base map without any layers.
addLeafletMap();

//Hide the welcome infobox, if hideWelcomeInfoboxCheckboxSelected equals "true" in local storage
hideWelcomeInfoboxOnStartup();
function hideWelcomeInfoboxOnStartup() {
  let hideWelcomeInfoboxCheckboxSelected = localStorage.getItem("hideWelcomeInfoboxCheckboxSelected");
  // console.log(hideWelcomeInfoboxCheckboxSelected);
  if (hideWelcomeInfoboxCheckboxSelected === "true") {
    hideWelcomeInfobox();
    //Check the checkbox
    let radio = document.querySelector("#dont-show");
    radio.checked = true;
  }
};

//Show request
document.querySelector(".command").innerText = localeString("selectRegion");

//Build the selection infobox
buildSelectionWindow();
function buildSelectionWindow() {
  let regionSelectionHtml = "";
  for (let i = 0; i < regions.length; i++) {
    //heading
    regionSelectionHtml += `
    <div class="continent-selector">
      <div class="continent-heading">${localeString(regions[i][0])}</div>
    `;
    //elements
    for (let j = 0; j < regions[i].length; j++) {
      if (j === 0) {
        regionSelectionHtml += `
        <div class="continent-element" id="${regions[i][j]}">${localeString("all-countries")}</div>
      `;
      } else {
        regionSelectionHtml += `
        <div class="continent-element" id="${regions[i][j]}">
          <img src="./img/flags/${regions[i][j]}.svg" alt="Flag icon" class="thumbnails">
          <span>${localeString(regions[i][j])}</span>
        </div>
      `;
      }
    }
    regionSelectionHtml += `
    </div>
    `;
  }
  document.querySelector(".selection-container").innerHTML = regionSelectionHtml;
}

//Translate text in welcome infobox
translateWelcomeInfobox();
function translateWelcomeInfobox() {
  document.querySelector(".welcome-infobox-intro").innerHTML = localeString("welcomeInfoboxIntro");
  document.querySelector(".highscore-text").innerText = localeString("highscore");
  document.querySelector(".welcome-infobox-help").innerText = localeString("welcomeInfoboxHelp");
  document.querySelector(".github-text").innerText = localeString("githubText");
  document.querySelector(".translate-text").innerText = localeString("translateText");
  document.querySelector(".donate-text").innerText = localeString("donateText");
  document.querySelector("#dont-show-label").textContent = localeString("dontShow");
}

//Add a Leaflet map to the page
function addLeafletMap() {
  const EsriWorldShadedRelief = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri',
    maxZoom: 13,
    minZoom: 2
  });

  myMap = L.map('map', {
    center: [38, 44], //defined by "fitBounds"
    zoom: 4, //defined by "fitBounds"
    zoomControl: false, //hide zoom control buttons
    layers: EsriWorldShadedRelief
  });
}

//Remove continents GeoJSON, dynamically load and show the GeoJSON of the selected continent on the map and move on to newCountry functions
async function startGame() {
  const tempGeoJSON = await import('../data/' + selectedContinent + '.js');
  continentGeoJSON = tempGeoJSON.geoJSON;
  // console.log(continentGeoJSON);

  overallCountriesToQuery = continentGeoJSON.features.length;

  //Define an array with exactly the same length as the amount of countries to query, e.g. [0, 1, 2, 3]
  countryNumbersArray = Array.from({ length: overallCountriesToQuery }, (v, i) => i);

  removeAllGeoJSON(); //Remove all GeoJSON layers before loading the continent
  showSingleContinentGeoJson(continentGeoJSON); //Load the geojson
  startCountdownAnimation()//Show 3-2-1 countdown before game starts. Afterwards start the game.
}

//Remove all GeoJSON layers before loading the continent
function removeAllGeoJSON() {
  myMap.eachLayer(function (layer) {
    if (!!layer.toGeoJSON) { //Can the layer be converted into a valid GeoJSON? Will be true for all but the tile layer.
      myMap.removeLayer(layer);
    }
  });
}

//Show 3-2-1 countdown before game starts. Afterwards start the game.
function startCountdownAnimation() {
  let elements = document.querySelectorAll(".countdown");
  for (var i = 0; i < elements.length; i++) {
    elements[i].classList.add('start-animation');
  }

  //Blur the background during countdown timer animation
  let elementsToBlur = document.querySelectorAll(".to-blur");
  for (var i = 0; i < elementsToBlur.length; i++) {
    elementsToBlur[i].classList.add('blur');
  }

  //After 4s start the game timer and query the first country
  //Remove animation class again after 4s, so that startCountdownAnimation() can be called again
  setTimeout(function () {
    startStopTimer("start"); //Start timer
    newCountry(); //Query the first country
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.remove('start-animation');
    }
    //Unblur the background after countdown timer animation
    let elementsToBlur = document.querySelectorAll(".to-blur");
    for (var i = 0; i < elementsToBlur.length; i++) {
      elementsToBlur[i].classList.remove('blur');
    }
  }, 3500)
}

//Show GeoJSON polygons of a single continent on the Leaflet map
function showSingleContinentGeoJson(inputGeoJson) {
  leafletContinentLayer = L.geoJSON(inputGeoJson, {
    onEachFeature: onEachFeature,
    style: style
  })

  leafletContinentLayer.addTo(myMap);

  //Center and zoom the map on the provided GeoJSON
  myMap.fitBounds(leafletContinentLayer.getBounds());

  //Apply standard colors to the polygons
  //(each object or "feature" is computed by this function)
  function style() {
    return { "fillColor": undefined, "opacity": 1, "fillOpacity": 0.7, "color": "#555555", "weight": 2 };
  }

  //What happens when clicking or hovering over each polygon
  function onEachFeature(feature, layer) {
    // console.log(feature);
    // console.log(layer);

    //Change opacity to 0.9 when polygon gets focus
    layer.on('mouseover', function (e) {
      layer.setStyle({ fillOpacity: 0.9 });
    });

    //Change opacity back to 0.7 when polygon loses focus
    layer.on('mouseout', function (e) {
      layer.setStyle({ fillOpacity: 0.7 });
    });

    //bind click
    // layer.on('click', function (e) {
    //   // console.log(e);
    //   console.log(feature.properties.name);
    // });
  }
}

//Randomly select a new country from the array. Then remove it from array so that it won't be queried again.
//Do some stuff once the last country has been queried
function newCountry() {
  if (countryNumbersArray.length) {
    let rndNumber = Math.floor(Math.random() * (countryNumbersArray.length - 1));
    // console.log(rndNumber);
    check(countryNumbersArray[rndNumber]);
    //Remove country from array so that it is not queried again
    // console.log(countryNumbersArray);
    countryNumbersArray.splice(rndNumber, 1);
    let currentGameCounter = overallCountriesToQuery - countryNumbersArray.length;
    // console.log(currentGameCounter + "/" + overallCountriesToQuery);
    document.querySelector(".progress").innerText = currentGameCounter + "/" + overallCountriesToQuery;
  } else {
    // console.log("Game finished!");
    startStopTimer("stop");
    // console.log("Correct answers: " + correctAnswers + " out of " + overallCountriesToQuery);
    document.querySelector(".command").innerText = localeString("gameOver");
    let position = updateHighscore();
    displayEndOfGameInfobox(position);
  }
}

//Check if player selected the correct country
function check(index) {
  const requestedCountryISO = continentGeoJSON.features[index].properties.iso_a3;
  // console.log(requestedCountryISO);

  document.querySelector(".command").innerHTML = `${localeString("select")} ${localeCountry(requestedCountryISO)}`;

  let selectedCountry;

  leafletContinentLayer.on('click', function (e) {
    let layer = e.layer;
    // console.log(e);
    if (layer.wasClicked) return;

    selectedCountry = e.layer.feature.properties.iso_a3;
    // console.log(selectedCountry);
    leafletContinentLayer.off('click');//Stop listening for click events after first click
    hideCommandModal();//Hide country-select-command modal
    if (selectedCountry === requestedCountryISO) {
      correctAnswers++;
      openResultModal("success", localeString("correct"));
      colorQueriedCountryAndAddTooltip(requestedCountryISO, "green");
    }
    else {
      openResultModal("alarm", localeString("wrong"));
      colorQueriedCountryAndAddTooltip(requestedCountryISO, "red");
    }
    setTimeout(newCountry, 1800);//await animation before starting the next country
  });

  //Show result modal
  function openResultModal(type, text) {
    const result = document.querySelector(".result");
    result.classList.remove("show", "alarm", "success");
    void result.offsetWidth; //Found here: https://css-tricks.com/restart-css-animation/#update-another-javascript-method-to-restart-a-css-animation
    result.innerHTML = text;
    result.classList.add("show", type);
  }

  //Hide command modal
  function hideCommandModal() {
    const command = document.querySelector(".command-container");
    command.classList.remove("hide-command");
    void command.offsetWidth; //Found here: https://css-tricks.com/restart-css-animation/#update-another-javascript-method-to-restart-a-css-animation
    command.classList.add("hide-command");
  }

  //Colour the polygon of the country just queried either green (correctly selected) or red (incorrectly selected).
  //Furthermore add a tooltip in order to see the country name when hovering over it.
  function colorQueriedCountryAndAddTooltip(requestedCountryISO, color) {
    //For each layer (i.e. polygon) the code below is executed.
    leafletContinentLayer.eachLayer(function (layer) {
      if (layer.feature.properties.iso_a3 === requestedCountryISO) {
        layer.setStyle({ fillColor: color });
        layer._path.classList.add("not-allowed-cursor");
        layer.wasClicked = true;

        //Add country name no queried country as a tooltip
        const tooltipContent = localeCountry(requestedCountryISO);
        layer.bindTooltip(tooltipContent);
      }
    });
  }
}

//Start/end timer
function startStopTimer(command) {
  if (command === "start") {
    timer = setInterval(function () {
      timePlayed++;
      document.querySelector(".time-elapsed").innerText = "\u{1F557}" + timePlayed + "s";
    }, 1000);
  } else {
    clearInterval(timer);
    // console.log("Time needed: " + timePlayed + "s");
  }
}

//Display end-of-game infobox
function displayEndOfGameInfobox(position) {
  document.querySelector(".end-of-game-infobox").classList.add("show");
  document.querySelector(".end-of-game-infobox-heading").innerText = localeString("resultHeading");
  if (!position) document.querySelector(".end-of-game-infobox-result").innerHTML = `${localeString("correctPicks", { correctAnswers, overallCountriesToQuery })} (${Math.round(correctAnswers / overallCountriesToQuery * 100)}%)<br>${localeString("notGoodEnough")}`;
  else document.querySelector(".end-of-game-infobox-result").innerText = localeString("veryGood", { position });
  let tableHtml = `
    <thead>
      <tr>
      <th colspan="3">${localeString("highscore")} - ${localeString(selectedContinent)}</th>
      </tr>
      <tr>
        <th><h1>${localeString("position")}</h1></th>
        <th><h1>${localeString("correctAnswers")}</h1></th>
        <th><h1>${localeString("timeNeeded")}</h1></th>
      </tr>
    </thead>
    <tbody>
  `;
  const retrievedHighscoreFromLocalStorage = JSON.parse(localStorage.getItem(selectedContinent));
  for (let i = 0; i < retrievedHighscoreFromLocalStorage.length; i++) {
    const timePlayed = retrievedHighscoreFromLocalStorage[i].timePlayed;
    const successRate = retrievedHighscoreFromLocalStorage[i].successRate;
    tableHtml += i === position - 1 ? `<tr id="last-game">` : `<tr>`;//define class to color row red or green
    tableHtml += `<td>${i + 1}</td>`;
    tableHtml += `<td>${Math.round(successRate * 100)}%</td>`;
    tableHtml += `<td>${timePlayed < 60 ? `${timePlayed}${localeString("secondsAbbr")}` : `${Math.floor(timePlayed / 60)}${localeString("minutesAbbr")} ${timePlayed % 60}${localeString("secondsAbbr")}`}</td>`;
    tableHtml += `</tr>`;
  }
  tableHtml += `
    </tbody>
  `;
  document.querySelector(".end-of-game-infobox-highscore").innerHTML = tableHtml;
  document.querySelector(".play-again-button").innerText = localeString("playAgainButton");
}

//Start a new game when clicking on "Play again"
document.querySelector(".play-again-button").addEventListener("click", function () {
  document.querySelector(".end-of-game-infobox").classList.remove("show"); //Hide end of game infobox
  document.querySelector(".selection-container").classList.remove("hide"); //Show game selection
  document.querySelector(".command").innerText = localeString("selectRegion"); //Show request in command infobox on top
  removeAllGeoJSON(); //Remove all GeoJSON layers before reloading the continents GeoJSON
  //Reset some global variables and update display
  correctAnswers = 0;
  timePlayed = 0;
  document.querySelector(".progress").innerText = "";
  document.querySelector(".time-elapsed").innerText = "";
});

//Update/create highscore array and save to localstorage
function updateHighscore() {
  const successRate = successRateCalc();
  let newEntry = { successRate, timePlayed };
  // console.log(newEntry);

  // Try to retrieve from LS
  const retrievedHighscoreFromLocalStorage = localStorage.getItem(selectedContinent);
  //Entry in localstorage found
  if (retrievedHighscoreFromLocalStorage !== null) {
    //  take the highscore, update, save back to localstorage
    let continentHighscoreFromLocalStorage = JSON.parse(retrievedHighscoreFromLocalStorage);

    for (let i = 0; i < continentHighscoreFromLocalStorage.length; i++) {
      //is the success rate higher OR is the success rate similar + the time lower than this entry in array?
      if (newEntry.successRate > continentHighscoreFromLocalStorage[i].successRate ||
        (newEntry.successRate === continentHighscoreFromLocalStorage[i].successRate && newEntry.timePlayed < continentHighscoreFromLocalStorage[i].timePlayed)) {
        continentHighscoreFromLocalStorage.splice(i, 0, newEntry); //if yes: insert before this entry
        continentHighscoreFromLocalStorage.pop(); //remove last entry so that we have a highscore with 5 entries again
        localStorage.setItem(selectedContinent, JSON.stringify(continentHighscoreFromLocalStorage));
        // console.log("Highscore for " + selectedContinent + " in localstorage updated");
        return i + 1; //Return position in highscore
      }
    }

    //No entry in localstorage found
  } else {
    //  No highscore yet. Take the empty one from below with the first entry being newEntry
    // console.log("No highscore yet. Take the empty one from below with the first entry being newEntry");
    let continentHighscore = [
      newEntry,
      { successRate: 0.00, timePlayed: 0 },
      { successRate: 0.00, timePlayed: 0 },
      { successRate: 0.00, timePlayed: 0 },
      { successRate: 0.00, timePlayed: 0 }
    ];
    //Save to local storage
    localStorage.setItem(selectedContinent, JSON.stringify(continentHighscore));
    return 1; //Return position in highscore
  }

  //New entry not good enough for highscore. No changes to highscore in localstorage.
  // console.log("New entry not good enough for highscore. No changes to highscore in localstorage.");
  return false;
}

//Return success rate
function successRateCalc() {
  return correctAnswers / overallCountriesToQuery;
}

//Hide welcome infobox
function hideWelcomeInfobox() {
  // console.log("Hide fired");
  document.querySelector(".welcome-infobox").classList.add("hide-welcome");
  document.querySelector(".arrow-image").classList.add("mirror-image");
}

//Toggle display of welcome infobox when user clicks on side button
document.querySelector(".expand-button").addEventListener("click", function () {
  // console.log("Toggle fired");
  document.querySelector(".welcome-infobox").classList.toggle("hide-welcome");
  document.querySelector(".arrow-image").classList.toggle("mirror-image");
});

//Hide welcome infobox when user clicks outside of infobox
document.querySelector("#map").addEventListener("mousedown", hideWelcomeInfobox);
document.querySelector(".selection-container").addEventListener("mousedown", hideWelcomeInfobox);

//Write status of "Don't show welcome infobox" checkbox to local storage
document.querySelector("#dont-show").addEventListener("click", function () {
  let radio = document.querySelector("#dont-show");
  // console.log(radio.checked);
  localStorage.setItem("hideWelcomeInfoboxCheckboxSelected", radio.checked);
});

//Write selected region (continent/country) to variable and start the game
document.querySelectorAll(".continent-element").forEach(function (elem) {
  elem.addEventListener("click", function (e) {
    // console.log(e.target.id);
    document.querySelector(".selection-container").classList.add("hide");
    selectedContinent = e.target.id;
    startGame();
  });
});

//Close welcome infobox on right swipe (mobile)
let start = null;
const welcomeInfobox = document.querySelector(".welcome-infobox");
welcomeInfobox.addEventListener("touchstart",function(event){
  if(event.touches.length === 1){
     //just one finger touched
     start = event.touches.item(0).clientX;
   }else{
     //a second finger hit the screen, abort the touch
     start = null;
   }
 });

 welcomeInfobox.addEventListener("touchend",function(event){
  let offset = 100;//at least 100px are a swipe
  if(start){
    //the only finger that hit the screen left it
    let end = event.changedTouches.item(0).clientX;

    if(end > start + offset){
     //a left -> right swipe
     hideWelcomeInfobox();
    }
    if(end < start - offset ){
     //a right -> left swipe
    }
  }
});