from models import EvaluationInput

def format_evaluation_prompt(data: EvaluationInput) -> str:
    """
    Constructs a structured prompt for LLM to evaluate software project.
    """
    metrics = data.metrics
    project_type = metrics.get('projectType', 'Unknown')
    total_files = metrics.get('totalFiles', 0)
    total_lines = metrics.get('totalLines', 0)
    
    # Extract detailed metrics safely with fallbacks
    quality_score = metrics.get('qualityScore', 0)
    structure_score = metrics.get('structureScore', 0)
    security_score = metrics.get('securityScore', 0)
    
    quality_assessment = metrics.get('qualityAssessment', 'Satisfactory')
    structure_assessment = metrics.get('structureAssessment', 'Satisfactory')
    security_assessment = metrics.get('securityAssessment', 'Satisfactory')
    
    comp_metrics = metrics.get('complexity', {})
    if hasattr(comp_metrics, 'dict'):
        comp_metrics = comp_metrics.dict()
        
    complexity_score = comp_metrics.get('average_cyclomatic_complexity', 0)
    maintainability_index = comp_metrics.get('maintainability_index', 0)
    complexity_assessment = metrics.get('complexityAssessment', 'Standard')
    maintainability_assessment = metrics.get('maintainabilityAssessment', 'Standard')
    
    issues = metrics.get('topIssues', [])
    issues_list = "\n".join(f"- {issue}" for issue in issues) if issues else "No critical issues detected."
    
    graph_metrics = metrics.get('graphrag', {})
    total_nodes = graph_metrics.get('totalNodes', 'N/A')
    total_edges = graph_metrics.get('totalEdges', 'N/A')
    hub_files = graph_metrics.get('hubFiles', 'N/A')
    isolated_count = graph_metrics.get('isolatedCount', 'N/A')
    
    coupling_score = graph_metrics.get('couplingScore', 'N/A')
    cohesion_score = graph_metrics.get('cohesionScore', 'N/A')
    max_depth = graph_metrics.get('maxDepth', 'N/A')
    circular_count = graph_metrics.get('circularCount', 'N/A')
    
    duplicate_percentage = metrics.get('duplicatePercentage', 'N/A')
    duplicate_blocks = metrics.get('duplicateBlocks', 'N/A')
    critical_files = graph_metrics.get('criticalFiles', 'N/A')
    patterns_detected = graph_metrics.get('patternsDetected', 'N/A')
    
    file_summaries = ""
    for file in data.importantFiles[:3]:
        content = file.content[:1000] if hasattr(file, 'content') else file.get('content', '')[:1000]
        path = file.path if hasattr(file, 'path') else file.get('path', 'unknown')
        file_summaries += f"\nFile: {path}\nContent:\n{content}\n"

    prompt = f"""You are a senior software architect evaluating a software project. Analyze the following project summary and GraphRAG insights to provide a comprehensive evaluation.

---

## 📋 PROJECT SUMMARY

**Project ID:** {data.projectId}
**Language:** {data.language}
**Project Type:** {project_type}
**Total Files:** {total_files}
**Total Lines of Code:** {total_lines}

---

## 📊 QUALITY METRICS (From Static Analysis)

| Metric | Score | Assessment |
|--------|-------|------------|
| **Quality Score** | {quality_score}/100 | {quality_assessment} |
| **Structure Score** | {structure_score}/100 | {structure_assessment} |
| **Security Score** | {security_score}/100 | {security_assessment} |
| **Complexity** | {complexity_score}/10 | {complexity_assessment} |
| **Maintainability** | {maintainability_index} | {maintainability_assessment} |

**Top Issues Found:**
{issues_list}

---

## 🕸️ GRAPHRAG INSIGHTS (Code Structure Analysis)

### Dependency Graph
- **Total Nodes:** {total_nodes} (Files + Functions + Classes)
- **Total Dependencies:** {total_edges} relationships
- **Hub Files (Most Connected):** {hub_files}
- **Isolated Files:** {isolated_count} files with no dependencies

### Architecture Health
- **Coupling Score:** {coupling_score}/10 (Lower = Better, means less interconnected)
- **Cohesion Score:** {cohesion_score}/10 (Higher = Better, means focused modules)
- **Maximum Dependency Depth:** {max_depth} levels
- **Circular Dependencies:** {circular_count} detected

### Code Quality Indicators
- **Duplicate Code:** {duplicate_percentage}% duplication across {duplicate_blocks} blocks
- **Critical Files:** {critical_files} (Changing these affects many others)
- **Design Patterns Detected:** {patterns_detected}

---

## 📄 KEY FILES (Summaries Only)

{file_summaries}

---

## 📝 TASK: Provide a Complete Project Evaluation

Based on the metrics and GraphRAG insights above, generate a JSON response with:

### 1. Executive Summary (2-3 paragraphs)
- What this project does
- Who it's for
- Overall quality assessment
- Key strengths and concerns

### 2. Architecture Assessment
- Architectural patterns used
- Strengths and weaknesses
- Scalability assessment

### 3. Code Quality Analysis
- Quality metrics interpretation
- Main issues and their impact
- Maintainability assessment

### 4. Security Assessment
- Key vulnerabilities found
- Security strengths
- Recommendations

### 5. Innovation Assessment
- **Level:** low/medium/high
- **Score:** 1-10
- **What makes it innovative:** (Be specific - is it solving a real problem in a new way?)
- **Novel Features:** List 2-3 specific innovative features
- **Market Impact:** Who would use this? What problem does it solve?
- **Uniqueness:** What makes it different from existing solutions?

### 6. AI Detection Analysis
- **Level:** low/medium/high (Probability of AI-generated code)
- **Score:** 0-10
- **Confidence:** 0.0-1.0
- **Reasoning:** Why do you think it's AI-generated or human-written?

### 7. Production Readiness
- What's needed to deploy this?
- Is it actually usable?
- What's missing?

### 8. Strengths & Weaknesses (2-3 EACH, BE SPECIFIC)
- Technical
- Architectural
- Performance

### 9. Actionable Suggestions (2-3 EACH)
- Technical improvements
- Architectural improvements
- Performance improvements

### 10. Complete Project Flow & Workflows
- What does this project do? (One sentence summary)
- Complete Workflow: trace from user interaction to final output with specific files.
- User Flow: what happens when user visits/clicks?
- Data Flow: how does data move through the system?
- All API Endpoints: list endpoints with method, path, purpose, file.
- Database Schema: collections and fields.
- Tech Stack: frontend, backend, tools employed.

---

## ⚠️ CRITICAL RULES

1. **BE SPECIFIC** - No generic statements like "Good code structure"
   - ✅ "Well-organized React components with clear separation between presentational and container components"
   - ❌ "Good code structure"

2. **BE CONCISE** - 2-3 items per category, not 5-10

3. **USE THE GRAPHRAG DATA** - Your analysis should reference the graph insights (coupling, cohesion, dependencies)

4. **PROJECT DESCRIPTION MUST BE HUMAN-READABLE** - Never copy the project ID

5. **INNOVATION ASSESSMENT MUST BE DETAILED** - Explain WHY it's innovative, not just "it's innovative"

6. **ALL FIELDS MUST BE PRESENT** - No empty arrays or null values

---

## 📤 OUTPUT FORMAT (VALID JSON ONLY)

```json
{{
  "projectId": "{data.projectId}",
  "summary": "Comprehensive 2-3 paragraph executive summary...",
  "overview": "3-4 sentence project description...",
  "architecture": "Architecture analysis...",
  "complexity": "Complexity assessment...",
  "security": "Security analysis...",
  "realWorldReadiness": "Production readiness assessment...",
  
  "innovation": {{
    "level": "high",
    "score": 8,
    "projectDescription": "A real-time collaborative code editor with AI-powered suggestions for developers",
    "assessment": "This project innovates by combining real-time collaboration with AI code suggestions...",
    "novelFeatures": ["Real-time collaboration", "AI-powered code suggestions", "Smart conflict resolution"],
    "marketImpact": "Targets the growing remote development market with unique AI features...",
    "uniqueness": "Unlike existing solutions, it integrates AI suggestions directly into the collaborative flow..."
  }},
  
  "aiDetection": {{
    "level": "low",
    "score": 2.5,
    "confidence": 0.85,
    "reasoning": "The code shows human-like patterns with natural variable names and organic structure...",
    "signals": {{
      "ai_phrases": [],
      "naming_issues": [],
      "structure_patterns": [],
      "comment_analysis": "Natural, context-appropriate comments",
      "complexity_analysis": "Balanced complexity with human-like variations"
    }}
  }},
  "strengths": {{
    "technical": [
      "Efficient React re-render optimization using useMemo hook in data-heavy components",
      "Consistent error handling with proper try-catch blocks across all async operations"
    ],
    "architectural": [
      "Clean separation between presentational and container components following React best practices"
    ],
    "performance": [
      "Lazy loading implemented for route-based code splitting reducing initial load time"
    ]
  }},
  
  "projectFlow": {{
    "projectName": "Extracted Project Name",
    "whatItDoes": "One sentence summary of the system.",
    "completeWorkflow": [
      {{"step": 1, "file": "main.py", "action": "Server starts up", "output": "API listens on port 8000"}},
      {{"step": 2, "file": "routes.py", "action": "Handles request", "output": "Returns JSON"}}
    ],
    "userFlow": {{
      "onVisit": {{"file": "index.html", "process": "Loads DOM", "response": "Shows dashboard"}},
      "onAction": {{"action": "Click submit", "file": "api.js", "process": "Posts data", "response": "Shows success alert"}}
    }},
    "dataFlow": "Client -> API Gateway -> Database -> Client",
    "apiEndpoints": [
      {{"method": "GET", "endpoint": "/api/users", "purpose": "Fetches users", "file": "users.js"}}
    ],
    "databaseSchema": {{
      "collections": [
        {{"name": "Users", "fields": ["id", "username", "email"], "purpose": "Store user accounts"}}
      ]
    }},
    "techStack": {{
      "frontend": ["React", "Tailwind"],
      "backend": ["Node.js", "Express"],
      "database": "MongoDB",
      "tools": ["Docker", "Jest"]
    }}
  }},
  
  "weaknesses": {{
    "technical": [
      "Missing input validation in login form making it vulnerable to injection attacks",
      "No unit tests covering critical business logic components"
    ],
    "architectural": [
      "Tight coupling between UI components and API layer reducing testability"
    ],
    "performance": [
      "Large bundle size due to missing tree-shaking configuration in webpack"
    ]
  }},
  
  "suggestions": {{
    "technical": [
      "Add Joi or Yup validation for all user inputs to prevent injection attacks",
      "Implement Jest unit tests with minimum 80% coverage for critical components"
    ],
    "architectural": [
      "Introduce a service layer between UI components and API calls to improve testability"
    ],
    "performance": [
      "Configure webpack with proper tree-shaking and bundle optimization settings"
    ]
  }}
}}
```
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
  }},
  "projectFlow": {{
    "projectName": "Extracted Project Name",
    "whatItDoes": "One sentence summary of the system.",
    "completeWorkflow": [
      {{"step": 1, "file": "main.py", "action": "Server starts up", "output": "API listens on port 8000"}}
    ],
    "userFlow": {{
      "onVisit": {{"file": "index.html", "process": "Loads DOM", "response": "Shows dashboard"}},
      "onAction": {{"action": "Click submit", "file": "api.js", "process": "Posts data", "response": "Shows success alert"}}
    }},
    "dataFlow": "Client -> API Gateway -> Database -> Client",
    "apiEndpoints": [
      {{"method": "GET", "endpoint": "/api/users", "purpose": "Fetches users", "file": "users.js"}}
    ],
    "databaseSchema": {{
      "collections": [
        {{"name": "Users", "fields": ["id", "username"], "purpose": "Store user accounts"}}
      ]
    }},
    "techStack": {{
      "frontend": ["React"],
      "backend": ["Node"],
      "database": "MongoDB",
      "tools": ["Docker"]
    }}
  }}
}}

Return ONLY the JSON object above. No explanations, no markdown.
"""
    return prompt.strip()