import requests
import json
import time
from datetime import datetime

# Test server configuration
AUTOGEN_SERVER_URL = "http://localhost:5001"

def test_valid_request():
    """Test a valid message request"""
    print("\n=== Testing Valid Request ===")
    message = "Hello, how are you?"
    
    response = requests.post(
        f"{AUTOGEN_SERVER_URL}/api/chat",
        json={"message": message}
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error Response: {response.text}")

def test_empty_message():
    """Test request with empty message"""
    print("\n=== Testing Empty Message ===")
    response = requests.post(
        f"{AUTOGEN_SERVER_URL}/api/chat",
        json={"message": ""}
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error Response: {response.text}")

def test_invalid_json():
    """Test request with invalid JSON"""
    print("\n=== Testing Invalid JSON ===")
    response = requests.post(
        f"{AUTOGEN_SERVER_URL}/api/chat",
        data="invalid json"
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")

def test_long_message():
    """Test request with a long message"""
    print("\n=== Testing Long Message ===")
    long_message = "This is a very long message. " * 50
    response = requests.post(
        f"{AUTOGEN_SERVER_URL}/api/chat",
        json={"message": long_message}
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error Response: {response.text}")

def test_security_analysis():
    """Test security analysis capabilities"""
    print("\n=== Testing Security Analysis ===")
    security_message = """
    AWS GuardDuty Finding:
    Type: UnauthorizedAccess:EC2/SSHBruteForce
    Severity: HIGH
    Details: Multiple failed SSH login attempts detected from IP 192.168.1.100
    """
    
    response = requests.post(
        f"{AUTOGEN_SERVER_URL}/api/chat",
        json={"message": security_message}
    )
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    else:
        print(f"Error Response: {response.text}")

def run_all_tests():
    """Run all test cases"""
    print(f"Starting tests at {datetime.now()}")
    
    try:
        # Test valid request
        test_valid_request()
        time.sleep(1)  # Small delay between tests
        
        # Test empty message
        test_empty_message()
        time.sleep(1)
        
        # Test invalid JSON
        test_invalid_json()
        time.sleep(1)
        
        # Test long message
        test_long_message()
        time.sleep(1)
        
        # Test security analysis
        test_security_analysis()
        
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the AutoGen server. Make sure it's running on port 5001")
    except Exception as e:
        print(f"Error during testing: {str(e)}")
    
    print(f"\nTests completed at {datetime.now()}")

if __name__ == "__main__":
    run_all_tests() 