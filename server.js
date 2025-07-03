const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configurar multer para archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: function (req, file, cb) {
    const allowedTypes = /wav|mp3|m4a|ogg|flac/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de audio'));
    }
  }
});

// Rutas principales
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Book-Voice TTS Server está funcionando',
    version: '1.0.0',
    endpoints: {
      '/health': 'Verificar estado del servidor',
      '/tts/clone-voice': 'Clonar voz desde archivo',
      '/tts/generate': 'Generar audio desde texto',
      '/tts/voices': 'Listar voces disponibles'
    }
  });
});

// Verificar estado del servidor
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Clonar voz desde archivo
app.post('/tts/clone-voice', upload.single('voice_file'), async (req, res) => {
  try {
    console.log('Recibiendo archivo de voz para clonar...');
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No se proporcionó archivo de voz'
      });
    }

    const voiceId = `voice_${Date.now()}`;
    const voicePath = req.file.path;
    
    // Simular procesamiento de clonación de voz
    // En producción aquí iría la lógica real de clonación
    console.log(`Procesando voz: ${req.file.originalname}`);
    console.log(`Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({
      success: true,
      voice_id: voiceId,
      message: 'Voz clonada exitosamente',
      voice_info: {
        original_name: req.file.originalname,
        size: req.file.size,
        duration_estimate: '10-30 segundos',
        quality: 'high'
      }
    });

  } catch (error) {
    console.error('Error clonando voz:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Generar audio desde texto
app.post('/tts/generate', async (req, res) => {
  try {
    const { text, voice_type, voice_id, language = 'en', speed = 1.0 } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Texto es requerido'
      });
    }

    if (text.length > 500000) {
      return res.status(400).json({
        error: 'Texto demasiado largo (máximo 500,000 caracteres)'
      });
    }

    console.log(`Generando audio para texto de ${text.length} caracteres`);
    console.log(`Tipo de voz: ${voice_type}`);
    
    // Simular tiempo de procesamiento basado en longitud del texto
    const processingTime = Math.min(text.length / 1000, 10000); // máximo 10 segundos
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Generar ID único para el audio
    const audioId = `audio_${Date.now()}`;
    const estimatedDuration = Math.ceil(text.length / 200); // ~200 caracteres por minuto
    
    res.json({
      success: true,
      audio_id: audioId,
      message: 'Audio generado exitosamente',
      audio_info: {
        duration_minutes: estimatedDuration,
        file_size_mb: Math.ceil(estimatedDuration * 2), // ~2MB por minuto
        format: 'mp3',
        sample_rate: '44100Hz',
        quality: 'high'
      },
      download_url: `/download/${audioId}`,
      text_stats: {
        characters: text.length,
        words: text.split(' ').length,
        estimated_duration: `${estimatedDuration} minutos`
      }
    });

  } catch (error) {
    console.error('Error generando audio:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Listar voces disponibles
app.get('/tts/voices', (req, res) => {
  res.json({
    success: true,
    voices: [
      {
        id: 'female_1',
        name: 'Sofía',
        gender: 'female',
        language: 'es',
        description: 'Voz femenina profesional en español'
      },
      {
        id: 'male_1',
        name: 'Carlos',
        gender: 'male',
        language: 'es',
        description: 'Voz masculina profesional en español'
      },
      {
        id: 'female_en_1',
        name: 'Emma',
        gender: 'female',
        language: 'en',
        description: 'Professional female voice in English'
      },
      {
        id: 'male_en_1',
        name: 'James',
        gender: 'male',
        language: 'en',
        description: 'Professional male voice in English'
      }
    ]
  });
});

// Simular descarga de audio
app.get('/download/:audioId', (req, res) => {
  const { audioId } = req.params;
  
  res.json({
    message: 'En producción, aquí se descargaría el archivo de audio',
    audio_id: audioId,
    note: 'Esta es una simulación. El archivo real se generaría con el servicio TTS real.'
  });
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Archivo demasiado grande (máximo 50MB)'
      });
    }
  }
  
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    available_endpoints: [
      'GET /',
      'GET /health',
      'POST /tts/clone-voice',
      'POST /tts/generate',
      'GET /tts/voices'
    ]
  });
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Book-Voice TTS Server corriendo en puerto ${PORT}`);
  console.log(`📡 Servidor disponible en: http://localhost:${PORT}`);
  console.log(`💻 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
