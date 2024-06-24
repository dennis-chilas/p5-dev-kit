const sharp = require('sharp');
const fs = require('fs-extra');
const path = require('path');

// Pfad zum Eingabeordner
const inputDir = 'project/download';
// Pfad zum Ausgabeordner
const outputDir = 'project/download';

// Erstelle den Ausgabeordner, falls er nicht existiert
fs.ensureDirSync(outputDir);

// Funktion, um die Bilder zu verarbeiten
async function processImages() {
  // Lese alle Dateien im Eingabeordner
  const files = await fs.readdir(inputDir);

  // Iteriere über alle Dateien
  for (const file of files) {
    const inputFilePath = path.join(inputDir, file);
    const outputFilePath = path.join(outputDir, `${path.parse(file).name}_s.webp`);

    // Überprüfe, ob die Datei eine Bilddatei ist (optional: erweitere diesen Check)
    if (/\.(jpg|jpeg|png|tiff|bmp|gif)$/i.test(file)) {
      try {
        // Verkleinere das Bild auf 1000px Breite und speichere es als webp
        await sharp(inputFilePath)
          .resize({ width: 1000 })
          .toFormat('webp')
          .toFile(outputFilePath);

        console.log(`Verarbeitet: ${file}`);
      } catch (error) {
        console.error(`Fehler beim Verarbeiten von ${file}:`, error);
      }
    } else {
      console.log(`Übersprungen: ${file} (keine Bilddatei)`);
    }
  }
}

// Starte die Verarbeitung
processImages().then(() => {
  console.log('Alle Bilder wurden verarbeitet.');
}).catch(err => {
  console.error('Fehler bei der Verarbeitung der Bilder:', err);
});
