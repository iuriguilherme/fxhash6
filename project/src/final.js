import { drawLines } from "./shared";
import p5 from "p5";
import * as tf from "@tensorflow/tfjs";

//~ const seed = fxrand() * 1e8;
const seed = $fx.rand() * 1e9;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function getVector() {
  return p5.Vector.random2D();
}

let sketch = function(p5) {
  //~ const TURN_MAX = 0.05;
  const TURN_MAX = $fx.getParam("turning");
  //~ const POPULATION_COUNT = 100;
  const POPULATION_COUNT = $fx.getParam("population");
  const SPEED = 2;
  const SHOW_CHECKPOINTS = false;
  //~ const mutationRate = 0.05;
  const mutationRate = $fx.getParam("mutation");
  let population = [];
  let matingPool = [];
  let skip = false;
  let generationCount = 0;
  let myFrameCount = 0;
  let track;
  let carImg;
  let isFinished = false;
  let checkpoints;
  let best;
  let trackPixels;
  let hasFxPreviewAlready = false;
  function setupCheckpoints(points) {
    checkpoints = new Checkpoints(points);
  }
  function checkWallCollisions() {
    for (let car of population) {
      let pixelRgb = p5.get(car.pos.x, car.pos.y);
      if (pixelRgb[0] !== 147 && pixelRgb[0] !== 110) {
        car.die();
      }
    }
  }
  function naturalSelection() {
    matingPool = [];
    let bestCount = 0;
    for (let pop of population) {
      let n = p5.floor(pop.fitness * 100);
      if (n > bestCount) {
        bestCount = n;
        best = pop;
      }
      for (let i = 0; i < n; i++) {
        matingPool.push(pop);
      }
    }
    if (best) {
      for (let i = 0; i < bestCount * 4; i++) {
        matingPool.push(best);
      }
    }
    best = Object.assign({}, best);
  }
  function generate() {
    for (let i = 0; i < population.length; i++) {
      let index = p5.floor(p5.random(matingPool.length));
      let chosen = matingPool[index];
      let clonedBrain = chosen.brain.copy();
      let car = new Car();
      car.brain = clonedBrain;
      car.brain.mutate(mutationRate); 
      population[i] = car;
    }
  }
  class Car {
    constructor() {
      this.carImg = carImg;
      this.velocity = getVector();
      this.r = 15;
      this.index = 0;
      this.pos = p5.createVector(p5.width/2, p5.height - 325);
      this.s1 = p5.createVector(p5.width/2-40, p5.height - 325);
      this.s0 = p5.createVector(p5.width/2, p5.height - 325);
      this.s2 = p5.createVector(p5.width/2, p5.height - 325);
      this.angle = 0;
      this.rotateAmount = 0;
      this.alive = true;
      this.currentCheckpoint = 0;
      //this.genotype = new DNA();
      this.brain = new NeuralNetwork(4, 8, 2);
    }
    die() {
      this.alive = false;
    }
    draw() {
      if (!this.alive) return;
      p5.push();
      p5.translate(this.pos.x, this.pos.y);
      p5.rotate(this.angle);
      
      if (this.wasBest) {
        p5.tint(0, 255, 100); 
      }
      p5.imageMode(p5.CENTER);
      p5.image(carImg, 0, 0, this.r + 10, this.r);
      p5.pop();
      p5.push();
      p5.noStroke();
      p5.fill(100, 255, 100)
      //p5.circle(this.s2.x, this.s2.y, 2)
      //p5.circle(this.s1.x, this.s1.y, 2)
      //p5.circle(this.s0.x, this.s0.y, 2)
      p5.pop();
    }
    update() {
      if (!this.alive) return;
      this.pos.x -= SPEED * p5.cos(this.angle);
      this.pos.y -= SPEED * p5.sin(this.angle);
      this.s1.x = this.pos.x - 30 * p5.cos(this.angle);
      this.s1.y =  this.pos.y - 30 * p5.sin(this.angle);
      this.s0.x = this.pos.x - 25 * p5.cos(this.angle + p5.PI/2);
      this.s0.y =  this.pos.y - 25 * p5.sin(this.angle + p5.PI/2);
      this.s2.x = this.pos.x - 25 * p5.cos(this.angle - p5.PI/2);
      this.s2.y =  this.pos.y - 25 * p5.sin(this.angle - p5.PI/2);
      // this.angle += this.genotype.genes[this.index];
      this.think();
      this.index++;
    }
    think() {
      let infrontCollision = 0
      const index = 4 * (p5.floor(this.s1.y) * p5.width + p5.floor(this.s1.x));
      if (p5.pixels && p5.pixels[index] != 110 && p5.pixels[index+1] != 111 && p5.pixels[index+2] != 114) {
        infrontCollision = 1;
      }
      let rightCollision = 0
      const indexRight = 4 * (p5.floor(this.s0.y) * p5.width + p5.floor(this.s0.x));
      if (p5.pixels && p5.pixels[indexRight] != 110 && p5.pixels[indexRight+1] != 111 && p5.pixels[indexRight+2] != 114) {
        rightCollision = 1;
      }
      let leftCollision = 0
      const indexLeft = 4 * (p5.floor(this.s2.y) * p5.width + p5.floor(this.s2.x));
      if (p5.pixels && p5.pixels[indexLeft] != 110 && p5.pixels[indexLeft+1] != 111 && p5.pixels[indexLeft+2] != 114) {
        leftCollision = 1;
      }
      let inputs = [ this.angle, infrontCollision, rightCollision, leftCollision]
      const result = this.brain.predict(inputs);
      if (result[0] > result[1]) {
        this.angle += TURN_MAX;
      } else {
        this.angle -= TURN_MAX;
      }
    }
    calcFitness() {
      this.fitness = p5.map(this.index, 0, 100, 0, 1);
      this.fitness = p5.pow(this.fitness, 4);
    }
    crossover(partner) {
      let childCar = new Car();
      childCar.genotype = this.genotype.crossover(partner.genotype);
      return childCar;
    }
    mutate(mutationRate) {
      this.genotype.mutate(mutationRate);
    }
  }
  class Checkpoints {
    constructor(points) {
      this.checkpoints = [];
      if (points) {
        this.checkpoints = points;
      }
      this.r = 20;
    }
    create(x, y) {
      this.checkpoints.push({x,y});
    }
    delete() {
      this.checkpoints.pop();
    }
    draw() {
      if (!SHOW_CHECKPOINTS) return;
      for (let checkpoint of this.checkpoints) {
        p5.circle(checkpoint.x, checkpoint.y, this.r);
      }
    }
    hit(car) {
      if (this.checkpoints.length <= car.currentCheckpoint) return;
      let checkpoint = this.checkpoints[car.currentCheckpoint];
      if (p5.dist(car.pos.x, car.pos.y, checkpoint.x, checkpoint.y) <= this.r + car.r) {
        return true;
      }
      return false;
    }
    save() {
      p5.saveJSON(this.checkpoints, 'points.json');
    }
  }
  class DNA {
    constructor() {
      this.genes = this.createGenes();
    }
    createGenes() {
      let s = [];
      for (let j = 0; j < 10000; j++) {
         s[j] = random(-TURN_MAX, TURN_MAX);
      }
      return s;
    }
    calcFitness(currentCheckpoint) {
      // index is just the gene they were currently on
      // using this as an easy way to calc fitness
      // the higher the index, the further they moved the closer to the finish?
      // this.fitness = map(index, 0, 10000, 0, 1);
      this.fitness = map(currentCheckpoint, 0, 100, 0, 1);
      this.fitness = pow(this.fitness, 4);
    }
    crossover(partner) {
      let child = new DNA();
      let midpoint = floor(random(this.genes.length));
      for (let i = 0; i < this.genes.length; i++) {
        if (i > midpoint) {
          child.genes[i] = this.genes[i];
        } 
        else {
          child.genes[i] = partner.genes[i]; 
        }
      }
      return child;
    }
    mutate(mutationRate) {
      for (let i = myFrameCount-400; i < this.genes.length; i++) {
        if (random(1) < mutationRate) {
           this.genes[i] = random(-TURN_MAX, TURN_MAX);
        }
      }
    }
  }
  class NeuralNetwork {
    constructor(a, b, c, d) {
      if (a instanceof tf.Sequential) {
        this.model = a;
        this.inputNodes = b;
        this.hiddenNodes = c;
        this.outputNodes = d;
      } else {
        this.inputNodes = a;
        this.hiddenNodes = b;
        this.outputNodes = c;
        this.model = this.createModel();
      }
    }
    createModel() {
      const model = tf.sequential();
      const hidden = tf.layers.dense({
        units: this.hiddenNodes,
        inputShape: [this.inputNodes],
        activation: 'sigmoid'
      });
      model.add(hidden);
      const output = tf.layers.dense({
        units: this.outputNodes,
        activation: 'softmax'  // makes sure the values add up to 1
      });
      model.add(output);
      //this.model.compile({});
      return model
    }
    predict(inputs) {
      const xs = tf.tensor2d([inputs]);
      const ys = this.model.predict(xs);
      const outputs = ys.dataSync();
      //console.log(outputs);
      return outputs;
    }
    copy() {
      const modelCopy = this.createModel();
      const weights = this.model.getWeights();
      const weightCopies = [];
      for (let i = 0; i < weights.length; i++) {
        weightCopies[i] = weights[i].clone();
      }
      modelCopy.setWeights(weightCopies);
      return new NeuralNetwork(modelCopy, this.inputNodes, this.hiddenNodes, this.outputNodes);
    }
    mutate(mutationRate) {
      const weights = this.model.getWeights();
      const mutatedWeights = [];
      for (let i = 0; i < weights.length; i++) {
        let tensor = weights[i];
        let shape = weights[i].shape;
        let values = tensor.dataSync().slice();
        for (let j = 0; j < values.length; j++) {
          if (p5.random(1) < mutationRate) {
            let w = values[j];
            values[j] = w + p5.randomGaussian();  
          }
        }
        let newTensor = tf.tensor(values, shape);
        mutatedWeights[i] = newTensor;
      }
      this.model.setWeights(mutatedWeights);
    }
  }
  p5.preload = function() {
    p5.randomSeed(seed);
    p5.noiseSeed(seed);
    p5.loadJSON("points.json", setupCheckpoints);
    track = p5.loadImage("track1.png");
    carImg = p5.loadImage("car.png");
  }
  p5.setup = function() {
    p5.createCanvas(800, 800);
    for (let i = 0; i < POPULATION_COUNT; i++) {
      population.push(new Car());
    }
    p5.goal = p5.createVector(p5.width / 2, 20);
    tf.setBackend('cpu');
  };
  p5.draw = async function() {
    p5.background(147, 204, 76);
    p5.image(track, 0, 0)
    if (p5.frameCount === 1) {
      p5.loadPixels();
    }
    checkWallCollisions();
    isFinished = true;
    for (let car of population) {
      car.update();
      car.draw();
      if (checkpoints.hit(car)) {
        car.currentCheckpoint++;
      }
      if (car.alive) isFinished = false;
    }
    if (isFinished) {
      for (let pop of population) {
        pop.calcFitness();
      }
      naturalSelection();
      generate();
      generationCount++;
      myFrameCount = 0;
    }
    checkpoints.draw();
    p5.textSize(20);
    p5.text(`Best Distance: ${best && best.currentCheckpoint ?  best.currentCheckpoint: 0}`, 25, p5.height - 140);
    p5.text(`Generation: ${generationCount}`, 25, p5.height - 110);
    p5.text(`Population: ${population.length}`, 25, p5.height - 80);
    p5.text(`Mutation Rate: ${mutationRate*100}%`, 25, p5.height - 50);
    p5.text(`Maximum turning angle: ${TURN_MAX*100}%`, 25, p5.height - 20);
    myFrameCount++;
    if (! hasFxPreviewAlready) {
      $fx.preview();
      hasFxPreviewAlready = true;
    }
    await sleep(1);
  };
  p5.keyTyped = function() {
    switch (p5.keyCode) {
      case 83:
        checkpoints.save();
        break;
      case 88:
        p5.saveJSON(best.brain.model, "best.json");
        break;
      case 90:
        checkpoints.delete();
        break;
      default:
        console.log(`Key ${p5.keyCode} is not mapped to a function`);
    }
  }
}

export default function final() {
  let myp5 = new p5(sketch, window.document.body);
  //~ const cvs = document.getElementById("canvas");
  //~ const ctx = cvs.getContext("2d");
  //~ cvs.width = cvs.height = 512;
  //~ ctx.scale(512, 512);
  //~ const X = $fx.getParam("x");
  //~ const Y = $fx.getParam("y");
  //~ const size = $fx.getParam("size");
  //~ ctx.clearRect(0, 0, 1, 1);
  //~ drawLines(ctx, X, 1 - Y, size);
}
