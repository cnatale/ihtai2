const canvas = document.getElementById("renderCanvas"); // Get the canvas element 
const engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

/******* Add the create scene function ******/
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

  var materialAmiga2 = new BABYLON.StandardMaterial("amiga", scene);
  materialAmiga2.diffuseTexture = new BABYLON.Texture("textures/amiga.jpg", scene);
  materialAmiga2.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);

  // Shadows
  var shadowGenerator = new BABYLON.ShadowGenerator(2048, light);

  // Physics
  //scene.enablePhysics(null, new BABYLON.CannonJSPlugin());
  scene.enablePhysics(null, new BABYLON.OimoJSPlugin());

  // Sphere
  var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 3, scene);
  sphere.material = materialAmiga;

  sphere.position = new BABYLON.Vector3(Math.random() * 20 - 10, 0, Math.random() * 10 - 5);

  shadowGenerator.addShadowCaster(sphere);

  sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1 }, scene);

  // Box
  var box0 = BABYLON.Mesh.CreateBox("Box0", 3, scene);
  box0.position = new BABYLON.Vector3(3, 30, 0);
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

  return scene;
}

/******* End of the create scene function ******/    

const scene = createScene(); // Call the createScene function

engine.runRenderLoop(function () { // Register a render loop to repeatedly render the scene
  scene.render();
});


window.addEventListener('resize', function () { // Watch for browser/canvas resize events
  engine.resize();
});



// IHTAI CODE GOES HERE //
// TODO: use physics demo from http://www.babylonjs-playground.com/ to build
// a 3d version of the ball demo, giving ihtai control over the ball
