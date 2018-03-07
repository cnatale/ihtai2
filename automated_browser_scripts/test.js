var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = webdriverio.remote(options);

let count = 0;
const numberOfTestsToRun = 100;

function waitLoop() {
  client.getText('#statusBox').then((value) => {
    if(value === 'Test Complete'){
      console.log(`test ${count} complete`)
      count++;
      client.refresh();
    }
  })


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
