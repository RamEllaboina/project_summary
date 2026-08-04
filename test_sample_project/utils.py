"""
Utility functions for the application
"""

def calculate_sum(a, b):
    return a + b

def calculate_product(a, b):
    return a * b

# FIXME: This function needs error handling
def divide_numbers(a, b):
    return a / b

class DataProcessor:
    def __init__(self):
        self.data = []
    
    def add_data(self, item):
        self.data.append(item)
    
    def get_data(self):
        return self.data
