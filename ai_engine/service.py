import json
import logging
import re
import asyncio
from typing import Any, List, Dict
from collections import Counter

from models import EvaluationInput, EvaluationOutput
from llm_provider import get_llm_provider
from prompts import format_evaluation_prompt, format_chunk_evaluation_prompt
from config import Config
from ai_detection_service import get_ai_detection_service

# Setup logger
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class AIAnalysisService:
    def __init__(self):
        self.provider = get_llm_provider()
        self.max_retries = 3
        self.ai_detection_service = None  # Lazy initialization

    async def analyze_ai_generation(self, input_data: EvaluationInput) -> Dict[str, Any]:
        """
        Analyze code for AI generation using dedicated AI detection service.
        Uses secondary Groq API key when available.
        """
        logger.info(f"Starting AI generation analysis for project {input_data.projectId}")
        
        try:
            # Initialize AI detection service if not already done
            if self.ai_detection_service is None:
                self.ai_detection_service = get_ai_detection_service()
            
            # Convert important files to dict format if needed
            files = []
            if input_data.importantFiles:
                for file in input_data.importantFiles:
                    if hasattr(file, 'dict'):
                        files.append(file.dict())
                    elif isinstance(file, dict):
                        files.append(file)
                    else:
                        # Handle ImportantFile objects
                        files.append({
                            "path": getattr(file, 'path', 'unknown'),
                            "content": getattr(file, 'content', '')
                        })
            
            # Perform AI detection analysis
            ai_detection_result = await self.ai_detection_service.analyze_code_for_ai_signals(
                files, input_data.projectId
            )
            
            logger.info(f"AI generation analysis completed for project {input_data.projectId}")
            return ai_detection_result
            
        except Exception as e:
            logger.error(f"AI generation analysis failed: {str(e)}")
            return {
                "projectId": input_data.projectId,
                "error": str(e),
                "aiDetection": {
                    "level": "low",
                    "score": 0,
                    "confidence": 0,
                    "reasoning": f"Analysis failed: {str(e)}",
                    "signals": {}
                }
            }

    async def evaluate_project(self, input_data: EvaluationInput) -> EvaluationOutput:
        """
        Evaluates a software project using configured LLM provider.
        Dynamically switches between normal and chunk-based processing based on input size.
        """

        # Validate input
        if not input_data.projectId:
            raise ValueError("Project ID is required.")

        # Estimate token count
        estimated_tokens = self._estimate_tokens(input_data)
        logger.info(f"Estimated tokens: {estimated_tokens} for project {input_data.projectId}")

        try:
            if estimated_tokens <= 3000:
                # Normal processing for small projects
                logger.info(f"Using normal processing mode (≤3000 tokens)")
                response_data = await self._process_single_chunk(input_data)
            else:
                # Chunk-based processing for large projects
                logger.info(f"Using chunk-based processing mode (>3000 tokens)")
                response_data = await self._process_chunks(input_data)

            # Ensure response is dict
            response_data = self._safe_parse_response(response_data)

            # Fix hallucinated projectId
            response_data["projectId"] = input_data.projectId

            # Use dedicated AI detection service for enhanced analysis
            if "importantFiles" in input_data.dict() and input_data.importantFiles:
                try:
                    # Get AI detection analysis from dedicated service
                    ai_detection_result = await self.analyze_ai_generation(input_data)
                    
                    # Merge AI detection results with main evaluation
                    if ai_detection_result and "aiDetection" in ai_detection_result:
                        # Use the dedicated AI detection results
                        ai_data = ai_detection_result["aiDetection"]
                        
                        # Convert arrays to strings for compatibility with main model
                        signals = ai_data.get("signals", {})
                        converted_signals = {}
                        for key, value in signals.items():
                            if isinstance(value, list):
                                # Convert array to comma-separated string
                                converted_signals[key] = ", ".join(value) if value else ""
                            else:
                                converted_signals[key] = value
                        
                        ai_data["signals"] = converted_signals
                        response_data["aiDetection"] = ai_data
                        logger.info(f"Enhanced AI detection completed: {ai_data.get('level', 'unknown')}")
                    else:
                        # Fallback to local analysis
                        response_data["aiDetection"] = self._enhance_ai_detection(
                            response_data.get("aiDetection", ""),
                            input_data.importantFiles,
                            input_data
                        )
                except Exception as e:
                    logger.warning(f"AI detection service failed, using fallback: {str(e)}")
                    # Fallback to local analysis
                    response_data["aiDetection"] = self._enhance_ai_detection(
                        response_data.get("aiDetection", ""),
                        input_data.importantFiles,
                        input_data
                    )
            else:
                # Convert old format to new if needed
                response_data["aiDetection"] = self._create_ai_detection_object(
                    response_data.get("aiDetection", "Analysis unavailable")
                )

            # Validate with Pydantic
            output = EvaluationOutput(**response_data)
            
            # Ensure summary is generated from overview if missing
            if not output.summary and output.overview:
                output.summary = output.overview[:200] + "..." if len(output.overview) > 200 else output.overview

            logger.info(f"Successfully evaluated project {input_data.projectId}")
            return output

        except Exception as e:
            logger.error(f"Evaluation failed: {str(e)}")
            return self._get_fallback_response(input_data.projectId, str(e))

    # ===============================
    # RETRY LOGIC
    # ===============================
    async def _call_with_retry(self, prompt: str) -> Any:
        last_error = None

        for attempt in range(self.max_retries):
            try:
                return await self.provider.evaluate_project(prompt)

            except Exception as e:
                last_error = e
                logger.warning(f"⚠️ Attempt {attempt + 1} failed: {str(e)}")
                
                # Check for rate limiting and add longer delays
                if "429" in str(e) or "Too Many Requests" in str(e):
                    if attempt < self.max_retries - 1:
                        # Exponential backoff for rate limiting
                        delay = 15 * (attempt + 1)  # 15, 30, 45 seconds
                        logger.info(f"Rate limiting detected, waiting {delay} seconds before retry...")
                        await asyncio.sleep(delay)
                        continue
                
                # For other errors, use shorter delays
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)  # 2, 4, 8 seconds

        raise Exception(f"All retries failed: {str(last_error)}")

    # ===============================
    # SAFE PARSING
    # ===============================
    def _safe_parse_response(self, response_data: Any) -> dict:
        """
        Ensures LLM response is valid JSON dict.
        """

        # Case 1: Already dict
        if isinstance(response_data, dict):
            # Convert old structure to new if needed
            return self._fix_response_structure(response_data)

        # Case 2: String → Try JSON parse
        if isinstance(response_data, str):
            try:
                parsed = json.loads(response_data)
                if isinstance(parsed, dict):
                    return self._fix_response_structure(parsed)
            except json.JSONDecodeError:
                pass

        raise ValueError("Invalid response format from LLM (not JSON/dict)")

    def _fix_response_structure(self, data: dict) -> dict:
        """
        Fix response structure to match frontend expectations.
        Convert old 'points' format to new 'technical/architectural/performance' format.
        """
        
        # Fix strengths
        if 'strengths' in data:
            if isinstance(data['strengths'], dict):
                if 'points' in data['strengths']:
                    # Convert points array to categorized structure
                    points = data['strengths']['points']
                    data['strengths'] = {
                        'technical': points[:len(points)//3 or 1],
                        'architectural': points[len(points)//3:2*len(points)//3 or 1],
                        'performance': points[2*len(points)//3:] or [points[0]] if points else []
                    }
            elif isinstance(data['strengths'], list):
                data['strengths'] = {
                    'technical': data['strengths'][:len(data['strengths'])//3 or 1],
                    'architectural': data['strengths'][len(data['strengths'])//3:2*len(data['strengths'])//3 or 1],
                    'performance': data['strengths'][2*len(data['strengths'])//3:] or [data['strengths'][0]] if data['strengths'] else []
                }
            else:
                # Ensure proper structure
                data['strengths'] = {
                    'technical': [],
                    'architectural': [],
                    'performance': []
                }

        # Fix weaknesses
        if 'weaknesses' in data:
            if isinstance(data['weaknesses'], dict):
                if 'points' in data['weaknesses']:
                    # Convert points array to categorized structure
                    points = data['weaknesses']['points']
                    data['weaknesses'] = {
                        'technical': points[:len(points)//3 or 1],
                        'architectural': points[len(points)//3:2*len(points)//3 or 1],
                        'performance': points[2*len(points)//3:] or [points[0]] if points else []
                    }
            elif isinstance(data['weaknesses'], list):
                data['weaknesses'] = {
                    'technical': data['weaknesses'][:len(data['weaknesses'])//3 or 1],
                    'architectural': data['weaknesses'][len(data['weaknesses'])//3:2*len(data['weaknesses'])//3 or 1],
                    'performance': data['weaknesses'][2*len(data['weaknesses'])//3:] or [data['weaknesses'][0]] if data['weaknesses'] else []
                }
            else:
                # Ensure proper structure
                data['weaknesses'] = {
                    'technical': [],
                    'architectural': [],
                    'performance': []
                }

        # Fix suggestions
        if 'suggestions' in data:
            if isinstance(data['suggestions'], dict):
                if 'points' in data['suggestions']:
                    # Convert points array to categorized structure
                    points = data['suggestions']['points']
                    data['suggestions'] = {
                        'technical': points[:len(points)//3 or 1],
                        'architectural': points[len(points)//3:2*len(points)//3 or 1],
                        'performance': points[2*len(points)//3:] or [points[0]] if points else []
                    }
            elif isinstance(data['suggestions'], list):
                data['suggestions'] = {
                    'technical': data['suggestions'][:len(data['suggestions'])//3 or 1],
                    'architectural': data['suggestions'][len(data['suggestions'])//3:2*len(data['suggestions'])//3 or 1],
                    'performance': data['suggestions'][2*len(data['suggestions'])//3:] or [data['suggestions'][0]] if data['suggestions'] else []
                }
            else:
                # Ensure proper structure
                data['suggestions'] = {
                    'technical': [],
                    'architectural': [],
                    'performance': []
                }

        return data

    # ===============================
    # AI DETECTION ENHANCEMENT
    # ===============================
    def _enhance_ai_detection(self, existing_detection: Any, important_files: List[Dict], input_data: EvaluationInput) -> Dict:
        """Enhance AI detection with local code analysis."""
        
        # Initialize signals
        signals = {
            "repetition": "low",
            "naming": "good",
            "comments": "balanced",
            "structure": "moderate",
            "consistency": "high"
        }
        
        # Analyze code samples
        all_code = ""
        naming_patterns = []
        comment_patterns = []
        structure_patterns = []
        repetition_score = 0
        ai_phrase_score = 0
        
        for file in important_files:
            if "content" in file and file["content"]:
                content = file["content"]
                all_code += content + "\n"
                
                # Check naming quality
                naming_patterns.extend(re.findall(r'(?:function|const|let|var|def|class)\s+([a-zA-Z_][a-zA-Z0-9_]*)', content))
                
                # Check comments
                comments = re.findall(r'(?:#|//|/\*|<!--).*?(?:\*/|-->|$)', content, re.DOTALL)
                comment_patterns.extend(comments)
                
                # Check structure depth
                indent_levels = re.findall(r'^\s+', content, re.MULTILINE)
                structure_patterns.extend([len(level) for level in indent_levels if level])
                
                # Check for repetitions (similar lines)
                lines = [line.strip() for line in content.split('\n') if line.strip()]
                line_counter = Counter(lines)
                repetitions = sum(count - 1 for count in line_counter.values() if count > 1)
                repetition_score += repetitions
                
                # Check for AI-like phrases
                ai_phrases = [
                    "generated by", "created by ai", "chatgpt", "claude",
                    "as an ai", "as an ai assistant", "i am an ai",
                    "i don't have access to", "i cannot provide"
                ]
                for phrase in ai_phrases:
                    if phrase.lower() in content.lower():
                        ai_phrase_score += 1
        
        # Analyze signals
        if naming_patterns:
            # Check naming consistency
            avg_name_length = sum(len(name) for name in naming_patterns) / len(naming_patterns)
            if avg_name_length < 4:
                signals["naming"] = "poor"
            elif avg_name_length < 8:
                signals["naming"] = "moderate"
        
        if comment_patterns:
            # Check comment patterns
            comment_ratio = len(comment_patterns) / len(all_code.split('\n')) if all_code else 0
            if comment_ratio > 0.3:
                signals["comments"] = "over-documented"
            elif comment_ratio < 0.05:
                signals["comments"] = "missing"
        
        if structure_patterns:
            # Check structure complexity
            avg_indent = sum(structure_patterns) / len(structure_patterns)
            if avg_indent < 2:
                signals["structure"] = "simple"
            elif avg_indent > 8:
                signals["structure"] = "complex"
        
        # Check repetition
        if repetition_score > len(important_files) * 5:
            signals["repetition"] = "high"
        elif repetition_score > len(important_files) * 2:
            signals["repetition"] = "medium"
        
        # Calculate AI detection score
        score = 0
        
        # Poor naming suggests AI
        if signals["naming"] == "poor":
            score += 2
        elif signals["naming"] == "moderate":
            score += 1
        
        # Over-commenting suggests AI
        if signals["comments"] == "over-documented":
            score += 2
        elif signals["comments"] == "missing":
            score += 1
        
        # Simple structure suggests AI
        if signals["structure"] == "simple":
            score += 1.5
        
        # High repetition suggests AI
        if signals["repetition"] == "high":
            score += 1.5
        
        elif signals["repetition"] == "medium":
            score += 1
        
        # Low consistency suggests AI
        if signals["consistency"] == "low":
            score += 1.5
        
        # AI phrases
        score += ai_phrase_score
        
        # Normalize score to 0-10
        score = min(10, max(0, score))
        
        # Determine level
        if score >= 7:
            level = "high"
        elif score >= 4:
            level = "medium"
        else:
            level = "low"
        
        # Calculate confidence
        confidence = 0.7  # Base confidence
        if len(important_files) > 10:
            confidence += 0.2
        if ai_phrase_score > 0:
            confidence += 0.1
        confidence = min(0.95, confidence)
        
        # Generate reasoning
        reasoning = self._generate_ai_reasoning(score, signals, ai_phrase_score)
        
        # If existing detection is a string, use our analysis
        if isinstance(existing_detection, str):
            return {
                "level": level,
                "score": round(score, 1),
                "confidence": round(confidence, 2),
                "reasoning": reasoning,
                "signals": signals
            }
        
        # If existing detection is already a dict, merge with our analysis
        if isinstance(existing_detection, dict):
            # Preserve LLM's judgment but blend with our analysis
            llm_level = existing_detection.get("level", level)
            llm_score = existing_detection.get("score", score)
            
            # Average the scores if both exist
            if isinstance(llm_score, (int, float)):
                score = (score + llm_score) / 2
            
            return {
                "level": level,
                "score": round(score, 1),
                "confidence": round(confidence, 2),
                "reasoning": reasoning,
                "signals": signals
            }
        
        # Default to our analysis
        return {
            "level": level,
            "score": round(score, 1),
            "confidence": round(confidence, 2),
            "reasoning": reasoning,
            "signals": signals
        }

    def _create_ai_detection_object(self, detection_string: str) -> Dict:
        """Convert old string format to new object format."""
        
        # Try to parse meaning from string
        detection_lower = detection_string.lower()
        
        if "high" in detection_lower:
            level = "high"
            score = 8
        elif "medium" in detection_lower or "moderate" in detection_lower:
            level = "medium"
            score = 5
        elif "low" in detection_lower:
            level = "low"
            score = 2
        else:
            level = "low"
            score = 1
        
        return {
            "level": level,
            "score": score,
            "confidence": 0.5,
            "reasoning": detection_string,
            "signals": {
                "repetition": "medium",
                "naming": "moderate",
                "comments": "balanced",
                "structure": "moderate",
                "consistency": "medium"
            }
        }

    def _generate_ai_reasoning(self, score: float, signals: Dict, ai_phrase_score: int) -> str:
        """Generate reasoning text based on analysis."""
        
        reasons = []
        
        if signals["repetition"] == "high":
            reasons.append("high code repetition patterns")
        elif signals["repetition"] == "medium":
            reasons.append("some repetitive code")
        
        if signals["naming"] == "poor":
            reasons.append("inconsistent naming conventions")
        elif signals["naming"] == "moderate":
            reasons.append("acceptable but not excellent naming")
        
        if signals["comments"] == "over-documented":
            reasons.append("excessive commenting")
        elif signals["comments"] == "missing":
            reasons.append("lack of comments")
        
        if signals["structure"] == "simple":
            reasons.append("basic code structure")
        
        if signals["consistency"] == "low":
            reasons.append("inconsistent patterns across files")
        
        if ai_phrase_score > 0:
            reasons.append("contains AI-generated phrases")
        
        if not reasons:
            if score < 3:
                return "Code shows natural human patterns with good naming and structure"
            else:
                return "Mixed signals but overall appears human-written"
        
        reason_text = ", ".join(reasons[:-1]) + (" and " + reasons[-1] if len(reasons) > 1 else reasons[0])
        
        if score >= 7:
            return f"Strong indicators of AI generation: {reason_text}"
        elif score >= 4:
            return f"Some AI-like patterns detected: {reason_text}"
        else:
            return f"Minimal AI indicators: {reason_text}"

    # ===============================
    # FALLBACK RESPONSE
    # ===============================
    def _get_fallback_response(self, project_id: str, error_message: str) -> EvaluationOutput:
        """
        Return a valid response when analysis fails.
        """

        return EvaluationOutput(
            projectId=project_id,
            overview="Unable to analyze project due to a temporary issue. Please try again.",
            architecture="Analysis unavailable",
            complexity="Analysis unavailable",
            security="Analysis unavailable",
            aiDetection={
                "level": "low",
                "score": 0,
                "confidence": 0,
                "reasoning": "Analysis unavailable due to system error",
                "signals": {
                    "repetition": "low",
                    "naming": "moderate",
                    "comments": "balanced",
                    "structure": "moderate",
                    "consistency": "medium"
                }
            },
            innovation={
                "level": "low",
                "score": 1,
                "assessment": "Analysis unavailable",
                "novelFeatures": []
            },
            realWorldReadiness="Analysis unavailable",
            strengths={
                "technical": ["Analysis could not be completed"],
                "architectural": [],
                "performance": []
            },
            weaknesses={
                "technical": [f"System error: {error_message}"],
                "architectural": [],
                "performance": []
            },
            suggestions={
                "technical": [
                    "Retry after some time",
                    "Check API configuration",
                    "Verify model availability"
                ],
                "architectural": [],
                "performance": []
            }
        )
    
    # ===============================
    # TOKEN ESTIMATION & CHUNKING
    # ===============================
    def _estimate_tokens(self, input_data: EvaluationInput) -> int:
        """
        Estimate total token count for the input data.
        Uses approximate method: characters ÷ 4.
        """
        total_chars = 0
        
        # Count characters from important files
        if input_data.importantFiles:
            for file in input_data.importantFiles:
                if hasattr(file, 'content') and file.content:
                    total_chars += len(file.content)
                if hasattr(file, 'summary') and file.summary:
                    total_chars += len(file.summary)
                # Handle dict-style access for backward compatibility
                if isinstance(file, dict):
                    if file.get("content"):
                        total_chars += len(file["content"])
                    if file.get("summary"):
                        total_chars += len(file["summary"])
        
        # Count characters from readme
        if input_data.readme:
            total_chars += len(input_data.readme)
        
        # Count characters from metrics
        if input_data.metrics:
            if hasattr(input_data.metrics, 'dict'):
                metrics_str = str(input_data.metrics.dict())
            else:
                metrics_str = str(input_data.metrics)
            total_chars += len(metrics_str)
        
        # Count other fields
        if input_data.language:
            total_chars += len(input_data.language)
        
        # Add some overhead for prompt structure
        total_chars += 1000  # Approximate prompt template size
        
        # Convert to tokens (approximately 4 characters per token)
        estimated_tokens = total_chars // 4
        
        logger.info(f"Token estimation: {total_chars} chars → ~{estimated_tokens} tokens")
        return estimated_tokens
    
    async def _process_single_chunk(self, input_data: EvaluationInput) -> Any:
        """
        Process the entire input in a single API call.
        """
        # Use chunk prompt if this is a chunk (project ID contains "chunk")
        if "chunk" in input_data.projectId:
            prompt = format_chunk_evaluation_prompt(input_data)
        else:
            prompt = format_evaluation_prompt(input_data)
        return await self._call_with_retry(prompt)
    
    async def _process_chunks(self, input_data: EvaluationInput) -> Dict:
        """
        Process the input in chunks and aggregate results.
        """
        logger.info(f"Starting chunk-based processing for {input_data.projectId}")
        
        # Split files into chunks
        chunks = self._create_chunks(input_data.importantFiles)
        logger.info(f"Created {len(chunks)} chunks for processing")
        
        # Process each chunk
        chunk_results = []
        for i, chunk in enumerate(chunks):
            try:
                logger.info(f"Processing chunk {i+1}/{len(chunks)} with {len(chunk)} files")
                
                # Add delay between chunks to avoid rate limiting (except for first chunk)
                if i > 0:
                    delay = 3  # 3 second delay between chunks
                    logger.info(f"Waiting {delay} seconds to avoid rate limiting...")
                    await asyncio.sleep(delay)
                
                # Create chunk input data
                chunk_input = EvaluationInput(
                    projectId=f"{input_data.projectId}_chunk_{i+1}",
                    language=input_data.language,
                    metrics=input_data.metrics,
                    importantFiles=chunk,
                    readme=input_data.readme[:1000] if input_data.readme else ""  # Truncate readme for chunks
                )
                
                # Process chunk
                chunk_result = await self._process_single_chunk(chunk_input)
                
                # Ensure chunk result is dict
                if isinstance(chunk_result, str):
                    chunk_result = json.loads(chunk_result)
                
                chunk_results.append(chunk_result)
                logger.info(f"Chunk {i+1} processed successfully")
                
            except Exception as e:
                logger.warning(f"Chunk {i+1} failed: {str(e)}")
                # Continue with other chunks
                continue
        
        if not chunk_results:
            raise Exception("All chunks failed to process")
        
        logger.info(f"Aggregating results from {len(chunk_results)} chunks")
        return self._aggregate_chunk_results(chunk_results, input_data.projectId)
    
    def _create_chunks(self, important_files: List[Dict]) -> List[List[Dict]]:
        """
        Split important files into chunks that stay within Groq's token limits.
        Much more aggressive chunking for Groq's 6000 TPM limit.
        """
        if not important_files:
            return []
        
        chunks = []
        current_chunk = []
        current_tokens = 0
        MAX_TOKENS_PER_CHUNK = 2000  # Conservative limit for Groq (well under 6000)
        MAX_FILES_PER_CHUNK = 2      # Maximum 2 files per chunk
        
        for file in important_files:
            # Estimate tokens for this file
            file_tokens = 0
            if hasattr(file, 'content') and file.content:
                file_tokens += len(file.content) // 4
            if hasattr(file, 'summary') and file.summary:
                file_tokens += len(file.summary) // 4
            # Handle dict-style access for backward compatibility
            if isinstance(file, dict):
                if file.get("content"):
                    file_tokens += len(file["content"]) // 4
                if file.get("summary"):
                    file_tokens += len(file["summary"]) // 4
            
            # Add overhead for file metadata and prompt structure
            file_tokens += 500  # Increased overhead for prompt structure
            
            # If this single file is too large, split it further
            if file_tokens > MAX_TOKENS_PER_CHUNK:
                # Split large file into smaller chunks
                if hasattr(file, 'content') and file.content:
                    content_chunks = self._split_large_file_content(file, MAX_TOKENS_PER_CHUNK - 500)
                    for content_chunk in content_chunks:
                        chunks.append([content_chunk])
                elif isinstance(file, dict) and file.get("content"):
                    content_chunks = self._split_large_file_content(file, MAX_TOKENS_PER_CHUNK - 500)
                    for content_chunk in content_chunks:
                        chunks.append([content_chunk])
                continue
            
            # Check if adding this file would exceed safe limit or file count
            if (current_tokens + file_tokens > MAX_TOKENS_PER_CHUNK or 
                len(current_chunk) >= MAX_FILES_PER_CHUNK) and current_chunk:
                # Start new chunk
                chunks.append(current_chunk)
                current_chunk = [file]
                current_tokens = file_tokens
            else:
                # Add to current chunk
                current_chunk.append(file)
                current_tokens += file_tokens
                
                # Start new chunk if we have 2 files already
                if len(current_chunk) >= MAX_FILES_PER_CHUNK:
                    chunks.append(current_chunk)
                    current_chunk = []
                    current_tokens = 0
        
        # Add remaining files
        if current_chunk:
            chunks.append(current_chunk)
        
        logger.info(f"Created {len(chunks)} chunks with conservative limits: {[len(chunk) for chunk in chunks]} files per chunk")
        return chunks
    
    def _split_large_file_content(self, file: Dict, max_tokens: int) -> List[Dict]:
        """
        Split a large file's content into smaller chunks.
        """
        if hasattr(file, 'content'):
            content = file.content
            path = file.path
        elif isinstance(file, dict):
            content = file.get("content", "")
            path = file.get("path", "unknown")
        else:
            return [file]
        
        # Estimate tokens in content
        content_tokens = len(content) // 4
        
        if content_tokens <= max_tokens:
            return [file]
        
        # Split content into chunks
        chunks = []
        chunk_size = max_tokens * 4  # Convert back to characters
        
        for i in range(0, len(content), chunk_size):
            chunk_content = content[i:i + chunk_size]
            chunk_path = f"{path}_part_{i//chunk_size + 1}"
            
            if hasattr(file, 'content'):
                chunk_file = type(file)(path=chunk_path, content=chunk_content)
            else:
                chunk_file = {
                    "path": chunk_path,
                    "content": chunk_content
                }
            
            chunks.append(chunk_file)
        
        return chunks
    
    def _aggregate_chunk_results(self, chunk_results: List[Dict], project_id: str) -> Dict:
        """
        Aggregate results from multiple chunks into a final result.
        """
        logger.info(f"Aggregating {len(chunk_results)} chunk results")
        
        # Initialize aggregated result
        aggregated = {
            "projectId": project_id,
            "overview": "",
            "architecture": "",
            "complexity": "",
            "security": "",
            "aiDetection": {
                "level": "low",
                "score": 1.0,
                "confidence": 0.5,
                "reasoning": "",
                "signals": {
                    "repetition": "low",
                    "naming": "good",
                    "comments": "balanced",
                    "structure": "moderate",
                    "consistency": "high"
                }
            },
            "innovation": {
                "level": "low",
                "score": 3,
                "assessment": "",
                "novelFeatures": []
            },
            "realWorldReadiness": "",
            "strengths": {
                "technical": [],
                "architectural": [],
                "performance": []
            },
            "weaknesses": {
                "technical": [],
                "architectural": [],
                "performance": []
            },
            "suggestions": {
                "technical": [],
                "architectural": [],
                "performance": []
            }
        }
        
        # Aggregate overview, architecture, etc.
        overviews = []
        architectures = []
        complexities = []
        securities = []
        readiness_assessments = []
        
        # Collect innovation scores
        innovation_scores = []
        innovation_assessments = []
        
        # Collect AI detection data
        ai_levels = []
        ai_scores = []
        ai_confidences = []
        
        for i, result in enumerate(chunk_results):
            logger.info(f"Processing chunk {i+1} results")
            
            # Collect text fields
            if result.get("overview"):
                overviews.append(result["overview"])
            if result.get("architecture"):
                architectures.append(result["architecture"])
            if result.get("complexity"):
                complexities.append(result["complexity"])
            if result.get("security"):
                securities.append(result["security"])
            if result.get("realWorldReadiness"):
                readiness_assessments.append(result["realWorldReadiness"])
            
            # Collect innovation data
            innovation = result.get("innovation", {})
            if isinstance(innovation, dict) and "score" in innovation:
                innovation_scores.append(innovation["score"])
            if isinstance(innovation, dict) and "assessment" in innovation:
                innovation_assessments.append(innovation["assessment"])
            
            # Collect AI detection data
            ai_detection = result.get("aiDetection", {})
            if isinstance(ai_detection, dict):
                if ai_detection.get("level"):
                    ai_levels.append(ai_detection["level"])
                if ai_detection.get("score"):
                    ai_scores.append(ai_detection["score"])
                if ai_detection.get("confidence"):
                    ai_confidences.append(ai_detection["confidence"])
            
            # Aggregate strengths
            strengths = result.get("strengths", {})
            if isinstance(strengths, dict):
                for category in ["technical", "architectural", "performance"]:
                    if isinstance(strengths.get(category), list):
                        aggregated["strengths"][category].extend(strengths[category])
            
            # Aggregate weaknesses
            weaknesses = result.get("weaknesses", {})
            if isinstance(weaknesses, dict):
                for category in ["technical", "architectural", "performance"]:
                    if isinstance(weaknesses.get(category), list):
                        aggregated["weaknesses"][category].extend(weaknesses[category])
            
            # Aggregate suggestions
            suggestions = result.get("suggestions", {})
            if isinstance(suggestions, dict):
                for category in ["technical", "architectural", "performance"]:
                    if isinstance(suggestions.get(category), list):
                        aggregated["suggestions"][category].extend(suggestions[category])
        
        # Combine text fields (take first chunk as primary, add insights from others)
        aggregated["overview"] = overviews[0] if overviews else "Project analysis completed across multiple code segments."
        if len(overviews) > 1:
            aggregated["overview"] += f" Analysis considered {len(overviews)} different code segments."
        
        aggregated["architecture"] = architectures[0] if architectures else "Architecture analyzed across multiple components."
        aggregated["complexity"] = complexities[0] if complexities else "Complexity assessed across multiple code sections."
        aggregated["security"] = securities[0] if securities else "Security analysis completed for multiple code files."
        aggregated["realWorldReadiness"] = readiness_assessments[0] if readiness_assessments else "Production readiness assessed across multiple code components."
        
        # Aggregate innovation (average scores and combine assessments)
        if innovation_scores:
            aggregated["innovation"]["score"] = round(sum(innovation_scores) / len(innovation_scores))
            if innovation_assessments:
                aggregated["innovation"]["assessment"] = " ".join(innovation_assessments[:2])  # Take first 2 assessments
        
        # Aggregate AI detection (most common level, average scores)
        if ai_levels:
            level_counter = Counter(ai_levels)
            aggregated["aiDetection"]["level"] = level_counter.most_common(1)[0][0]
        
        if ai_scores:
            aggregated["aiDetection"]["score"] = round(sum(ai_scores) / len(ai_scores), 2)
        
        if ai_confidences:
            aggregated["aiDetection"]["confidence"] = round(sum(ai_confidences) / len(ai_confidences), 2)
        
        # Remove duplicates from strengths, weaknesses, and suggestions
        for category in ["technical", "architectural", "performance"]:
            aggregated["strengths"][category] = self._remove_duplicates(aggregated["strengths"][category])
            aggregated["weaknesses"][category] = self._remove_duplicates(aggregated["weaknesses"][category])
            aggregated["suggestions"][category] = self._remove_duplicates(aggregated["suggestions"][category])
        
        logger.info(f"Aggregated results: {len(aggregated['strengths']['technical'])} strengths, {len(aggregated['weaknesses']['technical'])} weaknesses")
        return aggregated
    
    def _remove_duplicates(self, items: List[str]) -> List[str]:
        """
        Remove duplicate items from a list while preserving order.
        """
        seen = set()
        unique_items = []
        
        for item in items:
            # Normalize item for comparison (lowercase, strip whitespace)
            normalized = item.lower().strip()
            if normalized not in seen:
                seen.add(normalized)
                unique_items.append(item)
        
        return unique_items
