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
    var mapi_sdk = new Meta_API("dev", "http://localhost:8080/api");

    let metaParams = [];

    if (params.location) {
      metaParams = [{
        name: "location",
        value: params.location
      }];
    } else if (params.address) {
      metaParams = [{
        name: "address",
        value: params.address
      }];
    } else {
      throw new Error("Address or location not set");
    }

    mapi_sdk.import([
      {
        "id": 1,
        "type": "Cinema",
        "api_full_path": "http://apigator.net:8585/",
        "params": metaParams
    }
    ]);

    mapi_sdk.launch(function (error, mapi_result) {

      if (error) throw error;

      // console.log(JSON.stringify(mapi_result.results));

      let myResults = [];

      //Rassemblement des cinémas et des films

      //TODO : création d'une carte par cinéma + liste de films associés : besoin de gérer un tableau lié à une propriété
      mapi_result.results[0].Cinema.map(cinema => {
        const newCine = {
          name: cinema.name,
          address: cinema.address
        }

        const moviesOfCine = mapi_result.results[0].Movie.filter(movie => {
          if (movie.parents.find(parent => {return parent.id === cinema.id})) {
            return movie;
          } else {
            return null;
          }
        });
        if (moviesOfCine) {
          newCine.movies = moviesOfCine.map(movie => {
            return {
              title: movie.title,
              showtimes: movie.showtimes
            }
          });
        }

        myResults.push(newCine);
      });


        //Setting HTML Render
        var final = {};
        final.results = myResults;
        final.html_render = {
          title: "Cinéma",
          description: `Cinéma et séances de films`,
          cards: []
        };

        myResults.forEach(function (result) {

          var card = {
            title: result.name,
            title_chip: `🎞️ ${result.movies.length} films`,
            title_chip2: `🎟️ ${result.movies.reduce((acc, movie) => acc + movie.showtimes.length, 0)} séances`,
            text: `Films disponibles : ${result.movies.map(movie => movie.title).join(', ')}`,
            text2: result.address,
            source: result.source,
            // link: {
            //   target: "http://maps.google.com/?q=" + result.name + ", " + result.address,
            //   text: "Google Maps"
            // }
          }
          final.html_render.cards.push(card);
        }, this);

        //console.log(JSON.stringify(myResults));

        exit(final);
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