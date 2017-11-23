const express = require('express');
const app = express();
var Meta_API = require('meta-api-sdk');

app.get('/', function (req, res) {

  var params = req.query; //Query parameters will be accessible through "params" inside the simulated environment

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
    var mapi = new Meta_API();

    var radius = "500";
    if (params.radius != null) {
      radius = params.radius;
    }

    mapi.import([
      {
        "id": 1,
        "type": "Geo",
        "api_full_path": "https://maps.googleapis.com/maps/api/geocode/json",
        "params": [
          {
            "name": "address",
            "value": params.address_search
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
      },
      {
        "id": 4,
        "type": "Geo",
        "api_full_path": "https://maps.googleapis.com/maps/api/geocode/json",
        "params": [
          {
            "name": "address",
            "value": params.address_departure
          }
        ]
      },
      {
        "id": 5,
        "type": "Transport",

        "params": [
          {
            "name": "start_latitude",
            "connect_to": 4
          },
          {
            "name": "start_longitude",
            "connect_to": 4
          },
          {
            "name": "end_latitude",
            "connect_to": 2
          },
          {
            "name": "end_longitude",
            "connect_to": 2
          }
        ]
      }
    ]);

    mapi.launch(function (error, mapi_result) {

      if (error) throw error;

      // console.log(JSON.stringify(mapi_result.results));

      let myResults = [];

      //Creating new object

      mapi.getAllResults()["3"].Place.forEach(function (place) {
        if (place.rating >= 3.8) {
          delete place.photos;
          delete place.reviews;
          myResults.push(place);
        }
      }, this);

      //Sorting by rating
      myResults.sort((a, b) => {
        if (a.rating > b.rating) return -1
        else return 1
      })

      //Using Meta API package to find related Uber
      myResults.forEach(place => {
        //Getting parent place (corresponding to ID 2)
        let placeParents = mapi.getParents(place.id);
        if (placeParents.Place[0] != null) {
          //Getting all children generated from this place
          let children = mapi.getChildren(placeParents.Place[0].id);
          if (children != null) {
            //We take all the children which has as type "Uber"
            let relatedUbers = children.Transport;
            let minPrice = null;
            let maxPrice = null;
            relatedUbers.forEach(transport => {
              if (transport.fare != null && transport.name != null) {
                //Clean price
                let regexPrice = /(\d{1,2})-(\d{1,2})/g
                let match = regexPrice.exec(transport.fare);
                //Calculate average price
                if (match != null) {
                  let price1 = parseInt(match[1]);
                  let price2 = parseInt(match[2]);
                  let average_price = (price1 + price2) / 2;
                  if (average_price != null) {
                    if (minPrice == null || average_price < minPrice) minPrice = average_price;
                    if (maxPrice == null || average_price > maxPrice) maxPrice = average_price;
                  }
                }
              }
            });
            place.uber_min_price = minPrice;
            place.uber_max_price = maxPrice;
          }
        }
      });

      //Setting HTML Render
      var final = {};
      final.results = myResults;
      final.html_render = {
        title: "Les meilleurs resto",
        description: `Sélection des meilleurs resto autour de ${params.address}`,
        cards: []
      };

      myResults.forEach(function (result) {
        var card = {
          title: result.name,
          title_chip: result.rating + "⭐",
          title_chip2: `🚘 ${result.uber_min_price}€ - ${result.uber_max_price}€`,
          text: result.address,
          text2: result.phone_number,
          source: "Google Maps",
          link: {
            target: "http://maps.google.com/?q=" + result.name + ", " + result.address,
            text: "Voir sur Google Maps"
          }
        }
        if (result.website !== null) {
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