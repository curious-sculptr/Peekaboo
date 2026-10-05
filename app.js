// ==========================================
// PEEKABOO APP ENGINE - LEARNERS BLUEPRINT
// ==========================================

// 1. SELECT HTML ELEMENTS
// Grab our user interface elements using their IDs so JavaScript can interact with them.
const video = document.getElementById('webcam');
const canvas = document.getElementById('overlay');
const statusDiv = document.getElementById('status');
const registerBtn = document.getElementById('registerBtn');
const blurToggle = document.getElementById('blurToggle');
const senseSlider = document.getElementById('senseSlider');
const senseValue = document.getElementById('senseValue');
const startOverlay = document.getElementById('startOverlay');
const faviconEl = document.getElementById('favicon');

// 2. STATE STORAGE VARIABLES
// Variables that keep track of information inside memory as the script runs.
let savedFaceDescriptor = null; // Stores the mathematical footprint of your face mapping
let modelsLoaded = false;        // Becomes true when the face-api files finish parsing
let audioUnlockedContext = null; // Holds the Web Audio pipeline object after user interaction
let systemIsAlerted = false;     // Tracks if the system is currently in alert mode
let faceMissingTimeCounter = 0;  // Counts milliseconds that your face has been missing from view
let alertGraceTimer = 300;       // Max allowable time your face can disappear before alarm fires



// 3. ENCODED ASSETS (TAB ICONS)
// We draw the eyes using pure text, then wrap them in encodeURIComponent so the browser tab accepts instant updates!
const openEyeSvg   = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://w3.org" viewBox="0 0 16 16"><path fill="#00ffcc" d="M2 1h1v3h-1z M7 0h1v3h-1z M13 1h1v3h-1z M0 8h1v2h-1z M1 6h1v1h-1z M1 11h1v1h-1z M2 5h2v1h-2z M2 12h2v1h-2z M4 4h2v1h-2z M4 13h2v1h-2z M6 3h4v1h-4z M6 14h4v1h-4z M10 4h2v1h-2z M10 13h2v1h-2z M12 5h2v1h-2z M12 12h2v1h-2z M14 6h1v1h-1z M14 11h1v1h-1z M15 8h1v2h-1z M7 7h2v4h-2z"/></svg>')}`;
const closedEyeSvg = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://w3.org" viewBox="0 0 16 16"><path fill="#00ffcc" d="M2 1h1v3h-1z M7 0h1v3h-1z M13 1h1v3h-1z M0 8h16v2h-16z"/></svg>')}`;
const alertEyeSvg  = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://w3.org" viewBox="0 0 16 16"><path fill="#ff3333" d="M2 1h1v3h-1z M7 0h1v3h-1z M13 1h1v3h-1z M0 8h1v2h-1z M1 6h1v1h-1z M1 11h1v1h-1z M2 5h2v1h-2z M2 12h2v1h-2z M4 4h2v1h-2z M4 13h2v1h-2z M6 3h4v1h-4z M6 14h4v1h-4z M10 4h2v1h-2z M10 13h2v1h-2z M12 5h2v1h-2z M12 12h2v1h-2z M14 6h1v1h-1z M14 11h1v1h-1z M15 8h1v2h-1z M7 7h2v4h-2z"/></svg>')}`;



// 4. INTERACTION HUB & INITIALIZATION
// Listens for a slider change to recompute how fast your face can be missing before triggering.
function updateSensitivity() {
  const level = parseInt(senseSlider.value);
  senseValue.textContent = level;
  alertGraceTimer = 1100 - (level * 100);
}
senseSlider.addEventListener('input', updateSensitivity);
updateSensitivity();

// Removes the cover screen on click. This single click registers user authorization to unlock sound play!
startOverlay.addEventListener('click', () => {
  audioUnlockedContext = new (window.AudioContext || window.webkitAudioContext)();
  startOverlay.style.display = 'none';
  loadModels();
});

// 5. ASYNC MODEL PARSING
// Fetches the mathematical AI model files from your local subfolder.
const MODEL_URL = window.location.hostname.includes('github.io') 
  ? `${window.location.pathname.replace(/\/$/, '')}/models/` 
  : './models/';
async function loadModels() {
  try {
    statusDiv.textContent = 'Loading AI Models...';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    
    modelsLoaded = true;
    statusDiv.textContent = 'Models Loaded! Starting camera...';
    startCamera();
  } catch (error) {
    statusDiv.textContent = 'Failed to load models. Refresh the page.';
    console.error(error);
  }
}

// 6. WEBCAM INTERACTION PIPELINE
// Calls the browser's hardware hook to spin up your webcam array.
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { width: 500, height: 375 } })
    .then((stream) => {
      video.srcObject = stream;
      statusDiv.textContent = 'Camera active. Register your face!';
      registerBtn.disabled = false;
    })
    .catch((err) => {
      statusDiv.textContent = 'Camera blocked!';
      console.error(err);
    });
}

// 7. SCAN & SAVE YOUR PROFILE
// Runs when you hit the register button. Maps your face and saves it into memory.
registerBtn.addEventListener('click', async () => {
  if (!modelsLoaded) return;
  statusDiv.textContent = 'Scanning face... Keep still.';
  
  const detection = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
    
  if (detection) {
    savedFaceDescriptor = detection.descriptor; // Save your face descriptor profile
    statusDiv.textContent = 'Face Registered! Secure.';
    registerBtn.textContent = 'Re-register';
    startMonitoring(); // Boots up the monitoring loop!
  } else {
    statusDiv.textContent = 'Could not see your face. Try again.';
  }
});

// 8. THE SECURITY MONITORING LOOP
// This loop runs endlessly every 100 milliseconds to scan your environment.
function startMonitoring() {
  const displaySize = { width: video.offsetWidth, height: video.offsetHeight };
  faceapi.matchDimensions(canvas, displaySize);
  const ctx = canvas.getContext('2d');

  setInterval(async () => {
    if (!savedFaceDescriptor) return;

    // Call AI face detection tracking arrays
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.15 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    // Clear previous drawing frames from the canvas overlay layer
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    
    let strangerDetected = false;
    let myFaceIsVisible = false;

    // Loop through every face currently seen in the webcam feed
    resizedDetections.forEach(detection => {
      // Calculate how mathematically similar this face is to your saved face (0 = perfect match)
      const distance = faceapi.euclideanDistance(savedFaceDescriptor, detection.descriptor);
      
      let label = "Authorized User";
      let boxColor = "#00ffcc";

      if (distance <= 0.55) {
        myFaceIsVisible = true; // Set to true if the face matches yours close enough
      } else {
        label = "👀 PEEKABOO!";
        boxColor = "#ff3333";
        strangerDetected = true; // Set to true if it's a completely different face
      }

      // Draw the box geometries onto our canvas overlay layer
      const drawBox = new faceapi.draw.DrawBox(detection.detection.box, { label: '', boxColor: boxColor, lineWidth: 2 });
      drawBox.draw(canvas);

      // Flips the drawn text element horizontally so letters read normal left-to-right!
      const { x, y } = detection.detection.box;
      ctx.save();
      ctx.translate(x, y - 10);
      ctx.scale(-1, 1); 
      ctx.font = "14px 'Courier New', monospace";
      ctx.fillStyle = boxColor;
      ctx.fillText(label, -ctx.measureText(label).width, 0); 
      ctx.restore();
    });

    // 9. SECURITY BRAIN RULES HUB
    let triggerAlarm = false;

    if (strangerDetected) {
      // Rule A: A distinct stranger's face is sitting clearly inside the background view
      triggerAlarm = true;
      statusDiv.textContent = "ALERT! Stranger spotted behind you!";
    } else if (!myFaceIsVisible) {
      // Rule B: Your face went missing! Meaning a silhouette broke your camera's line-of-sight
      faceMissingTimeCounter += 100;
      
      if (faceMissingTimeCounter >= alertGraceTimer) {
        triggerAlarm = true;
        statusDiv.textContent = "⚠️ PEEKABOO! Line of sight broken!";
      } else {
        statusDiv.textContent = "Tracking lost... waiting for grace frame.";
      }
    } else {
      // Clean Pass: You are in view and no threats exist. Turn down alerts.
      faceMissingTimeCounter = 0;
      systemIsAlerted = false;
      statusDiv.textContent = "Monitoring active... Secure.";
      statusDiv.classList.remove('alert');
    }

    // Execute alerts if rules specify a compromise state
    if (triggerAlarm) {
      systemIsAlerted = true;
      statusDiv.classList.add('alert');
      faviconEl.href = alertEyeSvg; // Instantly switches your browser tab icon to solid red!
      playAudioAlert();
    }

  }, 100); 
}

// 10. SYNTHESIZER 8-BIT NOTIFICATION ENGINE
// Generates double sound click frequencies directly inside audio context channels
let lastAlertTime = 0;
function playAudioAlert() {
  if (!audioUnlockedContext) return;
  const now = Date.now();
  if (now - lastAlertTime < 2500) return; // Throttle to prevent ears from blowing out
  lastAlertTime = now;

  if (audioUnlockedContext.state === 'suspended') {
    audioUnlockedContext.resume();
  }

  // Chime 1
  const osc1 = audioUnlockedContext.createOscillator();
  const gain1 = audioUnlockedContext.createGain();
  osc1.type = 'square';
  osc1.frequency.setValueAtTime(587.33, audioUnlockedContext.currentTime); 
  gain1.gain.setValueAtTime(0.05, audioUnlockedContext.currentTime);
  osc1.connect(gain1);
  gain1.connect(audioUnlockedContext.destination);
  osc1.start();
  osc1.stop(audioUnlockedContext.currentTime + 0.08);

  // Chime 2 (Climbing high pitch)
  setTimeout(() => {
    const osc2 = audioUnlockedContext.createOscillator();
    const gain2 = audioUnlockedContext.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(880.00, audioUnlockedContext.currentTime); 
    gain2.gain.setValueAtTime(0.05, audioUnlockedContext.currentTime);
    osc2.connect(gain2);
gain2.connect(audioUnlockedContext.destination);
osc2.start();
osc2.stop(audioUnlockedContext.currentTime + 0.15);
}, 80);
}
// 11. BROWSER TAB SYNCED BLINK ENGINE
// 💡 REPLACE THE ENTIRE BOTTOM SECTION OF YOUR APP.JS WITH THIS BULLETPROOF RE-RENDER ENGINE:

// Core helper function that deletes the old tag and drops a fresh node into the HTML head
function forceFaviconUpdate(svgBase64Data) {
  // Find any existing favicon link tags in the header
  const oldLink = document.getElementById('favicon') || document.querySelector("link[rel*='icon']");
  
  // Create a brand new, detached link element
  const newLink = document.createElement('link');
  newLink.id = 'favicon';
  newLink.rel = 'icon'; // Enforce clean standard parameter tags
  newLink.type = 'image/svg+xml';
  newLink.href = svgBase64Data;

  // Remove the stale tag from the HTML DOM head structure if it exists
  if (oldLink && oldLink.parentNode) {
    oldLink.parentNode.removeChild(oldLink);
  }
  
  // Append the fresh tag into the header to force a live browser re-render
  document.head.appendChild(newLink);
}

// Initialize the tab with a green icon immediately upon file processing
// forceFaviconUpdate(openEyeSvg);

// 💡 REPLACE the entire bottom area of app.js (from forceFaviconUpdate downward) with this:

function forceFaviconUpdate(svgUrlEncodedData) {
  // Query all possible legacy or active browser link tags in the header
  let link = document.querySelector("link[rel*='icon']");
  
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  
  link.type = 'image/svg+xml';
  link.href = svgUrlEncodedData;
  
  // Magic trick: Modifying the attribute doesn't always flash. 
  // Changing the relation identity flag back and forth forces the chrome tab row to instantly redraw!
  link.rel = 'shortcut icon'; 
  link.rel = 'icon'; 
}

// Set up the tab view right away
forceFaviconUpdate(openEyeSvg);

// 11. BROWSER TAB SYNCED BLINK ENGINE
setInterval(() => {
  if (systemIsAlerted) {
    forceFaviconUpdate(alertEyeSvg); // Locked threat red
    return;
  }
  
  forceFaviconUpdate(closedEyeSvg); // Blink down
  
  setTimeout(() => {
    if (!systemIsAlerted) {
      forceFaviconUpdate(openEyeSvg); // Flutter back to open green
    }
  }, 180);
}, 4000);

// 12. PRIVACY TOGGLE CONTROLLER
blurToggle.addEventListener('change', () => {
  if (blurToggle.checked) {
    video.classList.add('blurred');
  } else {
    video.classList.remove('blurred');
  }
});
