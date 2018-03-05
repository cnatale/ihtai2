var webdriverio = require('webdriverio');
var options = { desiredCapabilities: { browserName: 'chrome' } };
var client = webdriverio.remote(options);

let count = 0;
const numberOfTestsToRun = 60;

function waitLoop() {
  console.log('waitloop called');
  client.getText('#statusBox').then((value) => {
    console.log(value);
    if(value === 'Test Complete'){
      console.log('test complete')
      count++;
      client.refresh();
    }
  })


  if (count < numberOfTestsToRun) {
    setTimeout(waitLoop, 1500);
  }
}

client
  .init()
  //.url('http://www.duckduckgo.com')
  .url('http://localhost:3800/balldemo.html')
  .then(() => {
    setTimeout(waitLoop, 1500);
  })
