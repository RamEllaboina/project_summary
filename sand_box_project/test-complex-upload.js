const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function uploadComplexProject() {
    const projectDir = path.join(__dirname, 'test-project-complex');
    const formData = new FormData();
    
    // Add all files from the complex test project
    function addFiles(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
            const itemPath = path.join(dir, item);
            const itemRelativePath = path.join(relativePath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                addFiles(itemPath, itemRelativePath);
            } else {
                formData.append('files', fs.createReadStream(itemPath), itemRelativePath);
            }
        });
    }
    
    addFiles(projectDir);
    
    try {
        const response = await fetch('http://localhost:4001/api/run', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });
        
        const text = await response.text();
        console.log('Raw Response:', text.substring(0, 500) + '...');
        
        const result = JSON.parse(text);
        console.log('Complex Project Analysis Result:');
        console.log(JSON.stringify(result, null, 2));
        
        // Show project structure specifically
        if (result.project_structure) {
            console.log('\n=== PROJECT STRUCTURE ANALYSIS ===');
            console.log('Total Files:', result.project_structure.totalFiles);
            console.log('Total Folders:', result.project_structure.totalFolders);
            console.log('UI Files:', result.project_structure.uiFiles.length);
            console.log('Frameworks:', result.project_structure.frameworks);
            console.log('Languages:', result.project_structure.languages);
            console.log('File Types:', result.project_structure.fileTypes);
        }
        
    } catch (error) {
        console.error('Upload failed:', error);
    }
}

uploadComplexProject();
