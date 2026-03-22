document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('btn-start');
    const stopBtn = document.getElementById('btn-stop');
    const statusText = document.getElementById('recording-status');
    const statusDesc = document.getElementById('recording-desc');
    const statusIcon = document.getElementById('mic-icon');

    let audioStream = null;

    // Helper to safely update the UI based on state
    const updateUIState = (state) => {
        if (state === 'recording') {
            statusText.textContent = "Recording...";
            statusText.style.color = "#10b981"; // Green successful active state
            statusDesc.textContent = "Your audio is now being captured in real-time.";

            // Icon Animation
            statusIcon.classList.remove('inactive');
            statusIcon.classList.add('active');

            // Toggle Button States
            startBtn.disabled = true;
            stopBtn.disabled = false;
        } else if (state === 'stopped') {
            statusText.textContent = "Recording Stopped";
            statusText.style.color = "#fff";
            statusDesc.textContent = "Click Start Recording to begin again.";

            // Reset Icon Animation
            statusIcon.classList.remove('active');
            statusIcon.classList.add('inactive');

            // Toggle Button States
            startBtn.disabled = false;
            stopBtn.disabled = true;
        } else if (state === 'error') {
            statusText.textContent = "Microphone Error";
            statusText.style.color = "#ef4444"; // Error Red
            statusDesc.textContent = "Please ensure your microphone is connected and permission is granted.";

            // Reset Icon Animation
            statusIcon.classList.remove('active');
            statusIcon.classList.add('inactive');

            // Reset Button States safely
            startBtn.disabled = false;
            stopBtn.disabled = true;
        }
    };

    // Initiate the media device audio capture sequence
    const startRecording = async () => {
        try {
            // Validate browser capability
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Browser API not supported");
            }

            // Await permission and stream
            audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Transition UI
            updateUIState('recording');

            /* TODO: Web Audio API visualization setup hooks go here */

        } catch (err) {
            console.error('Error accessing the microphone:', err);
            updateUIState('error');

            // Friendly error message tailoring
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                statusDesc.textContent = "Permission denied. Please allow microphone access in your browser settings.";
            } else if (err.name === 'NotFoundError') {
                statusDesc.textContent = "No microphone found on this device.";
            } else if (err.message === "Browser API not supported") {
                statusDesc.textContent = "Your browser does not support audio recording. Please try a modern browser.";
            }
        }
    };

    // Stop and dereference tracks cleanly to free up user hardware
    const stopRecording = () => {
        if (audioStream) {
            // Iteratively stop every track linked to the stream
            const tracks = audioStream.getTracks();
            tracks.forEach(track => track.stop());
            audioStream = null;
        }

        // Revert UI seamlessly
        updateUIState('stopped');
    };

    // Attach modular events
    if (startBtn) {
        startBtn.addEventListener('click', startRecording);
    }

    if (stopBtn) {
        stopBtn.addEventListener('click', stopRecording);
    }
});
