"""
Test script to verify PyTorch and CUDA installation.
"""

import torch
import torchvision


def main():
    """Print PyTorch version and CUDA availability."""
    print(f"PyTorch version: {torch.__version__}")
    print(f"Torchvision version: {torchvision.__version__}")
    print(f"CUDA available: {torch.cuda.is_available()}")
    
    if torch.cuda.is_available():
        print(f"CUDA device: {torch.cuda.get_device_name(0)}")


if __name__ == "__main__":
    main()
