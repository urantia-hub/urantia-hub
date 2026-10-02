const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateIcons() {
  const svgPath = path.join(__dirname, '..', 'public', 'urantiahub-purple.svg');
  const outputDir = path.join(__dirname, '..', 'public');
  
  const svgBuffer = fs.readFileSync(svgPath);
  
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    
    await sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 226, g: 232, b: 240, alpha: 1 }
      })
      .png()
      .toFile(outputPath);
    
    console.log(`Generated ${outputPath}`);
  }
  
  // Generate apple-touch-icon (180x180)
  const appleTouchIconPath = path.join(outputDir, 'apple-touch-icon.png');
  await sharp(svgBuffer)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 226, g: 232, b: 240, alpha: 1 }
    })
    .png()
    .toFile(appleTouchIconPath);
  
  console.log(`Generated ${appleTouchIconPath}`);
  
  console.log('PWA icons generated successfully!');
}

generateIcons().catch(console.error);
