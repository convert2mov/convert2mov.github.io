class MediaCompiler {
  constructor() {
    // DOM elements
    this.imageInput = document.getElementById('image-input');
    this.audioInput = document.getElementById('audio-input');
    this.imageDropZone = document.getElementById('image-drop-zone');
    this.audioDropZone = document.getElementById('audio-drop-zone');
    this.exportBtn = document.getElementById('export-btn');
    this.output = document.getElementById('output');
    this.progressContainer = document.getElementById('progress-container');
    this.progressText = document.getElementById('progress-text');
    this.progressBar = document.getElementById('progress-bar');

    // Media files
    this.videoFile = null;
    this.imageFiles = [];
    this.audioFile = null;

    // FFmpeg instance and metadata for parsing
    this.ffmpeg = null;
    this.metadata = '';

    // Bind event listeners
    this.bindEvents();
  }

  bindEvents() {
    this.imageDropZone.addEventListener('click', () => this.imageInput.click());
    this.audioDropZone.addEventListener('click', () => this.audioInput.click());

    this.imageInput.addEventListener('change', this.handleImageInput.bind(this));
    this.audioInput.addEventListener('change', this.handleAudioInput.bind(this));

    this.imageDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.imageDropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.imageDropZone.addEventListener('drop', this.handleImageDrop.bind(this));

    this.audioDropZone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.audioDropZone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.audioDropZone.addEventListener('drop', this.handleAudioDrop.bind(this));

    this.exportBtn.addEventListener('click', this.exportMedia.bind(this));
  }

  // Add hover style while dragging files over drop zone
  handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-hover');
  }

  // Remove hover style when drag leaves drop zone
  handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-hover');
  }

  // Handle images or GIF file upload
  async handleImageInput(event) {
    const files = Array.from(event.target.files);
    for (const file of files) {
      if (!(file.type.startsWith('image/') || file.type === 'video/quicktime')) {
  alert('Please upload valid JPG, PNG, GIF, or MOV files.');
  continue;
}


      if (file.type === 'image/gif' || file.type === 'video/quicktime') {
        this.videoFile = file;
        console.log(`${file.type === 'image/gif' ? 'GIF' : 'MOV'} file added:`, file.name);
      }
       else if (file.type === 'image/jpeg' || file.type === 'image/png') {
        try {
          const croppedFile = await this.cropAndResizeImageFile(file, 1280, 720);
          this.imageFiles.push(croppedFile);
          console.log('Cropped image added:', croppedFile.name);
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    }

    event.target.value = ''; // Reset file input for repeat uploads
    this.updateOutput();
  }

  handleAudioInput(event) {
    const file = event.target.files[0];
    if (file && (file.type === 'audio/mp3' || file.type === 'audio/mpeg' || file.type === 'audio/wav')) {
      this.audioFile = file;
      console.log('Audio file added:', file.name);
      this.updateOutput();
    } else {
      alert('Please upload a valid MP3 or WAV file.');
    }

    event.target.value = ''; // Reset file input
  }

  // Handle images or GIF drop
  async handleImageDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-hover');

    const files = Array.from(event.dataTransfer.files);

    for (const file of files) {
      if (!(file.type.startsWith('image/') || file.type === 'video/quicktime')) {
  alert('Please upload valid JPG, PNG, GIF, or MOV files.');
  continue;
}

      if (file.type === 'image/gif' || file.type === 'video/quicktime') {
        this.videoFile = file;
        console.log(`${file.type === 'image/gif' ? 'GIF' : 'MOV'} file added:`, file.name);
      }
       else if (file.type === 'image/jpeg' || file.type === 'image/png') {
        try {
          const croppedFile = await this.cropAndResizeImageFile(file, 1280, 720);
          this.imageFiles.push(croppedFile);
          console.log('Cropped image added:', croppedFile.name);
        } catch (error) {
          console.error('Error processing image:', error);
        }
      }
    }

    this.updateOutput();
  }

  // Crop and resize images to fit 1280x720 aspect ratio
  cropAndResizeImageFile(file, targetWidth, targetHeight) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const inputAspect = img.width / img.height;
          const outputAspect = targetWidth / targetHeight;

          let sx, sy, sw, sh;

          if (inputAspect > outputAspect) {
            sw = img.height * outputAspect;
            sh = img.height;
            sx = (img.width - sw) / 2;
            sy = 0;
          } else {
            sw = img.width;
            sh = img.width / outputAspect;
            sx = 0;
            sy = (img.height - sh) / 2;
          }

          const canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;
          const ctx = canvas.getContext('2d');

          ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);

          canvas.toBlob((blob) => {
            if (blob) {
              const processedFile = new File([blob], file.name, { type: file.type });
              resolve(processedFile);
            } else {
              reject(new Error('Canvas toBlob failed'));
            }
          }, file.type);
        };
        img.onerror = reject;
        img.src = event.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Handle audio file drop
  handleAudioDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-hover');

    const file = event.dataTransfer.files[0];
    if (file && (file.type === 'audio/mp3' || file.type === 'audio/mpeg' || file.type === 'audio/wav')) {
      this.audioFile = file;
      console.log('Audio file added:', file.name);
      this.updateOutput();
    } else {
      alert('Please upload a valid MP3 or WAV file.');
    }
  }

  // Update UI output with current files and enable/disable export button
  updateOutput() {
    const details = [];

    if (this.videoFile) {
      details.push(`Video: ${this.videoFile.name}`);
    }

    if (this.imageFiles.length) {
      details.push(`Images: ${this.imageFiles.map(file => file.name).join(', ')}`);
    }

    if (this.audioFile) {
      details.push(`Audio: ${this.audioFile.name}`);
    }

    if (details.length) {
      this.output.innerHTML = details.join('<br><br>');
    } else {
      this.output.textContent = 'Please upload images or a GIF and an MP3.';
    }

const hasValidCombination = this.audioFile && (this.videoFile || this.imageFiles.length);

    this.exportBtn.disabled = !hasValidCombination;
  }

  // Helper: convert File object to Uint8Array for FFmpeg FS
  async fetchFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }

  // Get duration (seconds) of the audio file using FFmpeg metadata parsing
  async getAudioDuration(audioFile) {
    const ext = audioFile.name.split('.').pop().toLowerCase();
    const tempFileName = `temp.${ext}`;
    this.metadata = '';

    this.ffmpeg.FS('writeFile', tempFileName, await this.fetchFile(audioFile));

    this.ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr') {
        this.metadata += message + '\n';
      }
    });

    try {
      // Run FFmpeg -i to get metadata (duration info)
      await this.ffmpeg.run('-i', tempFileName);
    } catch {
      // Expected to throw because no output, ignore error
    }

    this.ffmpeg.FS('unlink', tempFileName);

    const match = this.metadata.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (!match) throw new Error('Could not retrieve audio duration.');

    const [, hours, minutes, seconds] = match;
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
  }

  // Main export function that processes video or images with audio into a video file
  async exportMedia() {
    if (!this.audioFile || (!this.imageFiles.length && !this.videoFile)) {
      alert('A video (GIF) or images and an MP3 file are required.');
      return;
    }

    this.exportBtn.disabled = true; // Disable button during processing

    if (!this.ffmpeg) {
      this.ffmpeg = FFmpeg.createFFmpeg({ log: true });
      console.log('Loading FFmpeg...');
      await this.ffmpeg.load();
      console.log('FFmpeg loaded!');
    }

    const audioExtension = this.audioFile.name.split('.').pop().toLowerCase();
    const audioFileName = `audio.${audioExtension}`;
    await this.ffmpeg.FS('writeFile', audioFileName, await this.fetchFile(this.audioFile));

    const outputFileName = this.audioFile.name.replace(/\.[^/.]+$/, '') + '.mov';
    const totalDuration = await this.getAudioDuration(this.audioFile);

    this.progressContainer.classList.remove('hidden');
    this.updateProgress(0);

    let processedTime = 0;

    // Convert HH:MM:SS.xx to seconds helper
    const timeToSeconds = (timeStr) => {
      const [h, m, s] = timeStr.split(':').map(parseFloat);
      return h * 3600 + m * 60 + s;
    };

    // FFmpeg logger to track progress and update progress bar
    this.ffmpeg.setLogger(({ type, message }) => {
      if (type === 'fferr') {
        const timeMatch = message.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (timeMatch) {
          processedTime = timeToSeconds(timeMatch[1]);
          const progress = Math.min((processedTime / totalDuration) * 100, 100);
          this.updateProgress(progress);
        }
      }
    });

    try {
      if (this.videoFile) {
        // Process GIF + audio
        await this.ffmpeg.FS('writeFile', 'input.gif', await this.fetchFile(this.videoFile));

        console.log('Combining GIF and audio...');
        await this.ffmpeg.run(
          '-stream_loop', '-1',
          '-i', 'input.gif',
          '-i', audioFileName,
          '-t', totalDuration.toString(),
          '-shortest',
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:a', '512k',
          '-ar', '44100',
          '-ac', '2',
          '-pix_fmt', 'yuv420p',
          outputFileName
        );
      } 
      else {
        // Process images + audio
        for (let i = 0; i < this.imageFiles.length; i++) {
          await this.ffmpeg.FS('writeFile', `image${i}.jpg`, await this.fetchFile(this.imageFiles[i]));
        }

        const imageDuration = totalDuration / this.imageFiles.length;

        // Build input params for images
        const inputImages = this.imageFiles.map((_, i) => `-loop 1 -t ${imageDuration} -i image${i}.jpg`).join(' ');
        const concatFilter = this.imageFiles.map((_, i) => `[${i}:v]`).join('') + `concat=n=${this.imageFiles.length}:v=1:a=0[outv]`;

        console.log('Combining images and audio...');
        await this.ffmpeg.run(
          ...inputImages.split(' '),
          '-i', audioFileName,
          '-filter_complex', concatFilter,
          '-map', '[outv]',
          '-map', `${this.imageFiles.length}:a`,
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-b:a', '512k',
          '-ar', '44100',
          '-ac', '2',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-shortest',
          '-t', totalDuration.toString(),
          outputFileName
        );
      }

      console.log('Processing completed!');

      const data = this.ffmpeg.FS('readFile', outputFileName);
      this.updateProgress(100);

      // Create Blob and trigger download
      const blob = new Blob([data.buffer], { type: 'video/quicktime' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = outputFileName;
      // After triggering download
      a.click();

      // Reset the progress display immediately
      this.updateProgress(0);
      this.progressContainer.classList.add('hidden');
      
      // Refresh UI
      this.updateOutput();
      
      this.output.textContent = '';
      console.log('Export completed!');

    } catch (error) {
      console.error('Error during FFmpeg processing:', error);
      alert('An error occurred during processing. Please check the logs.');
    } 
 finally {
  try {
    // Remove all FFmpeg FS files
    if (this.videoFile) {
      const ext = this.videoFile.name.split('.').pop().toLowerCase();
      this.ffmpeg.FS('unlink', `input.${ext}`);
    } else {
      this.imageFiles.forEach((_, i) => {
        this.ffmpeg.FS('unlink', `image${i}.jpg`);
      });
    }

    this.ffmpeg.FS('unlink', audioFileName);
    this.ffmpeg.FS('unlink', outputFileName);
  } catch (err) {
    console.warn('FFmpeg FS cleanup error:', err);
  }

  // Reset state
  this.imageFiles = [];
  this.videoFile = null;
  this.audioFile = null;

  // Clear file inputs
  this.imageInput.value = '';
  this.audioInput.value = '';

  // Clear output UI
  this.output.textContent = '';

  // Reset progress bar & hide
  this.updateProgress(0);
  this.progressContainer.classList.add('hidden');

  // Disable export button
  this.exportBtn.disabled = true;

  console.log('All temporary files purged and UI reset.');
}



  }

  // Update UI progress bar and text
  updateProgress(progress) {
    this.progressBar.style.width = `${progress}%`;
    this.progressText.textContent = `Processing: ${Math.round(progress)}%`;
  }
}

// Instantiate your MediaCompiler after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.mediaCompiler = new MediaCompiler();
});
