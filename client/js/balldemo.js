/////////// BEGIN BABYLON CODE ///////////
const canvas = document.getElementById("renderCanvas"); // Get the canvas element 
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

var sphere, box0;
var createScene = function () {
  var scene = new BABYLON.Scene(engine);
  scene.clearColor = BABYLON.Color3.Purple();

  var camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -20), scene);
  camera.attachControl(canvas, true);
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera.setTarget(new BABYLON.Vector3(0, 0, 0));

  var light = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(0.2, -1, 0), scene);
  light.position = new BABYLON.Vector3(0, 80, 0);

  // Material
  var materialAmiga = new BABYLON.StandardMaterial("amiga", scene);
  materialAmiga.diffuseTexture = new BABYLON.Texture("textures/amiga.jpg", scene);
  materialAmiga.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  materialAmiga.diffuseTexture.uScale = 5;
  materialAmiga.diffuseTexture.vScale = 5;

  // Shadows
  var shadowGenerator = new BABYLON.ShadowGenerator(2048, light);

  // Physics
  scene.enablePhysics(null, new BABYLON.CannonJSPlugin());
  // scene.enablePhysics(null, new BABYLON.OimoJSPlugin());

  // Sphere
  sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 3, scene);
  sphere.material = materialAmiga;

  // sphere.position = new BABYLON.Vector3(Math.random() * 20 - 10, 0, Math.random() * 10 - 5);
  // sphere.position = new BABYLON.Vector3(5, 0, 5);
  sphere.position = new BABYLON.Vector3(-40, 0, 40);

  shadowGenerator.addShadowCaster(sphere);

  sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1 }, scene);

  // Box
  box0 = BABYLON.Mesh.CreateBox("Box0", 3, scene);
  box0.position = new BABYLON.Vector3(0, 5, 0);
  var materialWood = new BABYLON.StandardMaterial("wood", scene);
  materialWood.diffuseTexture = new BABYLON.Texture("textures/crate.png", scene);
  materialWood.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  box0.material = materialWood;

  shadowGenerator.addShadowCaster(box0);

  // Playground
  var ground = BABYLON.Mesh.CreateBox("Ground", 1, scene);
  ground.scaling = new BABYLON.Vector3(100, 1, 100);
  ground.position.y = -5.0;
  ground.checkCollisions = true;

  var border0 = BABYLON.Mesh.CreateBox("border0", 1, scene);
  border0.scaling = new BABYLON.Vector3(1, 100, 100);
  border0.position.y = -5.0;
  border0.position.x = -50.0;
  border0.checkCollisions = true;

  var border1 = BABYLON.Mesh.CreateBox("border1", 1, scene);
  border1.scaling = new BABYLON.Vector3(1, 100, 100);
  border1.position.y = -5.0;
  border1.position.x = 50.0;
  border1.checkCollisions = true;

  var border2 = BABYLON.Mesh.CreateBox("border2", 1, scene);
  border2.scaling = new BABYLON.Vector3(100, 100, 1);
  border2.position.y = -5.0;
  border2.position.z = 50.0;
  border2.checkCollisions = true;

  var border3 = BABYLON.Mesh.CreateBox("border3", 1, scene);
  border3.scaling = new BABYLON.Vector3(100, 100, 1);
  border3.position.y = -5.0;
  border3.position.z = -50.0;
  border3.checkCollisions = true;

  var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
  groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
  groundMat.backFaceCulling = false;
  ground.material = groundMat;
  border0.material = groundMat;
  border1.material = groundMat;
  border2.material = groundMat;
  border3.material = groundMat;
  ground.receiveShadows = true;

  // Physics
  box0.physicsImpostor = new BABYLON.PhysicsImpostor(box0, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 2, friction: 0.4, restitution: 0.3 }, scene);
  ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, friction: 0.5, restitution: 0.7 }, scene);
  border0.physicsImpostor = new BABYLON.PhysicsImpostor(border0, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
  border1.physicsImpostor = new BABYLON.PhysicsImpostor(border1, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
  border2.physicsImpostor = new BABYLON.PhysicsImpostor(border2, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
  border3.physicsImpostor = new BABYLON.PhysicsImpostor(border3, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);


  const cylinder = BABYLON.MeshBuilder.CreateCylinder(
    'cylinder',
    {
      diameter: 20,
      height: .5,
      faceColors: [
        new BABYLON.Color4(0, .7, .7, 1),
        new BABYLON.Color4(0, .7, .7, 1),
        new BABYLON.Color4(0, .7, .7, 1)
      ]
    },
    scene);
  cylinder.position.y = -4.5;
  const cylinderMat = new BABYLON.StandardMaterial('cylinderMat', scene);
  cylinderMat.diffuseColor = new BABYLON.Color3(0, .7, .7);
  cylinderMat.emissiveColor = new BABYLON.Color3(0, .7, .7);
  cylinderMat.alpha = 0.3;
  cylinder.material = cylinderMat;

  scene.onBeforeRenderObservable.add(function () {
    cylinder.position.x = box0.position.x;
    cylinder.position.z = box0.position.z;
  });

  return scene;
}; 

const scene = createScene(); // Call the createScene function

engine.runRenderLoop(function () { // Register a render loop to repeatedly render the scene
  scene.render();
});

window.addEventListener('resize', function () { // Watch for browser/canvas resize events
  engine.resize();
});



//////// BEGIN IHTAI CODE //////////
let scoreSum = 0;
let timeInTargetAreaSum = 0;

var currentInputState = [
  Math.round(sphere.position.x - box0.position.x),
  Math.round(sphere.position.z - box0.position.z),
  0,
  0
];                  
var currentActionState = 0; // 0 = don't move
var counter = 0; // used to control number of api call cycles for test purposes
var driveScore = getDriveScore(currentActionState);

const possibleDataValues = [0, 1, 2, 3, 4];
var startingData = JSON.stringify({
    startingData: [
      { inputState: currentInputState, actionState: [currentActionState], driveState: [driveScore] }
    ],
    possibleDataValues: [
      possibleDataValues
    ]
});

// WARNING: WIPES OUT ALL SAVED IHTAI DATA
function clearDb() {
    return fetch('http://localhost:3800/db', {
        method: 'delete'
    });
};

// clearDb();

//////// START DATA FETCH CHAIN ////////

fetch('http://localhost:3800/initializeFromDb', {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      possibleDataValues: [possibleDataValues]
    })
}).then((response) =>
fetch('http://localhost:3800/initialize', {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: startingData
})).then((response) => {
    return getNearestPatternRecognizer({
      inputState: currentInputState,
      actionState: [currentActionState],
      driveState: [driveScore]
    });
}, (message) => {
    console.log('initialize failure: ');
    console.log(message);
});

function getNearestPatternRecognizer(ihtaiState) {
    return fetch('http://localhost:3800/nearestPatternRecognizer', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ihtaiState)
    }).then((response) => response.text()).then(function (nearestPatternString) {

      if (shouldSplitPatternRecognizer) {
        shouldSplitPatternRecognizer = false;
        splitPatternRecognizer(
          nearestPatternString,
          ihtaiState,
          {
            // TODO: vars here as well for pattern state
            nearestPatternString: nearestPatternString,
            ihtaiState: ihtaiState
          }
        );
      } else {
        return addTimeStep(
          nearestPatternString,
          ihtaiState
        );
      }

    });
}

function addTimeStep(nearestPatternString, ihtaiState) {
    // stateKey must match an existing pattern
    // console.log(ihtaiState.actionState[0]);
    var data = JSON.stringify({
        // actionKey: nearestPatternString.split('_')[4],
        // we want to pass along the actual action key
        // do limit damage done from compression,
        // so action table scores still update correctly no matter what
        actionKey: ihtaiState.actionState[0],
        stateKey: nearestPatternString.split('pattern_')[1],
        score: driveScore
    });

    return fetch('http://localhost:3800/addTimeStep', {
        method: 'put',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: data
    }).then(() => {
        // ordinarily we can ignore the results of this method
        return updateScore(nearestPatternString);
    });
}

function updateScore(nearestPatternString) {
    return fetch('http://localhost:3800/updateScore', {
        method: 'get'
    }).then(() => {
        return getBestNextAction(nearestPatternString);
    }, (message) => {
        // for this api call it's probably ok to ignore error
        // because this will return 500 if not enough items are in the stack to calculate. could check for message or start including status codes
        return getBestNextAction(nearestPatternString);
    });
}

function getBestNextAction(nearestPatternString) {
    var data = JSON.stringify({
        patternString: nearestPatternString
    });

    return fetch('http://localhost:3800/bestNextAction', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: data
    }).then((result) => result.json()).then((bestAction) => {
      // expect json object with .next_action string.
      // note that this split technique only works if action is 1 dimension.
      // come up with a better, more general approach. maybe bestNextAction
      // should only return the action part of the string.
      var bestActionString = bestAction.next_action;

      return getUpdatesPerMinute(nearestPatternString, bestActionString);
    });
}

// get updates per minute for a given patternRecognizer
function getUpdatesPerMinute(patternString, bestActionString) {
    var data = JSON.stringify({
        patternString: patternString
    });

    return fetch('http://localhost:3800/updatesPerMinute', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: data
    }).then((res) => {
        return res.json().then((resultJson) => {

          // console.log('updates per minute: ');
          // console.log(resultJson);

          // split anytime the pattern has more than 1 update
          if (resultJson.updatesPerMinute > 1) {
            shouldSplitPatternRecognizer = true;
          }

          return actOnSuggestion(Number(bestActionString));
        });
    });    
}

var shouldSplitPatternRecognizer = false;

// make this method only run if pattern access velocity > than arbitrary cutoff
function splitPatternRecognizer(nearestPatternString, newPoint, timeStepData) {
    var data = JSON.stringify({
        originalPatternRecognizerString: nearestPatternString,
        newPoint: newPoint
    });

    return fetch('http://localhost:3800/splitPatternRecognizer', {
        method: 'post',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: data
    }).then((result) => {
      console.log('SPLIT PATTERN RECOGNIZER SUCCESS!')
      return addTimeStep(
        timeStepData.nearestPatternString,
        timeStepData.ihtaiState
      );
    }, () => {
      console.log('SPLIT PATTERN RECOGNIZER FAILURE')
      return addTimeStep(
        timeStepData.nearestPatternString,
        timeStepData.ihtaiState
      );
    });
}

function actOnSuggestion (suggestedAction) {
  // console.log('suggestedAction to be acted on: ' + suggestedAction);
  // x and z axes apply force horizontally
  // signals. 
  // +x is right, -x is left
  // +z is away from camera, -z is towards
  // so action signal can be:
  // 0 : no action
  // 1 : -x
  // 2 : +x
  // 3 : -z
  // 4 : +z

  switch (suggestedAction) {
    case 0:
      // no impulse
      break;
    case 1:
      sphere.physicsImpostor.applyImpulse(new BABYLON.Vector3(-3, 0, 0), sphere.getAbsolutePosition());
      break;
    case 2:
      sphere.physicsImpostor.applyImpulse(new BABYLON.Vector3(3, 0, 0), sphere.getAbsolutePosition());
      break;
    case 3:
      sphere.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 0, -3), sphere.getAbsolutePosition());
      break;
    case 4:
      sphere.physicsImpostor.applyImpulse(new BABYLON.Vector3(0, 0, 3), sphere.getAbsolutePosition());
      break;
    default:

      break;
  }

  // console.log('absolute position');
  // console.log(`${sphere.getAbsolutePosition()}`);
  // console.log('position through .position')
  // console.log(`{X: ${sphere.position.x}, Y: ${sphere.position.y}, Z: ${sphere.position.z} }`)

  // the suggestedAction value leads to inputState and driveScore
  var sphereLinearVelocity = sphere.physicsImpostor.getLinearVelocity();
  driveScore = getDriveScore(suggestedAction);
  // probably needs velocity to figure anything out
  var ihtaiState = {
      inputState: [
        Math.round(sphere.position.x - box0.position.x),
        Math.round(sphere.position.z - box0.position.z),
        Math.round(sphereLinearVelocity.x),
        Math.round(sphereLinearVelocity.z)
      ],
      actionState: [suggestedAction],
      driveState: [driveScore]
  };

  const timeInTargetAreaAdder =
    (Math.abs(sphere.position.x - box0.position.x) + Math.abs(sphere.position.z - box0.position.z)) <= 10 ? 1 : 0;

  timeInTargetAreaSum += timeInTargetAreaAdder;
  scoreSum += driveScore;

  const numberOfCycles = 500;
  if (counter < numberOfCycles) {
    console.log(`cycle ${counter} complete`)
    counter++;
    return getNearestPatternRecognizer(ihtaiState);
  } else {
    engine.stopRenderLoop();
    // TODO: add divs with avg score, and pct of time spent
    // under target that end to end test can consume.

    const avgScore = scoreSum / numberOfCycles;
    const pctTimeInTargetArea = timeInTargetAreaSum / numberOfCycles;
    document.getElementById('avgScore').innerHTML = avgScore;
    document.getElementById('pctTimeInTargetArea').innerHTML = pctTimeInTargetArea;

    const element = document.getElementById('statusBox');
    element.innerHTML = 'Test Complete';
    element.classList.add('finished');
  }
}

function getDriveScore(suggestedAction) {
  // test logic. delete when done.
  // console.log('SUGGESTEDACTION')
  // console.log(suggestedAction)
  // console.log('CURRENTKEY')
  // console.log(currKey)
  // if(suggestedAction === currKey) {
  //   return 0;
  // } else {
  //   return 100;
  // }

  console.log('SUGGESTEDACTION')
  console.log(suggestedAction)
  var score = Math.round(Math.sqrt(
    Math.pow(sphere.position.x - box0.position.x, 2) +
    Math.pow(sphere.position.z - box0.position.z, 2)
  ));

  return score;
}

document.onkeydown = checkKey;

var currKey = 1;
function checkKey(e) {
    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        currKey = 4;
    }
    else if (e.keyCode == '40') {
        // down arrow
        currKey = 3;
    }
    else if (e.keyCode == '37') {
       // left arrow
       currKey = 1;
    }
    else if (e.keyCode == '39') {
       // right arrow
       currKey = 2;
    }

}


// TODO:
// Explicitly pass the contents of each promise to the next, because these
// calls aren't running in order and they need to maintaint the right 
// state values. Ex: 2 getnearestpatternrecognizer calls happen after eachother.

// TODO: instead of passing velocity, pass delta for x and z between
// box and sphere.




