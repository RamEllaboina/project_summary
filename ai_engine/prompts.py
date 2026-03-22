from models import EvaluationInput

def format_evaluation_prompt(data: EvaluationInput) -> str:
    """
    Constructs a structured prompt for LLM to evaluate software project.
    """
    
    # Prepare context
    project_summary = f"Language: {data.language}\nProject Type: {data.metrics.get('projectType', 'Unknown')}\n"
    if data.readme:
        project_summary += f"README Summary:\n{data.readme[:1000]}...\n"  # Truncate readme if too long
    
    metrics_summary = str(data.metrics)[:800] # Truncate metrics if needed

    files_content = ""
    for file in data.importantFiles:
        files_content += f"\nFile: {file.path}\nContent:\n{file.content[:2000]}\n" # Limit per file content
    
    # Construct simplified prompt for better reliability
    prompt = f"""
You are a senior software architect evaluating a project. Analyze the provided code and generate a JSON response.

PROJECT INFO:
Project ID: {data.projectId}
{project_summary}
Metrics: {metrics_summary}

CODE SAMPLES:
{files_content}

TASK: Generate a comprehensive analysis with these specific fields:
1. overview - Brief project description (purpose, what it does)
2. architecture - Technical architecture and design patterns used
3. complexity - Code complexity assessment (simple, moderate, complex)
4. security - Security assessment and vulnerabilities
5. aiDetection - AI detection analysis text
6. innovation - Innovation level (low, medium, high) with score, assessment, and features
7. realWorldReadiness - Production readiness assessment
8. strengths - Categorized strengths (technical, architectural, performance)
9. weaknesses - Categorized weaknesses (technical, architectural, performance)
10. suggestions - Categorized suggestions (technical, architectural, performance)

CRITICAL: You MUST return EXACTLY this JSON structure. No other format allowed:
{{
  "projectId": "{data.projectId}",
  "overview": "Project overview text",
  "architecture": "Architecture assessment text", 
  "complexity": "Complexity assessment text",
  "security": "Security assessment text",
  "aiDetection": "AI detection analysis text",
  "innovation": {{
    "level": "low",
    "score": 3,
    "assessment": "Innovation assessment text",
    "novelFeatures": ["feature1", "feature2"]
  }},
  "realWorldReadiness": "Real-world readiness assessment text",
  "strengths": {{
    "technical": ["technical strength1", "technical strength2"],
    "architectural": ["architectural strength1", "architectural strength2"],
    "performance": ["performance strength1", "performance strength2"]
  }},
  "weaknesses": {{
    "technical": ["technical weakness1", "technical weakness2"],
    "architectural": ["architectural weakness1", "architectural weakness2"],
    "performance": ["performance weakness1", "performance weakness2"]
  }},
  "suggestions": {{
    "technical": ["technical suggestion1", "technical suggestion2"],
    "architectural": ["architectural suggestion1", "architectural suggestion2"],
    "performance": ["performance suggestion1", "performance suggestion2"]
  }}
}}

REQUIREMENTS:
- Return ONLY the JSON object above
- Do NOT include any explanations or markdown
- Do NOT change the field names
- Ensure all fields are present
- innovation.level must be "low", "medium", or "high"
- All arrays must contain at least one item
"""
    return prompt.strip()

def format_chunk_evaluation_prompt(data: EvaluationInput) -> str:
    """
    Constructs a structured prompt for LLM to evaluate a chunk of a software project.
    Used for chunk-based processing when input size exceeds token limits.
    """
    
    # Prepare context for chunk
    project_summary = f"Language: {data.language}\nProject Type: {data.metrics.get('projectType', 'Unknown')}\n"
    if data.readme:
        project_summary += f"README Summary:\n{data.readme[:500]}...\n"  # Shorter readme for chunks
    
    metrics_summary = str(data.metrics)[:400] # Shorter metrics for chunks

    files_content = ""
    for file in data.importantFiles:
        files_content += f"\nFile: {file.path}\nContent:\n{file.content[:1500]}\n" # Smaller limit per file for chunks
    
    # Construct chunk-specific prompt
    prompt = f"""
You are a senior software architect evaluating a CHUNK of a larger software project. Analyze the provided code segment and generate a JSON response.

PROJECT INFO:
Project ID: {data.projectId}
{project_summary}
Metrics: {metrics_summary}

CODE CHUNK SAMPLES:
{files_content}

TASK: Analyze this code chunk and provide insights. Focus on the specific files provided.

Generate analysis with these fields:
1. overview - Brief description of what this code chunk does
2. architecture - Architecture patterns used in this chunk
3. complexity - Code complexity assessment for this chunk
4. security - Security assessment for this chunk
5. aiDetection - AI detection analysis for this chunk
6. innovation - Innovation assessment for this chunk (level, score, assessment, features)
7. realWorldReadiness - Production readiness assessment for this chunk
8. strengths - Categorized strengths found in this chunk (technical, architectural, performance)
9. weaknesses - Categorized weaknesses found in this chunk (technical, architectural, performance)
10. suggestions - Categorized suggestions for this chunk (technical, architectural, performance)

CRITICAL: You MUST return EXACTLY this JSON structure. No other format allowed:
{{
  "projectId": "{data.projectId}",
  "overview": "Chunk overview text",
  "architecture": "Chunk architecture assessment text", 
  "complexity": "Chunk complexity assessment text",
  "security": "Chunk security assessment text",
  "aiDetection": "Chunk AI detection analysis text",
  "innovation": {{
    "level": "low",
    "score": 3,
    "assessment": "Chunk innovation assessment text",
    "novelFeatures": ["feature1", "feature2"]
  }},
  "realWorldReadiness": "Chunk real-world readiness assessment text",
  "strengths": {{
    "technical": ["technical strength1", "technical strength2"],
    "architectural": ["architectural strength1", "architectural strength2"],
    "performance": ["performance strength1", "performance strength2"]
  }},
  "weaknesses": {{
    "technical": ["technical weakness1", "technical weakness2"],
    "architectural": ["architectural weakness1", "architectural weakness2"],
    "performance": ["performance weakness1", "performance weakness2"]
  }},
  "suggestions": {{
    "technical": ["technical suggestion1", "technical suggestion2"],
    "architectural": ["architectural suggestion1", "architectural suggestion2"],
    "performance": ["performance suggestion1", "performance suggestion2"]
  }}
}}

REQUIREMENTS:
- Return ONLY the JSON object above
- Do NOT include any explanations or markdown
- Do NOT change the field names
- Ensure all fields are present
- innovation.level must be "low", "medium", or "high"
- All arrays must contain at least one item
- Focus analysis ONLY on the provided code chunk
"""
    return prompt.strip()
