from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Analysis Engine"
    API_V1_STR: str = "/api/v1"
    
    # Analysis Configuration
    MAX_FILE_SIZE_BYTES: int = 1024 * 1024  # 1MB limit for analysis
    TIMEOUT_SECONDS: int = 300  # 5 minutes max analysis time
    
    # Ignored Directories
    IGNORED_DIRS: set = {
        "node_modules", ".git", "dist", "build", "venv", 
        "__pycache__", "coverage", "logs", ".idea", ".vscode",
        "target", "bin", "obj", "analysis", "analyzis"
    }
    
    # Supported Extensions for Detail Analysis
    SUPPORTED_EXTENSIONS: set = {".py", ".js", ".ts", ".jsx", ".tsx", ".java", ".go", ".rs", ".cpp", ".c", ".html", ".css"}

settings = Settings()
