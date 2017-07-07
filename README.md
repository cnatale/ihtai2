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

#### sliding-window
Takes new time-steps, and maintains a variable length window of the past n time-steps


##### time-step
Objects that contain an actionTakenKey representing the action taken in the described time-step,
and a driveScore, containing the drive score for said time-step.


#### pattern-recognizer
Controls saving and retrieving next move data from database for a particular pattern. 
