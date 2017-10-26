const express = require('express');
const app = express();
var mapi_sdk = require('meta-api-sdk');

app.get('/', function (req, res) {

  mapi_sdk.config('prod'); //You'll be able to change the URL of Meta API SDK if you want to use a proxy

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

    mapi_sdk.import([
      {
        "id": 0,
        "type": "Geo",
        "params": [
          {
            "name": "address",
            "value": params.address_departure
          }
        ]
      },
      {
        "id": 1,
        "type": "Geo",
        "params": [
          {
            "name": "address",
            "value": params.address_arrival
          }
        ]
      },
      {
        "id": 2,
        "type": "Transport",

        "params": [
          {
            "name": "start_latitude",
            "connect_to": 0
          },
          {
            "name": "start_longitude",
            "connect_to": 0
          },
          {
            "name": "end_latitude",
            "connect_to": 1
          },
          {
            "name": "end_longitude",
            "connect_to": 1
          }
        ]
      }
    ]);

    mapi_sdk.launch(function (error, result) {

      if (error) throw error;

      console.log(JSON.stringify(result.results));

      let myResults = [];

      //Creating new object
      result.results.forEach(function (result) {
        if (result.Transport != null) {
          let transports = result.Transport
          transports.forEach(function (transport) {
            if (transport.fare != null && transport.name != null) {
              let regexPrice = /(\d{1,2})-(\d{1,2})/g
              let match = regexPrice.exec(transport.fare);
              if (match != null) {
                let price1 = parseInt(match[1]);
                let price2 = parseInt(match[2]);
                let average_price = (price1 + price2) / 2;
                if (average_price != null && average_price < 20) {
                  myResults.push({
                    price: average_price,
                    name: transport.name
                  })
                }
              }
            }
          }, this);
        }
      }, this);

      //Sorting prices
      myResults.sort((a, b) => {
        if (a.price < b.price) return -1
        else return 1
      })

      exit(myResults);
    })

    
    /**
     * Your code end here 😃
     */
    // ##########################################################################
  }

  //Simulating results
  simulatedEnv(function (result) {
    res.json({original_params: params, result: result});
  });

})

app.listen(4000, function () {
  console.log('Meta API - Spells Playground listening on port 4000!')
  console.log('Please open : http://localhost:4000')
  console.log("Don't forget to add some parameters to the URL if you're using it ;)")
});