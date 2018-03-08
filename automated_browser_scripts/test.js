var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = webdriverio.remote(options);
var fs = require('fs');

let count = 0;
const numberOfTestsToRun = 25;

function waitLoop() {
  let avgScore, pctTimeInTargetArea;

  client.getText('#statusBox').then((value) => {
    if(value === 'Test Complete') {
      Promise.all([client.getText('#avgScore'), client.getText('#pctTimeInTargetArea')]).then((values) => {
        // write data to file
        fs.appendFile('./data/test_results.csv', `${values[0]},${values[1]}\n`, function(err) {
              if (err) {
                console.log(err);
              }

              console.log('The file was saved!');

              console.log(`test ${count} complete`);
              count++;
              client.refresh();
            });
      });
    }
  });


  if (count < numberOfTestsToRun) {
    setTimeout(waitLoop, 1500);
  } else {
    console.log('*** all tests complete! ***')
    // client.end();
  }
}

client
  .init()
  .url('http://localhost:3800/balldemo.html')
  .then(() => {
    setTimeout(waitLoop, 1500);
  })
