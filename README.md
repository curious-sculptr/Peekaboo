# Peekaboo

A casual, privacy-focused web application designed to eliminate workplace anxiety. Peekaboo uses your device's camera to monitor the environment behind you while you work, subtly alerting you if someone approaches so you can stay deeply focused in your zone with headphones on.

## The Problem & Solution
* **The Problem:** Sitting with your back directly facing a high-traffic office door or open space makes wearing headphones stressful. Sudden taps on the shoulder lead to jumpscares, broken focus, and baseline anxiety.
* **The Solution:** Peekaboo acts as a digital rearview mirror. By leveraging a live camera feed inside your browser, it automatically detects when a person enters the frame behind you, triggering a gentle notification so you are never caught off guard.

## How It Works (Under the Hood)
Because this was a rapid prototyping project driven by deep research, the core logic relies on bridging client-side hardware APIs with pre-trained neural networks:

1. **Webcam Streaming:** Requests secure user permission to capture a live media stream from the webcam directly inside the browser canvas.
2. **Face & Motion Tracking:** Continuously feeds the video stream into a localized machine learning model to detect human faces in real time.
3. **Smart Filtering:** Tracks the coordinates of the user's face to establish a baseline, ensuring normal head movements don't trigger false positives. 
4. **Context Alerts:** Triggers a system or browser-based alert the moment a secondary presence or movement is detected behind the main user.

## Tech Stack
* **Frontend:** Vanilla JavaScript, HTML5 Canvas, CSS3
* **Machine Learning Framework:** TensorFlow.js
* **Core Library:** face-api.js (for real-time face detection)

## Directory Structure
To run Peekaboo, ensure your files are organized with the weights and manifest files in a dedicated subfolder:

```text
├── index.html
├── script.js
├── style.js
└── models/
    ├── ssd_mobilenetv1_model-weights_manifest.json
    ├── ssd_mobilenetv1_model-shard1
    └── (any other face-api.js model/shard files)
```

## Setup & Installation
Since this is a client-side web application that requests webcam access and loads local machine learning models, it must be run through a local web server (opening the HTML file directly in your browser will cause CORS errors).

Follow these steps to run the project locally:

1. **Clone the repository:**
   ```bash
   git clone https://github.com
   ```

2. **Navigate into the directory:**
   ```bash
   cd peekaboo
   ```

3. **Start a local static server:**
   You can use any basic static server. Here are two quick options:
   * **Using Python** (built into most computers):
     ```bash
     python -m http.server 8000
     ```
   * **Using VS Code:** Right-click `index.html` and select **Open with Live Server**.

4. **Run the app:**
   Open your browser and navigate to `http://localhost:8000` (or the port provided by your server). Grant the browser permission to use your webcam, and the models will load automatically from the `models/` subfolder.


## Reflection & What I Learned
This project was an incredible deep-dive into browser hardware integration and client-side computer vision. Building Peekaboo required reading dense documentation, understanding how to handle asynchronous video feeds frame-by-frame, and learning how to properly initialize pre-trained weights in a web context. It taught me how to rapidly prototype a creative solution to a real-world problem by stitching together specialized open-source tools.

## Acknowledgments & Credits
Peekaboo relies heavily on the open-source community. Special thanks to:
* Vincent Mühler for creating face-api.js (https://github.com), which provides the robust JavaScript face detection API built on top of TensorFlow.js core used in this application.
