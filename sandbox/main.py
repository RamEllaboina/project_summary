from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import subprocess
import tempfile
import json
from datetime import datetime
import base64

app = Flask(__name__)
CORS(app)

@app.route('/api/run', methods=['POST'])
def run_code():
    """Execute code in sandbox virtually without storing files"""
    try:
        project_id = request.form.get('projectId', 'unknown')
        
        print(f"[SANDBOX] Virtual execution for project: {project_id}")
        
        # Create temporary directory in memory (tempfile automatically cleans up)
        with tempfile.TemporaryDirectory() as temp_dir:
            results = []
            
            # Process files from form data virtually
            for key in request.files:
                file = request.files[key]
                if file.filename:
                    # Read file content into memory
                    file_content = file.read().decode('utf-8')
                    
                    # Create temporary file only for execution
                    temp_file_path = os.path.join(temp_dir, file.filename)
                    with open(temp_file_path, 'w', encoding='utf-8') as temp_file:
                        temp_file.write(file_content)
                    
                    # Execute if it's a runnable file
                    if file.filename.endswith(('.js', '.py', '.html', '.java', '.cpp')):
                        result = execute_file_virtual(temp_file_path, temp_dir, file.filename, file_content)
                        results.append(result)
            
            # Create preview data
            preview_data = {
                "status": "success",
                "projectId": project_id,
                "timestamp": datetime.now().isoformat(),
                "files": results,
                "preview": generate_preview(results),
                "executionType": "virtual"
            }
            
            return jsonify(preview_data)
            
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e),
            "projectId": project_id
        }), 500

def execute_file_virtual(temp_file_path, temp_dir, filename, file_content):
    """Execute a single file virtually and capture output"""
    result = {
        "file": filename,
        "output": "",
        "error": "",
        "exitCode": 0,
        "executionTime": 0,
        "contentPreview": file_content[:500] + "..." if len(file_content) > 500 else file_content
    }
    
    try:
        start_time = datetime.now()
        
        if filename.endswith('.py'):
            # Execute Python file virtually
            process = subprocess.run(
                ['python', temp_file_path],
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=10
            )
            result["output"] = process.stdout
            result["error"] = process.stderr
            result["exitCode"] = process.returncode
            
        elif filename.endswith('.js'):
            # Execute JavaScript file virtually
            process = subprocess.run(
                ['node', temp_file_path],
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=10
            )
            result["output"] = process.stdout
            result["error"] = process.stderr
            result["exitCode"] = process.returncode
            
        elif filename.endswith('.html'):
            # For HTML files, return the content as preview
            result["output"] = f"HTML Preview:\n{file_content}"
            result["exitCode"] = 0
            
        else:
            result["output"] = f"File type not supported for virtual execution: {filename}"
            result["exitCode"] = 1
        
        end_time = datetime.now()
        result["executionTime"] = (end_time - start_time).total_seconds()
        
    except subprocess.TimeoutExpired:
        result["error"] = "Virtual execution timed out (10s limit)"
        result["exitCode"] = 124
    except Exception as e:
        result["error"] = f"Virtual execution error: {str(e)}"
        result["exitCode"] = 1
    
    return result

def generate_preview(results):
    """Generate preview data for frontend from virtual execution"""
    preview = {
        "summary": {
            "totalFiles": len(results),
            "successful": sum(1 for r in results if r["exitCode"] == 0),
            "failed": sum(1 for r in results if r["exitCode"] != 0),
            "executionType": "virtual"
        },
        "outputs": [],
        "errors": [],
        "filePreviews": []
    }
    
    for result in results:
        # Add execution output
        if result["output"]:
            preview["outputs"].append({
                "file": result["file"],
                "content": result["output"][:500],  # Limit output length
                "executionTime": result.get("executionTime", 0)
            })
        
        # Add errors
        if result["error"]:
            preview["errors"].append({
                "file": result["file"],
                "error": result["error"]
            })
        
        # Add file content preview
        if "contentPreview" in result:
            preview["filePreviews"].append({
                "file": result["file"],
                "preview": result["contentPreview"]
            })
    
    return preview

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "Sandbox Execution Service",
        "version": "1.0"
    })

if __name__ == '__main__':
    port = int(os.getenv('SANDBOX_PORT', 4000))
    print(f"🚀 Starting Sandbox Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
