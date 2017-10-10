const express = require('express');
const app = express();
var mapi_sdk = require('meta-api-sdk');

app.get('/', function (req, res) {

  mapi_sdk.config('dev'); //You'll be able to change the URL of Meta API SDK if you want to use a proxy

  var params = req.query; //Query parameters will be accessible through "params";

  //Simulating final execution environment
  var simulatedEnv = function (exit) {

    /**
     * Your code start here #########
     */

    console.log("Params available : ", params);

    mapi_sdk.import([
      {
        "id": 0,
        "type": "Geo",
        "params": [
          {
            "name": "address",
            "value": "1 rue de Rivoli 75001 Paris"
          }
        ]
      },
      {
        "id": 1,
        "type": "Geo",
        "params": [
          {
            "name": "address",
            "value": "156 av des Champs-Elysées 75008 Paris"
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

      if (error) {
        throw err;
      }

      let myResults = [];

      //Creating new object
      result.results.forEach(function (result) {
        if (result.Transport != null) {
          let transports = result.Transport
          transports.forEach(function (transport) {
            console.log(transport)
            if (transport.fare != null && transport.name != null) {
              //Clean price
              let regexPrice = /(\d{1,2})-(\d{1,2})/g
              let match = regexPrice.exec(transport.fare);
              if (match != null) {
                let price1 = parseInt(match[1]);
                let price2 = parseInt(match[2]);
                let average_price = (price1 + price2) / 2;
                if (average_price != null) {
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

      //Using params
      if (params.max_price != null) {
        let newResults = [];
        myResults.forEach(function (result) {
          if (result.price < params.max_price) {
            newResults.push(result);
          }
        }, this);
        myResults = newResults;
      }

      /**
       * This fonction is mandatory to return your reusults
       * First param is error to manage erros and the second is the result
       */
      exit(myResults);

      /**
       * Your code end here #######
       */

    })
  }

  //Simulating results
  simulatedEnv(function (result) {
    res.json(result);
  });

})

app.listen(4000, function () {
  console.log('Meta API - Spells Playground listening on port 4000!')
});