import json
import os

from arbiterx import CodeExecutor, Constraints


class PythonCodeExecutor(CodeExecutor):
    def get_compile_command(self, src: str) -> str:
        return ""

    def get_run_command(self, src: str) -> str:
        return f"python3 {src}/solution.py"