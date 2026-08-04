from models import EvaluationInput

def format_evaluation_prompt(data: EvaluationInput) -> str:
    """
    Constructs a structured prompt for LLM to evaluate software project.
    """
    
    # Prepare context
    project_summary = f"Language: {data.language}\nProject Type: {data.metrics.get('projectType', 'Unknown')}\n"
    
    # Get metrics for better context
    metrics = data.metrics
    project_type = metrics.get('projectType', 'Unknown')
    total_files = metrics.get('totalFiles', 0)
    total_lines = metrics.get('totalLines', 0)
    
    if data.readme and len(data.readme) > 0:
        project_summary += f"README Summary:\n{data.readme[:1500]}...\n"
    
    metrics_summary = f"""
Project Metrics:
- Total Files: {total_files}
- Total Lines of Code: {total_lines}
- Project Type: {project_type}
- Quality Score: {metrics.get('qualityScore', 0)}/100
- Structure Score: {metrics.get('structureScore', 0)}/100
- Security Score: {metrics.get('securityScore', 0)}/100
- Cyclomatic Complexity: {metrics.get('complexity', {}).get('average_cyclomatic_complexity', 0)}
"""
    
    files_content = ""
    for file in data.importantFiles[:5]:  # Limit to 5 files for context
        files_content += f"\nFile: {file.path}\nContent:\n{file.content[:1000]}\n"
    
    prompt = f"""
You are a senior software architect and product analyst with 20+ years of experience. Evaluate the following project with **specific, actionable insights**.

PROJECT INFO:
Project ID: {data.projectId}
{project_summary}
{metrics_summary}

CODE SAMPLES:
{files_content}

---
## 📋 CRITICAL INSTRUCTIONS:

1. **BE SPECIFIC**: Avoid generic statements like "Good code structure" or "Well organized". Instead, describe WHAT makes it good/bad with concrete examples.
2. **PROJECT DESCRIPTION**: Give a CLEAR, HUMAN-READABLE description of what this project actually DOES.
3. **INNOVATION**: Assess if this project solves a real problem in a novel way.
4. **AI SUMMARY**: Provide a comprehensive executive summary that captures the essence of the project.
5. **MUST INCLUDE**: Every field in the JSON must be filled. No empty strings or null values.

## 🎯 ANALYSIS FRAMEWORK:

### Innovation Assessment (MUST be detailed):
- Does this project solve a real-world problem?
- Is the approach novel or just a clone of existing projects?
- Would people actually pay for or use this?
- What makes this different from existing solutions?

### AI Summary (MUST be comprehensive):
- What is the project's main purpose?
- What are the key technical decisions?
- What is the overall quality assessment?
- What are the top recommendations?

## 📝 REQUIRED OUTPUT FORMAT (VALID JSON ONLY):

{{
  "projectId": "{data.projectId}",
  
  "summary": "A comprehensive 2-3 paragraph executive summary covering: purpose, architecture, quality, and 2-3 key recommendations. MUST be at least 100 characters.",

  "overview": "A 3-4 sentence comprehensive overview explaining what this project does, who it's for, and what problem it solves. MUST be at least 50 characters.",
  
  "architecture": "Specific analysis of the architecture - what patterns are used, how components interact, strengths and weaknesses of the approach.",
  
  "complexity": "Detailed complexity assessment - is it too complex? Too simple? What could be improved?",
  
  "security": "Specific security analysis - what vulnerabilities exist? What's done well?",
  
  "aiDetection": {{
    "level": "low|medium|high",
    "score": 0-10,
    "confidence": 0-1,
    "reasoning": "Specific reasons for the AI detection assessment",
    "signals": {{
      "ai_phrases": [],
      "naming_issues": [],
      "structure_patterns": [],
      "comment_analysis": "analysis of comment quality",
      "complexity_analysis": "analysis of code complexity"
    }}
  }},
  
  "innovation": {{
    "level": "low|medium|high",
    "score": 1-10,
    "projectDescription": "A CLEAR, SPECIFIC description of what this project IS and DOES. Example: 'A real-time collaborative code editor with AI-powered suggestions for developers'",
    "assessment": "Detailed innovation assessment - WHAT makes this innovative? WHY is it novel? WHAT problem does it solve in a new way?",
    "novelFeatures": ["Specific feature 1", "Specific feature 2", "Specific feature 3"],
    "marketImpact": "Specific analysis - who would use this? What's the market potential? Why would someone choose this?",
    "uniqueness": "What specifically makes this different from existing solutions? Name specific alternatives and how this is different."
  }},
  
  "realWorldReadiness": "Specific assessment of production readiness - what's needed to deploy this? Is it actually usable?",
  
  "strengths": {{
    "technical": ["Specific technical strength with context", "Another specific technical strength"],
    "architectural": ["Specific architectural strength with context"],
    "performance": ["Specific performance strength with context"]
  }},
  
  "weaknesses": {{
    "technical": ["Specific technical weakness with context and why it matters", "Another specific technical weakness"],
    "architectural": ["Specific architectural weakness with context"],
    "performance": ["Specific performance weakness with context"]
  }},
  
  "suggestions": {{
    "technical": ["Specific actionable technical suggestion", "Another specific actionable suggestion"],
    "architectural": ["Specific actionable architectural suggestion"],
    "performance": ["Specific actionable performance suggestion"]
  }}
}}

## 🎯 KEY REQUIREMENTS:
- **summary MUST be filled** - At least 3 sentences
- **innovation.projectDescription MUST be human-readable** - NEVER copy the project ID
- **innovation.assessment MUST be detailed** - At least 3 sentences explaining WHY this is innovative
- **innovation.novelFeatures MUST have at least 2 items**
- **innovation.marketImpact MUST be specific** - Who would use this?
- **innovation.uniqueness MUST be specific** - What makes this different?
- **Each strength/weakness MUST be specific** - Explain the WHY
- **Focus on quality over quantity** - 2-3 items per category, not 5-10

## ❌ AVOID:
- "Good code structure" → Instead: "Well-organized React components with clear separation between presentational and container components"
- "Well documented" → Instead: "Comprehensive README with setup instructions and API documentation"
- Empty or generic innovation assessments

Return ONLY the JSON object above. No explanations, no markdown.
"""
    return prompt.strip()


def format_chunk_evaluation_prompt(data: EvaluationInput) -> str:
    """
    Constructs a structured prompt for LLM to evaluate a chunk of a software project.
    """
    
    # Prepare context for chunk
    project_summary = f"Language: {data.language}\nProject Type: {data.metrics.get('projectType', 'Unknown')}\n"
    if data.readme:
        project_summary += f"README Summary:\n{data.readme[:500]}...\n"
    
    metrics_summary = str(data.metrics)[:400]

    files_content = ""
    for file in data.importantFiles[:3]:
        files_content += f"\nFile: {file.path}\nContent:\n{file.content[:800]}\n"
    
    prompt = f"""
You are a senior software architect analyzing a CHUNK of a larger software project. Provide focused insights on this specific code segment.

PROJECT INFO:
Project ID: {data.projectId}
{project_summary}
Metrics: {metrics_summary}

CODE CHUNK:
{files_content}

TASK: Analyze this code chunk and provide insights.

## 📝 REQUIRED OUTPUT FORMAT (VALID JSON ONLY):

{{
  "projectId": "{data.projectId}",
  "summary": "Brief summary of this code chunk's purpose and role in the larger project",
  "overview": "Brief description of what this code chunk does",
  "architecture": "Architecture patterns observed in this chunk",
  "complexity": "Complexity assessment for this chunk",
  "security": "Security issues found in this chunk",
  "aiDetection": {{
    "level": "low|medium|high",
    "score": 0-10,
    "confidence": 0-1,
    "reasoning": "AI detection reasoning for this chunk",
    "signals": {{
      "ai_phrases": [],
      "naming_issues": [],
      "structure_patterns": [],
      "comment_analysis": "analysis",
      "complexity_analysis": "analysis"
    }}
  }},
  "innovation": {{
    "level": "low|medium|high",
    "score": 1-10,
    "projectDescription": "What this code chunk does",
    "assessment": "Innovation assessment for this chunk",
    "novelFeatures": ["Feature 1", "Feature 2"],
    "marketImpact": "Potential impact of this chunk",
    "uniqueness": "What makes this chunk unique"
  }},
  "realWorldReadiness": "Readiness assessment for this chunk",
  "strengths": {{
    "technical": ["Strength 1", "Strength 2"],
    "architectural": ["Strength 1"],
    "performance": ["Strength 1"]
  }},
  "weaknesses": {{
    "technical": ["Weakness 1", "Weakness 2"],
    "architectural": ["Weakness 1"],
    "performance": ["Weakness 1"]
  }},
  "suggestions": {{
    "technical": ["Suggestion 1", "Suggestion 2"],
    "architectural": ["Suggestion 1"],
    "performance": ["Suggestion 1"]
  }}
}}

Return ONLY the JSON object above. No explanations, no markdown.
"""
    return prompt.strip()