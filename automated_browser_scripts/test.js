const webdriverio = require('webdriverio');
const _ = require('lodash');
const options = {
  desiredCapabilities: {
    browserName: 'chrome',
    chromeOptions: {
      args: [
        '--disable-background-timer-throttling',
        '--pause-background-tabs',
        '--headless'
      ]
    }
  }
};
const client = webdriverio.remote(options);
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
console.log('starting end to end test with the following arguments:');
console.log(argv);

let count = 0;
const numberOfTestsToRun = 200;

// build filename
let fileName = './data/';
_.forEach(argv, (value, key) => {
  if (key !== '_') {
    fileName = `${fileName}_${key}_${value}`;
  }
});
fileName = fileName + '.csv';

function waitLoop() {
  let avgScore, pctTimeInTargetArea;

  client.getText('#statusBox').then((value) => {
    if (value === 'Test Complete') {
      Promise.all([client.getText('#avgScore'), client.getText('#pctTimeInTargetArea')]).then((values) => {
        // append all env vars as csv's
        let output = '';
        _.forEach(argv, (value, key) => {
          if(key === 'scoreTimesteps') {
            value = `"${value}"`;
          }

          if (key !== '_') {
            output = output + value + ',';
          }
        });
        output = output + `${values[0]},${values[1]}\n`;

        fs.appendFile(fileName, output, function(err) {
          if (err) {
            console.log(err);
          }

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
    let output = '\n\n';
    _.forEach(argv, (value, key) => {
      if (key !== '_') {
        output = output + key + ',';
      }
    });
    output = output + 'Average Score,Percentage Time in Target Area\n';

    // adds column titles for csv rows
    // return new Promise((resolve, reject) => {
    //   fs.appendFile(fileName, output, function(err) {
    //         if (err) {
    //           console.log(err);
    //           return reject();
    //         }

    //         return resolve();
    //       });
    // });

  })
  .then(() => {
    setTimeout(waitLoop, 1500);
  });
