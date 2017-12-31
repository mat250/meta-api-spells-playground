const express = require('express');
const app = express();
var Meta_API = require('meta-api-sdk');
var stringSimilarity = require('string-similarity');

app.get('/', function (req, res) {

  var params = req.query; //Query parameters will be accessible through "params" inside the simulated environment

  var tools = {};
  tools.stringSimilarity = stringSimilarity;

  //Simulating final execution environment
  var simulatedEnv = function (exit) {

    // ##########################################################################
    /**
     * Your code start here 😃
     */

    //Starting with importing a Meta API conf
    //Help could be found here to build the object : 
    //Catalog : https://meta-api.io/catalog/
    //Doc : https://meta-api.io/doc

    //New Meta API object to call Meta API engine
    var mapi_sdk = new Meta_API("dev", "https://api.meta-api.io/api");

    var radius = "500";
    if (params.radius != null) {
      radius = params.radius;
    }

    mapi_sdk.import([
      {
        "id": 1,
        "type": "Geo",
        "api_full_path": "https://maps.googleapis.com/maps/api/geocode/json",
        "params": [
          {
            "name": "address",
            "value": params.address
          }
        ]
      },
      {
        "id": 2,
        "type": "Place",
        "api_full_path": "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
        "params": [
          {
            "name": "location",
            "connect_to": 1
          },
          {
            "name": "type",
            "value": "restaurant"
          },
          {
            "name": "radius",
            "value": radius
          }
        ]
      },
      {
        "id": 3,
        "type": "Place",
        "api_full_path": "https://maps.googleapis.com/maps/api/place/details/json",
        "params": [
          {
            "name": "placeid",
            "connect_to": 2
          },
          {
            "name": "language",
            "value": "fr"
          }
        ]
      }
    ]);



    mapi_sdk.launch(function (error, mapi_result) {

      if (error) throw error;

      console.log(JSON.stringify(mapi_result.results));

      let myResults = [];

      //Search starting from the place for LaFourchette
      var mapi2 = new Meta_API();

      mapi2.import([{
        "id": 0,
        "type": "Restaurant",
        "api_full_path": "http://meta-api.io:8593/",
        "params": [
          {
            "name": "coordinates",
            "value": mapi_result.results[0].Geo[0].latitude + "," + mapi_result.results[0].Geo[0].longitude
          }
        ]
      }])

      mapi2.launch(function (error, mapi_result2) {
        console.log(mapi_result2);

        if (error) throw error;
        //Creating new object
        if (mapi_result.results[2] != null && mapi_result.results[2].Place != null) {
          let places = mapi_result.results[2].Place
          places.forEach(function (place) {
            if (place.rating >= 3.8) {
              delete place.photos;
              delete place.reviews;
              place.source = "Google Maps";
              place.rating = place.rating * 2; //Passage à une note sur 10
              myResults.push(place);
            }
          }, this);
        }

        if (mapi_result2.results[0] != null && mapi_result2.results[0].Restaurant != null) {
          let restos = mapi_result2.results[0].Restaurant
          restos.forEach(function (resto) {
            if (resto.rating >= 7.5) {
              resto.source = "La Fourchette";
              //Find string similarity to combine objects
              let findIndex = myResults.findIndex(aPlace => {
                //Check name similarities
                if (resto.name.indexOf(aPlace.name) != -1 || aPlace.name.indexOf(resto.name) != -1) {
                  return true;
                } else {
                  if (tools.stringSimilarity.compareTwoStrings(aPlace.name, resto.name) >= 0.8) {
                    return true;
                  } else {
                    return false;
                  }
                }
              })
              if (findIndex != -1) {
                resto = Object.assign({}, myResults[findIndex], resto); //Merging objects
                resto.source = "GMaps + LaFourchette";
                myResults[findIndex] = resto;
              } else {
                myResults.push(resto);
              }
            }
          }, this);
        }

        //Sorting by rating
        myResults.sort((a, b) => {
          if (a.rating > b.rating) return -1
          else return 1
        })

        //Setting HTML Render
        var final = {};
        final.results = myResults;
        final.html_render = {
          title: "Les meilleurs resto",
          description: `Sélection des meilleurs resto autour de ${params.address}`,
          cards: []
        };

        myResults.forEach(function (result) {

          let text2 = "";
          if (result.menu_price != null) {
            text2 = "Prix moyen du menu : " + result.menu_price + "€";
            if (result.promotion != null) {
              text2 += " / Promotion : " + result.promotion;
            }
          } else {
            text2 = result.phone_number;
          }

          var card = {
            title: result.name,
            title_chip: "⭐" + result.rating + "/10",
            //title_chip2: "4.5 ",
            text: result.address,
            text2: text2,
            source: result.source,
            link: {
              target: "http://maps.google.com/?q=" + result.name + ", " + result.address,
              text: "Google Maps"
            }
          }
          if (result.link != null) {
            card.link2 = {
              target: result.link,
              text: "LaFourchette"
            }
          }
          if (result.website != null) {
            card.link2 = {
              target: result.website,
              text: "Site web"
            }
          }
          final.html_render.cards.push(card);
        }, this);

        //console.log(JSON.stringify(myResults));

        exit(final);

      })



    })


    /**
     * Your code end here 😃
     */
    // ##########################################################################
  }

  //Simulating results
  simulatedEnv(function (result) {
    res.json({ original_params: params, result: result });
  });

})

app.listen(4000, function () {
  console.log('Meta API - Spells Playground listening on port 4000!')
  console.log('Please open : http://localhost:4000')
  console.log("Don't forget to add some parameters to the URL if you're using it ;)")
});