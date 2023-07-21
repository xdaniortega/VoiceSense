// Variables globales
let mediaRecorder;
let chunks = [];
let audioPlayer = document.getElementById("audioPlayer");

// Acceder al micrófono y comenzar la grabación
function startRecording() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
        chunks = [];
        const audioURL = URL.createObjectURL(blob);
        audioPlayer.src = audioURL;
      };

      mediaRecorder.start();
    })
    .catch((err) => console.error("Error al acceder al micrófono:", err));
}

// Detener la grabación
function stopRecording() {
  mediaRecorder.stop();
}

// Reproducir el audio grabado
function playRecording() {
  audioPlayer.play();
}

// Guardar el audio grabado en el localStorage
function saveRecording() {
  const blob = new Blob(chunks, { type: "audio/ogg; codecs=opus" });
  const reader = new FileReader();

  reader.onloadend = () => {
    const base64String = reader.result.split(",")[1];
    localStorage.setItem("audioRecording", base64String);
    console.log("Grabación de audio guardada en localStorage.");
  };

  reader.readAsDataURL(blob);
}

// Eventos de los botones
document
  .getElementById("startButton")
  .addEventListener("click", startRecording);
document.getElementById("stopButton").addEventListener("click", stopRecording);
document.getElementById("playButton").addEventListener("click", playRecording);
document.getElementById("saveButton").addEventListener("click", saveRecording);
