const fs = require('fs');
const path = require('path');

const stylesDir = './src/styles';

// Get all CSS files
const cssFiles = fs.readdirSync(stylesDir).filter(f => f.endsWith('.css'));

cssFiles.forEach(file => {
    const filePath = path.join(stylesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace box-shadow with values to box-shadow: none
    content = content.replace(/box-shadow:\s*[0-9][^;]+;/g, 'box-shadow: none;');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Processed: ${file}`);
});

console.log('Done! All box-shadows removed from CSS files.');
