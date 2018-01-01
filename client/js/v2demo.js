<!DOCTYPE html>
<html>
<head>
    <title>rolling ball demo</title>
    <script src="js/external/p5.min.js"></script>
    
    <style>
    html,body {
        margin:0;
        padding:0;
        width:100%;
        height:100%;
        overflow: hidden;
    }
    </style>

    <meta name="description" content="Ihtai rolling ball demo">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
</head>
<body>
<script>
function setup() {

  // Sets the screen to be 720 pixels wide and 400 pixels high
  createCanvas(720, 400);
  background(0);
  noStroke();

  fill(204);
  triangle(18, 18, 18, 360, 81, 360);

  fill(102);
  rect(81, 81, 63, 63);

  fill(204);
  quad(189, 18, 216, 18, 216, 360, 144, 360);

  fill(255);
  ellipse(252, 144, 72, 72);

  fill(204);
  triangle(288, 18, 351, 360, 288, 360); 

  fill(255);
  arc(479, 300, 280, 280, PI, TWO_PI);
}
</script>
</body>
</html>
