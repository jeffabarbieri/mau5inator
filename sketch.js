let sequence; 
let index = [];
let indexed_sequence = [];

let markov = []; //this will be an array of arrays
let index_size;
let pitches = [];

let keys;
let toneLoop;
let currentPitch;
let score;
let scoreArray = [];

let melodyLength = 100; //allow user to modify
let playing = false; //allow user to play or pause

let sel;
let generateButton;
let playButton;
let lengthButton;
let lengthInput;
let fileName = 'Aescaus_II_ARP.json';
let canvas;

let mau5;
let fileNames = ['Aescaus_II_ARP', 'Amphisbaena_ARP', 'Circe_ARP', 'Drakon_ARP', 'Erechtheus_ARP', 'Tityos_ARP']

function preload() {
  for (let file of fileNames) {
    let name = file + ".json";
    scoreArray.push(loadJSON('scores/' + name, loaded, error));
  }
  console.log(scoreArray);
  
  // score = loadJSON('scores/' + fileName, loaded, error)
  score = scoreArray[0];
  mau5 = loadImage('images/deadmau5_logo.jpg');
}

function setup() {
  canvas = createCanvas(600, 600);
  keys = new Tone.PolySynth(3, Tone.Synth, {oscillator : {type : 'sawtooth'}});
  //keys.set({detune: 1200});
  keys.toMaster();
  const dist = new Tone.Distortion(0.2);
  const compF = new Tone.Compressor(-40, 10);
  const compI = new Tone.Compressor(-10, 4);
  compI.toMaster();
  dist.toMaster();
  compF.toMaster();
  
  textAlign(CENTER);
  background(255);
  sel = createSelect();
  sel.position(10, 10);
  sel.option('Aescaus II');
  sel.option('Amphisbaena');
  sel.option('Circe');
  sel.option('Drakon');
  sel.option('Erechtheus');
  sel.option('Tityos');
  
  sel.selected('Aescaus II');
  sel.changed(selectMidi);
  
  generateButton = createButton('generate sequence');
  generateButton.position(200, 10);
  generateButton.mousePressed(generateSequence);
  
  playButton = createButton('play/pause generated sequence');
  playButton.position(360, 10);
  playButton.mousePressed(playPause);
  
  lengthInput = createInput();
  lengthInput.position(10, 60);
  
  lengthButton = createButton('set sequence length');
  lengthButton.position(200, 60);
  lengthButton.mousePressed(setLength);
  
  image(mau5, 10, 10, 600, 600);
}

function setLength() {
  melodyLength = lengthInput.value();
  print('program will now generate sequences of length ' + melodyLength);
}

function selectMidi() {
  if (sel.value() == 'Aescaus II') score = scoreArray[0];
  else if (sel.value() == 'Amphisbaena') score = scoreArray[1];
  else if (sel.value() == 'Circe') score = scoreArray[2];
  else if (sel.value() == 'Drakon') score = scoreArray[3];
  else if (sel.value() == 'Erechtheus') score = scoreArray[4];
  else if (sel.value() == 'Tityos') score = scoreArray[5];
  print(score + ' selected');
}

function generateSequence() {
  print('generating sequence using ' + score)
  // score = loadJSON('scores/' + fileNames[1]+".json", loaded, error);
  
  sequence = [];
  pitches = [];
  //load first track into sequence
  console.log(score.tracks[0].notes.length);
  for (let i = 0; i < score.tracks[0].notes.length; i++){
    let note = score.tracks[0].notes[i];
    sequence.push(note.midi);
  }
  print(sequence);
  index_size = 0;
  
  //process sequence
  // let new_item = true;
  
  //step 1: analyze sequence
  for (let i = 0; i < sequence.length; i++) {
    new_item = true;
    //check if item is new. if not, point to existing index
    for (let j = 0; j < index_size; j++){
      if (sequence[i] == index[j]){
        new_item = false;
        indexed_sequence[i] = j;
      }
    }
    if (new_item) {
      index[index_size] = sequence[i];
      indexed_sequence[i] = index_size;
      index_size++;
    }
  }
  
  // print("raw sequence: " + sequence);
  // print("index: " + index);
  // print("indexed sequence: " + indexed_sequence);
  
  //step 2: create transition matrix
  //create table
  for (let i = 0; i < index_size; i++){
    markov[i] = [];
  }
  
  for (let i = 0; i < indexed_sequence.length; i++) { //for each unique pitch
    let current = indexed_sequence[i];
    let next_pos = (i + 1) % indexed_sequence.length;
    let next = indexed_sequence[next_pos];
    
    markov[current].push(next);
  }
  
  //print transition table
  for (let i = 0; i < markov.length; i++){
    // print(markov[i]);
  }
  
  //step 3: create melody
  let currentIndex = parseInt(random(0, markov.length)); //start anywhere
  
  for(let i = 0; i < melodyLength; i++) {
    let transitionPos = parseInt(random(0, markov[currentIndex].length));
    let nextIndex = markov[currentIndex][transitionPos];
    currentIndex = nextIndex;
    
    pitches.push(index[currentIndex]);
  }
  
  print("generated melody: " + pitches);
  currentPitch = 0;
  //play back melody
  
  //triggered every eighth note. 
  toneLoop =  new Tone.Loop(function(time) {
    
    let pitch = Tone.Frequency(pitches[currentPitch], "midi");
  	keys.triggerAttackRelease(pitch, "16n");
  	currentPitch = (currentPitch + 1) % pitches.length;
  	
  }, "16n").start(0);
}

function playPause() {
  if (playing == true) {
    print('pausing sequence');
    Tone.Transport.stop();
    playing = false;
  } 
  else {
    print('playing sequence');
    Tone.Transport.start();
    playing = true;
  } 
}

function loaded(d) {
  score = d;
}

function error(err) {
  print(err);
}