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

    const transportModes = [
      {
        key: "walking",
        label: "à pied"
      },
      {
        key: "driving",
        label: "en voiture"
      },
      {
        key: "bicycling",
        label: "à vélo"
      },
      {
        key: "transit",
        label: "en transport en commun"
      }
    ]

    let transportMode = transportModes[3];

    if (params.transport_mode) {
      const findTransport = transportModes.find((transport) => {return transport.key == params.transport_mode});
      if (findTransport) {
        transportMode = findTransport;
      } else {
        throw new Error(`This transport mode : ${params.transport_mode} in not in available transport modes : ${transportModes.map(transport => {return transport.key}).join(', ')}`);
      }
    }

    mapi_sdk.import([
      {
        "id": 1,
        "type": "Transport",
        "api_full_path": "https://maps.googleapis.com/maps/api/directions/json",
        "params": [
            {
                "name": "origin",
                "value": params.origin
            },
            {
                "name": "destination",
                "value": params.destination
            },
            {
                "name": "mode",
                "value": transportMode.key
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

      // console.log(JSON.stringify(mapi_result.results));

      let myResults = [];

      if (mapi_result.results[0] && mapi_result.results[0].Transport && mapi_result.results[0].Transport[0]) {
        const transports = mapi_result.results[0].Transport;
        myResults = transports;
      }


        //Setting HTML Render
        var final = {};
        final.results = myResults;
        final.html_render = {
          title: "Transport",
          description: `Transport de ${params.origin} à ${params.destination} ${transportMode.label}`,
          cards: []
        };

        myResults.forEach(function (result) {

          let text2 = `Durée : ${result.duration.duration_human}
          Distance : ${result.distance.distance_human}`;

          let title_chip2 = `📏 ${result.distance.distance_human}`;
          if (result.fare) {
            title_chip2 = `💵 ${result.fare.text}`;
          }

          var card = {
            title: `Transport ${transportMode.label}`,
            title_chip: `⏱️ ${result.duration.duration_human}`,
            title_chip2: title_chip2,
            text: `Transport de ${params.origin} à ${params.destination} ${transportMode.label}`,
            text2: text2,
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