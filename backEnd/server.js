const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CORS corregido - acepta múltiples orígenes
const allowedOrigins = [
  'https://etiquetflash.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (mobile apps, curl, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// Configuración de tamaños
const SIZES = {
  letter: { width: 612, height: 792 },
  etiquetaExhibicion: { width: 180, height: 240 },
  etiquetaStock: { width: 250, height: 160 }
};

// ✅ Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: '🚀 Backend de Etiquetas Flash funcionando',
    endpoints: [
      '/api/health',
      '/api/etiquetas/exhibicion',
      '/api/etiquetas/stock'
    ]
  });
});

// Endpoint para generar PDF de Exhibición
app.post('/api/etiquetas/exhibicion', async (req, res) => {
  try {
    const { titulo, especificaciones, cantidad } = req.body;
    
    console.log('📦 Generando PDF Exhibición:', { titulo, cantidad });
    
    const doc = new PDFDocument({ size: 'LETTER', margin: 20 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-exhibicion-${Date.now()}.pdf`);
    doc.pipe(res);

    const etiquetaWidth = SIZES.etiquetaExhibicion.width;
    const etiquetaHeight = SIZES.etiquetaExhibicion.height;
    const margin = 20;
    const spacing = 15;

    const cols = Math.floor((SIZES.letter.width - 2 * margin) / (etiquetaWidth + spacing));
    const rows = Math.floor((SIZES.letter.height - 2 * margin) / (etiquetaHeight + spacing));
    const etiquetasPorPagina = cols * rows;

    let currentX = margin;
    let currentY = margin;
    let etiquetasEnPagina = 0;

    for (let i = 0; i < cantidad; i++) {
      if (etiquetasEnPagina >= etiquetasPorPagina) {
        doc.addPage();
        currentX = margin;
        currentY = margin;
        etiquetasEnPagina = 0;
      }

      doc.rect(currentX, currentY, etiquetaWidth, etiquetaHeight).stroke('#CCCCCC');

      doc.font('Helvetica-Bold')
        .fontSize(24)
        .fillColor('#EF4444')
        .text(titulo, currentX + 10, currentY + 20, {
          width: etiquetaWidth - 20,
          align: 'center'
        });

      let specY = currentY + 60;
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#3B82F6');

      especificaciones.forEach((espec) => {
        doc.text(`• ${espec}`, currentX + 15, specY, { width: etiquetaWidth - 30 });
        specY += 20;
      });

      currentX += etiquetaWidth + spacing;
      etiquetasEnPagina++;

      if (etiquetasEnPagina % cols === 0) {
        currentX = margin;
        currentY += etiquetaHeight + spacing;
      }
    }

    doc.end();
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});

// Endpoint para generar PDF de Stock
app.post('/api/etiquetas/stock', async (req, res) => {
  try {
    const { precioOriginal, precioDescuento, logo, cantidad } = req.body;
    
    console.log('📦 Generando PDF Stock:', { precioOriginal, precioDescuento, cantidad });
    
    if (!logo) {
      return res.status(400).json({ error: 'Se requiere un logo' });
    }

    const doc = new PDFDocument({ size: 'LETTER', margin: 20 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=etiquetas-stock-${Date.now()}.pdf`);
    doc.pipe(res);

    const etiquetaWidth = SIZES.etiquetaStock.width;
    const etiquetaHeight = SIZES.etiquetaStock.height;
    const margin = 20;
    const spacing = 15;

    const cols = Math.floor((SIZES.letter.width - 2 * margin) / (etiquetaWidth + spacing));
    const rows = Math.floor((SIZES.letter.height - 2 * margin) / (etiquetaHeight + spacing));
    const etiquetasPorPagina = cols * rows;

    let currentX = margin;
    let currentY = margin;
    let etiquetasEnPagina = 0;

    const logoBase64 = logo.replace(/^data:image\/\w+;base64,/, '');
    const logoBuffer = Buffer.from(logoBase64, 'base64');

    for (let i = 0; i < cantidad; i++) {
      if (etiquetasEnPagina >= etiquetasPorPagina) {
        doc.addPage();
        currentX = margin;
        currentY = margin;
        etiquetasEnPagina = 0;
      }

      const centerX = currentX + etiquetaWidth / 2;
      const centerY = currentY + etiquetaHeight / 2;

      doc.ellipse(centerX, centerY, etiquetaWidth / 2, etiquetaHeight / 2)
        .lineWidth(3)
        .stroke('#000000');

      try {
        doc.image(logoBuffer, currentX + 30, currentY + 20, { 
          fit: [50, 50], 
          align: 'center' 
        });
      } catch (err) {
        console.warn('⚠️ Error cargando logo:', err.message);
        doc.font('Helvetica-Bold')
          .fontSize(40)
          .fillColor('#EF4444')
          .text('+', currentX + 35, currentY + 25);
      }

      doc.font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#666666')
        .text('De:', currentX + 90, currentY + 30);
      
      doc.fontSize(16)
        .fillColor('#EF4444')
        .text(`$${precioOriginal}`, currentX + 90, currentY + 45);
      
      doc.moveTo(currentX + 88, currentY + 53)
        .lineTo(currentX + 165, currentY + 53)
        .stroke('#EF4444');

      const boxY = currentY + 75;
      const boxWidth = 140;
      const boxHeight = 60;

      doc.rect(currentX + 55, boxY, boxWidth, boxHeight)
        .lineWidth(4)
        .strokeColor('#22C55E')
        .fillColor('#F0FDF4')
        .fillAndStroke();
      
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#000000')
        .text('A:', currentX + 65, boxY + 8);
      
      doc.fontSize(32)
        .fillColor('#22C55E')
        .text(`$${precioDescuento}`, currentX + 60, boxY + 22, { 
          width: boxWidth - 10, 
          align: 'center' 
        });

      currentX += etiquetaWidth + spacing;
      etiquetasEnPagina++;

      if (etiquetasEnPagina % cols === 0) {
        currentX = margin;
        currentY += etiquetaHeight + spacing;
      }
    }

    doc.end();
  } catch (error) {
    console.error('❌ Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Backend funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint no encontrado',
    path: req.path 
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Backend corriendo en puerto ${PORT}`);
  console.log(`📍 Endpoints disponibles:`);
  console.log(`   GET  /api/health`);
  console.log(`   POST /api/etiquetas/exhibicion`);
  console.log(`   POST /api/etiquetas/stock`);
});

