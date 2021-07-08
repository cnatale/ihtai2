const puppeteer = require('puppeteer');
const _ = require('lodash');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
console.log('starting end to end test with the following arguments:');
console.log(argv);

let count = 0;
const numberOfTestsToRun = 1200;

// build filename
let fileName = './data/';
console.log(argv);
_.forEach(argv, (value, key) => {
  if (key !== '_') {
    fileName = `${fileName}_${key}_${value}`;
  }
});
fileName = fileName + '.csv';
console.log(`Output filename: ${fileName}`);

async function waitLoop(page) {
  let avgScore, pctTimeInTargetArea;

  const statusBoxContent  = await page.evaluate(() => document.querySelector('#statusBox').innerHTML);
  // const ballx = await page.evaluate(() => sphere.position.x);
  // const bally = await page.evaluate(() => sphere.position.y);
  // const ballz = await page.evaluate(() => sphere.position.z);
  // console.log(`x: ${ballx} y: ${bally} z: ${ballz}`)

  if (statusBoxContent === 'Test Complete') {
    avgScore = await page.evaluate(() => document.querySelector('#avgScore').innerText);
    pctTimeInTargetArea = await page.evaluate(() => document.querySelector('#pctTimeInTargetArea').innerText);

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
    output = output + `${avgScore},${pctTimeInTargetArea}\n`;

    fs.appendFile(fileName, output, function(err) {
      if (err) {
        console.log(err);
      }

      console.log(`test ${count} complete`);
      count++;
      page.reload();
    });
  }

  if (count < numberOfTestsToRun) {
    setTimeout(() => {
      waitLoop(page);
    }, 1500);
  } else {
    console.log('*** all tests complete! ***')
  }
}

(async () => {
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    // headless: true,
  const browser = await puppeteer.launch({
    args: [
        '--window-size=640,480'
    ]
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36');
  // await page.setViewport({ width: 640, height: 480 })

  await page.goto('http://localhost:3900/balldemo_multistep.html');

  setTimeout(() => {
    waitLoop(page);
  }, 1500);
})();
