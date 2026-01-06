#!/usr/bin/env python3
"""
AI Service Setup Script

This script helps set up the AI service with the correct PyTorch version
for your hardware (CPU or CUDA GPU).

Usage:
    uv run python setup_pytorch.py
"""

import subprocess
import sys


def check_cuda_available():
    """Check if NVIDIA CUDA is available on this system."""
    try:
        result = subprocess.run(
            ["nvidia-smi"],
            capture_output=True,
            text=True,
            timeout=10
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def get_cuda_version():
    """Get CUDA version from nvidia-smi output."""
    try:
        result = subprocess.run(
            ["nvidia-smi"],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            # Parse CUDA version from output
            for line in result.stdout.split('\n'):
                if 'CUDA Version' in line:
                    # Extract version like "12.2"
                    parts = line.split('CUDA Version:')
                    if len(parts) > 1:
                        version = parts[1].strip().split()[0]
                        return version
    except Exception:
        pass
    return None


def install_pytorch(use_cuda: bool):
    """Install PyTorch with the appropriate backend."""
    import re
    
    pyproject_path = "pyproject.toml"
    
    # Read the current pyproject.toml
    with open(pyproject_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if use_cuda:
        print("\n🚀 Installing PyTorch with CUDA support...")
        # Ensure CUDA index is set
        new_content = re.sub(
            r'\[tool\.uv\.sources\.torch\]\nindex = "pytorch-cpu"',
            '[tool.uv.sources.torch]\nindex = "pytorch-cu124"',
            content
        )
        new_content = re.sub(
            r'\[tool\.uv\.sources\.torchvision\]\nindex = "pytorch-cpu"',
            '[tool.uv.sources.torchvision]\nindex = "pytorch-cu124"',
            new_content
        )
    else:
        print("\n💻 Installing PyTorch for CPU...")
        # Switch to CPU index
        new_content = re.sub(
            r'\[tool\.uv\.sources\.torch\]\nindex = "pytorch-cu124"',
            '[tool.uv.sources.torch]\nindex = "pytorch-cpu"',
            content
        )
        new_content = re.sub(
            r'\[tool\.uv\.sources\.torchvision\]\nindex = "pytorch-cu124"',
            '[tool.uv.sources.torchvision]\nindex = "pytorch-cpu"',
            new_content
        )
    
    # Write back if changed
    if new_content != content:
        with open(pyproject_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"✅ Updated {pyproject_path} for {'CUDA' if use_cuda else 'CPU'}")
    
    # Run uv sync with the appropriate extra
    extra = "cuda" if use_cuda else "cpu"
    cmd = ["uv", "sync", "--extra", extra]
    
    print(f"Running: {' '.join(cmd)}")
    result = subprocess.run(cmd)
    return result.returncode == 0



def main():
    print("=" * 60)
    print("🔧 AI Service - PyTorch Setup")
    print("=" * 60)
    
    # Check for CUDA
    print("\n📡 Checking for NVIDIA GPU...")
    has_cuda = check_cuda_available()
    
    if has_cuda:
        cuda_version = get_cuda_version()
        print(f"✅ NVIDIA GPU detected! CUDA Version: {cuda_version}")
        print("\nRecommendation: Install with CUDA support for faster processing.")
        
        # Ask user
        choice = input("\nInstall with CUDA? [Y/n]: ").strip().lower()
        use_cuda = choice != 'n'
    else:
        print("❌ No NVIDIA GPU detected.")
        print("Installing CPU-only version...")
        use_cuda = False
    
    # Install
    success = install_pytorch(use_cuda)
    
    if success:
        print("\n" + "=" * 60)
        print("✅ Setup complete!")
        print("=" * 60)
        if use_cuda:
            print("\nVerify GPU is working:")
            print("  uv run python -c \"import torch; print(torch.cuda.is_available())\"")
        print("\nStart the API:")
        print("  uv run python main.py")
    else:
        print("\n❌ Setup failed. Please check the error messages above.")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
