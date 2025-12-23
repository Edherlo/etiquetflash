const express = require('express');
const cors = require('cors');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configuración de tamaños (en puntos, 1 punto = 0.352778 mm)
const SIZES = {
  letter: { width: 612, height: 792 }, // 8.5" x 11"
  etiquetaExhibicion: { width: 180, height: 240 },
  etiquetaStock: { width: 250, height: 160 }
};

// Endpoint para generar PDF de Exhibición
app.post('/api/etiquetas/exhibicion', async (req, res) => {
  try {
    const { titulo, especificaciones, cantidad } = req.body;

    const doc = new PDFDocument({ 
      size: 'LETTER',
      margin: 20
    });

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

      doc.rect(currentX, currentY, etiquetaWidth, etiquetaHeight)
         .stroke('#CCCCCC');

      doc.font('Helvetica-Bold')
         .fontSize(24)
         .fillColor('#EF4444')
         .text(titulo, currentX + 10, currentY + 20, {
           width: etiquetaWidth - 20,
           align: 'center'
         });

      let specY = currentY + 60;
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#3B82F6');

      especificaciones.forEach((espec) => {
        doc.text(`• ${espec}`, currentX + 15, specY, {
          width: etiquetaWidth - 30
        });
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
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

// Endpoint ACTUALIZADO para generar PDF de Stock con Logo y Precios
app.post('/api/etiquetas/stock', async (req, res) => {
  try {
    const { precioOriginal, precioDescuento, logo, cantidad } = req.body;

    if (!logo) {
      return res.status(400).json({ error: 'Se requiere un logo' });
    }

    const doc = new PDFDocument({ 
      size: 'LETTER',
      margin: 20
    });

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

    // Convertir logo base64 a buffer
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

      // Óvalo (borde negro)
      doc.ellipse(centerX, centerY, etiquetaWidth / 2, etiquetaHeight / 2)
         .lineWidth(3)
         .stroke('#000000');

      // Logo en lugar de la cruz
      try {
        doc.image(logoBuffer, currentX + 30, currentY + 20, {
          fit: [50, 50],
          align: 'center'
        });
      } catch (err) {
        console.error('Error al insertar logo:', err);
        // Fallback: cruz roja si hay error
        doc.font('Helvetica-Bold')
           .fontSize(40)
           .fillColor('#EF4444')
           .text('+', currentX + 35, currentY + 25);
      }

      // Precio Original "De:" (más pequeño, tachado)
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#666666')
         .text('De:', currentX + 90, currentY + 30);

      doc.fontSize(16)
         .fillColor('#EF4444')
         .text(`$${precioOriginal}`, currentX + 90, currentY + 45);

      // Línea tachada sobre el precio original
      doc.moveTo(currentX + 88, currentY + 53)
         .lineTo(currentX + 165, currentY + 53)
         .stroke('#EF4444');

      // Precio Descuento "A:" (GRANDE Y LLAMATIVO)
      const boxY = currentY + 75;
      const boxWidth = 140;
      const boxHeight = 60;

      // Caja verde para el precio de descuento
      doc.rect(currentX + 55, boxY, boxWidth, boxHeight)
         .lineWidth(4)
         .strokeColor('#22C55E')
         .fillColor('#F0FDF4')
         .fillAndStroke();

      // Texto "A:"
      doc.font('Helvetica-Bold')
         .fontSize(14)
         .fillColor('#000000')
         .text('A:', currentX + 65, boxY + 8);

      // Precio en descuento (MUY GRANDE)
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
    console.error('Error generando PDF:', error);
    res.status(500).json({ error: 'Error al generar PDF' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend funcionando correctamente' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📄 Endpoints disponibles:`);
  console.log(`   POST http://localhost:${PORT}/api/etiquetas/exhibicion`);
  console.log(`   POST http://localhost:${PORT}/api/etiquetas/stock`);
});