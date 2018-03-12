# ihtai2

## Architecture
pattern-recognition-group
  sliding-window
    time-step
  pattern-recognizer

### pattern-recognition-group
Contains a group of pattern-recognizers, and a sliding-window.

Represents a self-contained Ihtai consciousness unit.

For end users, time steps are added, and next moves gotten, from here.

Capable of dynamically spawning new pattern-recognizers if a specific child pattern-recognizer is 
accessed more times within a given time period than threshold. Also capable of deleting a pattern recognizer
if it is not accessed more than minimum threshold within a given time period.

### sliding-window
Takes new time-steps, and maintains a variable length window of the past n time-steps


### time-step
Objects that contain an actionTakenKey representing the action taken in the described time-step,
and a driveScore, containing the drive score for said time-step.


### pattern-recognizer
Controls saving and retrieving next move data from database for a particular pattern. 

## Automated Testing
The project uses the [Webdriver.io](http://webdriver.io/) with [Selenium Standalone](https://github.com/vvo/selenium-standalone) for automated browser testing of agents.
To run locally, first enter:
`node_modules/.bin/selenium-standalone install` then
`node_modules/.bin/selenium-standalone start` to start Selenium.

Access webdriver.io through node_modules/.bin as well. Ex:
`./node_modules/.bin/wdio --help`

Selenium standalone must be running before Webdriver can access it.

You'll also need to setup your browser to interface with Webdriver. See instructions [here](http://webdriver.io/guide/getstarted/install.html#Setup-Chrome).

### Automated trial example
`npm run start-and-trial -- --slidingWindowSize=400 --maxPatterns=2000 --rubberBandingTargetScore=10 --rubberBandingDecay=0.05 --originalScoreWeight=9 --scoreTimesteps=30,60,90,120,150,180,210,240,270,300`

Trial data will be output to a file in the `/data` directory.
Alternately, you can run each process in its own bash terminal. This is currently a more stable approach.

run:
`node server/main.js --slidingWindowSize=301 --maxPatterns=1000 --rubberBandingTargetScore=5 --rubberBandingDecay=0.1 --originalScoreWeight=8 --scoreTimesteps=3030,60,90,120,150,180,210,240,270,300`

then in another window run:

`node ./node ./automated_browser_scripts/test.js --slidingWindowSize=301 --maxPatterns=1000 --rubberBandingTargetScore=5 --rubberBandingDecay=0.1 --originalScoreWeight=8 --scoreTimesteps=30,60,90,120,150,180,210,240,270,300`

Also note that for each Ihtai instance with distinct params needs its own db. I'll automate this process soon, but for now you need to manually drop than recreate the `ihtaidb` db in mysql.
