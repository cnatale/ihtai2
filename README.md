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
