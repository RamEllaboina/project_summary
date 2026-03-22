document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('audio-upload');
    const dropZone = document.getElementById('drop-zone');
    const fileNameDisplay = document.getElementById('file-name');
    const liveRecBtn = document.getElementById('btn-live-rec');
  
    // Handle File Selection and Redirect
    const handleFileSelect = (file) => {
      if (file) {
        // Basic Audio validation
        if (['audio/mpeg', 'audio/wav', 'audio/ogg'].includes(file.type) || file.name.match(/\.(mp3|wav|ogg)$/i)) {
          fileNameDisplay.textContent = `Selected: ${file.name}`;
          fileNameDisplay.style.color = '#38bdf8'; // Restore normal color
          
          // Temporarily store file info in sessionStorage to simulate state transport
          sessionStorage.setItem('pendingAudioFile', file.name);
          
          // Visual feedback before redirecting
          dropZone.style.borderColor = '#c77dff';
          dropZone.style.background = 'rgba(199, 125, 255, 0.2)';
          
          setTimeout(() => {
            window.location.href = 'visualizer.html';
          }, 800);
        } else {
          fileNameDisplay.textContent = 'Invalid file type. Please select MP3, WAV, or OGG.';
          fileNameDisplay.style.color = '#ef4444'; // Red error
        }
      }
    };
  
    // Drag & Drop Handling for Upload Zone
    if (dropZone) {
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
      });
    
      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }
    
      ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.add('drag-active');
        }, false);
      });
    
      ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
          dropZone.classList.remove('drag-active');
        }, false);
      });
    
      dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const file = dt.files[0];
        handleFileSelect(file);
      });
    
      // File Input Change Event (Click)
      if(fileInput) {
        fileInput.addEventListener('change', (e) => {
          const file = e.target.files[0];
          handleFileSelect(file);
        });
      }
    }
  
    // Live Recording Button Click Handling
    if (liveRecBtn) {
      liveRecBtn.addEventListener('click', () => {
        // Subtle Button Animation
        liveRecBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          window.location.href = 'live.html';
        }, 300);
      });
    }
  });
