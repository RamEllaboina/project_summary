import os
import re
from pathlib import Path
from typing import Set, List, Tuple, Optional

# Directories to completely ignore
IGNORED_DIRECTORIES: Set[str] = {
    'node_modules',
    'venv',
    '.venv',
    '__pycache__',
    '.git',
    'dist',
    'build',
    '.next',
    'out',
    'target',
    'coverage',
    '.vscode',
    '.idea',
    'vendor',
    '.nyc_output',
    '.pytest_cache',
    '.mypy_cache',
    '.tox',
    'site-packages',
    'bower_components',
    '.npm',
    '.cache',
    'tmp',
    'temp'
}

# File extensions to ignore
IGNORED_EXTENSIONS: Set[str] = {
    '.log',
    '.tmp',
    '.lock',
    '.cache',
    '.DS_Store',
    '.env',
    '.env.local',
    '.env.development',
    '.env.test',
    '.env.production',
    '.pid',
    '.seed',
    '.pid.lock',
    '.swp',
    '.swo',
    '.bak',
    '.backup',
    '.old',
    '.orig',
    '.rej',
    '~',
    '.lprof',
    '.pyc',
    '.pyo',
    '.pyd',
    '.pyi',
    '.py class',
    '.jar',
    '.war',
    '.ear',
    '.zip',
    '.tar',
    '.tar.gz',
    '.tgz',
    '.rar',
    '.7z',
    '.exe',
    '.dll',
    '.so',
    '.dylib',
    '.bin',
    '.dat',
    '.db',
    '.sqlite',
    '.sqlite3'
}

# Allowed source code extensions
ALLOWED_EXTENSIONS: Set[str] = {
    '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
    '.py', '.pyx', '.pyi',
    '.java', '.kt', '.scala', '.groovy',
    '.cpp', '.c', '.h', '.hpp', '.cc', '.cxx',
    '.cs', '.vb',
    '.php', '.phtml',
    '.rb', '.rbw',
    '.go', '.mod', '.sum',
    '.rs',
    '.swift', '.m', '.mm',
    '.dart',
    '.lua',
    '.r', '.R',
    '.sql',
    '.sh', '.bash', '.zsh', '.fish',
    '.html', '.htm', '.xhtml',
    '.css', '.scss', '.sass', '.less',
    '.json', '.jsonc', '.json5',
    '.xml', '.yaml', '.yml', '.toml', '.ini',
    '.md', '.mdx', '.txt', '.rst',
    '.dockerfile', '.docker-compose.yml', '.docker-compose.yaml',
    '.graphql', '.gql',
    '.proto',
    '.vue', '.svelte'
}

class FileFilter:
    """Intelligent file filtering utility for project analysis"""
    
    @staticmethod
    def should_ignore(file_path: Path, is_directory: bool = False) -> bool:
        """
        Check if a file/directory should be ignored
        
        Args:
            file_path: Path to check
            is_directory: Whether it's a directory
            
        Returns:
            True if should be ignored
        """
        file_name = file_path.name
        
        # Check if it's an ignored directory
        if is_directory and file_name in IGNORED_DIRECTORIES:
            return True
        
        # Check if it's an ignored file extension
        if not is_directory:
            ext = file_path.suffix.lower()
            if ext in IGNORED_EXTENSIONS:
                return True
        
        # Check hidden files/directories (starting with .)
        if file_name.startswith('.') and not file_name.startswith('.env') and file_name != '.gitignore':
            return True
        
        # Check for lock files
        if any(lock in file_name.lower() for lock in ['package-lock', 'yarn.lock', 'pipfile.lock']):
            return True
        
        return False
    
    @staticmethod
    def is_source_code_file(file_path: Path) -> bool:
        """
        Check if a file is a source code file we should analyze
        
        Args:
            file_path: Path to check
            
        Returns:
            True if it's a source code file
        """
        ext = file_path.suffix.lower()
        return ext in ALLOWED_EXTENSIONS
    
    @classmethod
    def filter_files(
        cls, 
        directory: Path, 
        max_depth: int = 10, 
        current_depth: int = 0,
        include_non_source_code: bool = False,
        log_ignored: bool = False
    ) -> Tuple[List[Path], List[Tuple[Path, str]]]:
        """
        Filter files from a directory recursively
        
        Args:
            directory: Directory path to scan
            max_depth: Maximum depth to scan
            current_depth: Current depth (for recursion)
            include_non_source_code: Whether to include non-source code files
            log_ignored: Whether to log ignored files
            
        Returns:
            Tuple of (valid_files, ignored_files_with_reasons)
        """
        valid_files: List[Path] = []
        ignored_files: List[Tuple[Path, str]] = []
        
        try:
            if current_depth >= max_depth:
                return valid_files, ignored_files
            
            for item in directory.iterdir():
                if cls.should_ignore(item, item.is_dir()):
                    if log_ignored:
                        reason = 'ignored_directory' if item.is_dir() else 'ignored_file'
                        ignored_files.append((item, reason))
                    continue
                
                if item.is_dir():
                    # Recursively scan subdirectories
                    sub_valid, sub_ignored = cls.filter_files(
                        item, max_depth, current_depth + 1, include_non_source_code, log_ignored
                    )
                    valid_files.extend(sub_valid)
                    ignored_files.extend(sub_ignored)
                else:
                    # It's a file
                    if include_non_source_code or cls.is_source_code_file(item):
                        valid_files.append(item)
                    else:
                        if log_ignored:
                            ignored_files.append((item, 'non_source_code'))
        
        except (OSError, PermissionError) as error:
            print(f"Error scanning directory {directory}: {error}")
        
        return valid_files, ignored_files
    
    @staticmethod
    def get_file_stats(file_path: Path) -> Optional[dict]:
        """
        Get file stats for a file
        
        Args:
            file_path: Path to file
            
        Returns:
            File stats dict or None if error
        """
        try:
            stat = file_path.stat()
            return {
                'size': stat.st_size,
                'modified': stat.st_mtime,
                'created': stat.st_ctime
            }
        except (OSError, PermissionError):
            return None
    
    @staticmethod
    def read_file_content(file_path: Path, max_size: int = 1024 * 1024) -> Optional[str]:
        """
        Read file content with size limit
        
        Args:
            file_path: Path to file
            max_size: Maximum size in bytes (default: 1MB)
            
        Returns:
            File content or None if too large or error
        """
        try:
            stat = file_path.stat()
            if stat.st_size > max_size:
                print(f"File too large, skipping: {file_path} ({stat.st_size} bytes)")
                return None
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                return f.read()
        except (OSError, PermissionError, UnicodeDecodeError) as error:
            print(f"Error reading file {file_path}: {error}")
            return None
    
    @staticmethod
    def parse_ignore_file(ignore_file_path: Path) -> Set[str]:
        """
        Parse a custom ignore file (like .gitignore)
        
        Args:
            ignore_file_path: Path to ignore file
            
        Returns:
            Set of ignore patterns
        """
        patterns: Set[str] = set()
        
        try:
            if ignore_file_path.exists():
                with open(ignore_file_path, 'r', encoding='utf-8') as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith('#'):
                            patterns.add(line)
        except (OSError, PermissionError, UnicodeDecodeError) as error:
            print(f"Error reading ignore file {ignore_file_path}: {error}")
        
        return patterns
    
    @classmethod
    def get_filtering_summary(cls, directory: Path) -> dict:
        """
        Get a summary of filtering results for a directory
        
        Args:
            directory: Directory to analyze
            
        Returns:
            Summary dict with filtering statistics
        """
        valid_files, ignored_files = cls.filter_files(
            directory, 
            max_depth=15, 
            include_non_source_code=False, 
            log_ignored=True
        )
        
        # Count ignored reasons
        ignored_reasons = {}
        for _, reason in ignored_files:
            ignored_reasons[reason] = ignored_reasons.get(reason, 0) + 1
        
        # Count file types
        file_types = {}
        for file_path in valid_files:
            ext = file_path.suffix.lower()
            file_types[ext] = file_types.get(ext, 0) + 1
        
        return {
            'total_files_scanned': len(valid_files) + len(ignored_files),
            'source_code_files': len(valid_files),
            'ignored_files': len(ignored_files),
            'ignored_reasons': ignored_reasons,
            'file_types': file_types,
            'filtering_efficiency': len(ignored_files) / (len(valid_files) + len(ignored_files)) * 100
        }
