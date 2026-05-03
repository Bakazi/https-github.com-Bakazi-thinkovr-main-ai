#!/usr/bin/env python3
"""
Thinkovr Backend API Test Suite - Regression Testing After UI/PDF Enhancements
Tests new admin credentials, API Keys endpoint, and all regressions
"""
import requests
import json
import time
import re
from datetime import datetime

# Base URL from .env - UPDATED
BASE_URL = "https://vault-auth-2.preview.emergentagent.com/api"

# Admin credentials - UPDATED PASSWORD
ADMIN_1_EMAIL = "zalemocke@gmail.com"
ADMIN_2_EMAIL = "zmanschoeman@gmail.com"
NEW_ADMIN_PASSWORD = "$@ZMAN%@"
OLD_ADMIN_PASSWORD = "WonderwerkeBYdieWeesHuis@#"

# Test results tracking
test_results = []
test_summary = {"passed": 0, "failed": 0, "total": 0}

def log_test(name, passed, details=""):
    """Log test result"""
    global test_summary
    status = "✅ PASS" if passed else "❌ FAIL"
    result = f"{status} | {name}"
    if details:
        result += f"\n    Details: {details}"
    print(result)
    test_results.append({"name": name, "passed": passed, "details": details})
    test_summary["total"] += 1
    if passed:
        test_summary["passed"] += 1
    else:
        test_summary["failed"] += 1
    return passed

def generate_unique_email(prefix="testuser"):
    """Generate unique email for testing"""
    timestamp = int(time.time() * 1000)
    return f"{prefix}.{timestamp}@thinkovr-test.com"

# ==================== 1. NEW ADMIN CREDENTIALS TESTS ====================

def test_new_admin_credentials():
    """Test that both admin emails work with NEW password and OLD password fails"""
    print("\n" + "="*80)
    print("TEST SUITE: New Admin Credentials")
    print("="*80)
    
    # Test Admin 1 with NEW password
    print("\n--- Testing Admin 1 with NEW password ---")
    admin1_token = None
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_1_EMAIL, "password": NEW_ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            admin_flag = data.get("user", {}).get("admin", False)
            has_token = "token" in data
            passed = admin_flag and has_token
            log_test("Admin 1 Login with NEW password", passed, 
                    f"Admin flag: {admin_flag}, Token present: {has_token}")
            admin1_token = data.get("token") if passed else None
        else:
            log_test("Admin 1 Login with NEW password", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Admin 1 Login with NEW password", False, f"Exception: {str(e)}")
    
    # Test Admin 2 with NEW password
    print("\n--- Testing Admin 2 with NEW password ---")
    admin2_token = None
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_2_EMAIL, "password": NEW_ADMIN_PASSWORD},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            admin_flag = data.get("user", {}).get("admin", False)
            has_token = "token" in data
            passed = admin_flag and has_token
            log_test("Admin 2 Login with NEW password", passed, 
                    f"Admin flag: {admin_flag}, Token present: {has_token}")
            admin2_token = data.get("token") if passed else None
        else:
            log_test("Admin 2 Login with NEW password", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Admin 2 Login with NEW password", False, f"Exception: {str(e)}")
    
    # Test Admin 1 with OLD password (should FAIL)
    print("\n--- Testing Admin 1 with OLD password (should FAIL) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_1_EMAIL, "password": OLD_ADMIN_PASSWORD},
            timeout=10
        )
        
        # Should return 401 or error
        failed_as_expected = response.status_code == 401 or (response.status_code == 200 and not response.json().get("token"))
        log_test("Admin 1 Login with OLD password FAILS", failed_as_expected, 
                f"Status: {response.status_code}, Expected: 401")
    except Exception as e:
        log_test("Admin 1 Login with OLD password", False, f"Exception: {str(e)}")
    
    # Test Admin 2 with OLD password (should FAIL)
    print("\n--- Testing Admin 2 with OLD password (should FAIL) ---")
    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_2_EMAIL, "password": OLD_ADMIN_PASSWORD},
            timeout=10
        )
        
        # Should return 401 or error
        failed_as_expected = response.status_code == 401 or (response.status_code == 200 and not response.json().get("token"))
        log_test("Admin 2 Login with OLD password FAILS", failed_as_expected, 
                f"Status: {response.status_code}, Expected: 401")
    except Exception as e:
        log_test("Admin 2 Login with OLD password", False, f"Exception: {str(e)}")
    
    return admin1_token or admin2_token

# ==================== 2. NEW ADMIN API KEYS ENDPOINT ====================

def test_admin_api_keys_endpoint(admin_token):
    """Test GET and PUT /api/admin/keys"""
    print("\n" + "="*80)
    print("TEST SUITE: Admin API Keys Endpoint")
    print("="*80)
    
    if not admin_token:
        log_test("Admin API Keys Tests", False, "No admin token available")
        return
    
    # Test GET /admin/keys
    print("\n--- Testing GET /admin/keys ---")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/keys",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            keys = data.get("keys", {})
            
            # Check all expected keys are present
            expected_keys = ['groq_api_key', 'gemini_api_key', 'gemini_api_key_2', 
                           'gemini_api_key_3', 'openrouter_api_key', 'resend_api_key', 'email_from']
            has_all_keys = all(k in keys for k in expected_keys)
            log_test("GET /admin/keys returns all expected keys", has_all_keys, 
                    f"Keys present: {list(keys.keys())}")
            
            # Check structure of each key entry
            if keys:
                sample_key = list(keys.keys())[0]
                sample_entry = keys[sample_key]
                required_fields = ['value', 'env_set', 'db_set', 'masked', 'source']
                has_structure = all(f in sample_entry for f in required_fields)
                log_test("Key entries have correct structure", has_structure, 
                        f"Sample entry ({sample_key}): {json.dumps(sample_entry)}")
                
                # Check that groq_api_key has env_set=true (since it's in .env)
                groq_entry = keys.get('groq_api_key', {})
                groq_env_set = groq_entry.get('env_set', False)
                log_test("groq_api_key has env_set=true", groq_env_set, 
                        f"groq_api_key entry: {json.dumps(groq_entry)}")
                
                # Check that masked value is properly masked
                groq_masked = groq_entry.get('masked', '')
                is_masked = '•' in groq_masked or len(groq_masked) < 20
                log_test("groq_api_key is masked", is_masked, 
                        f"Masked value: {groq_masked}")
                
                # Check source attribution
                groq_source = groq_entry.get('source', '')
                valid_source = groq_source in ['env', 'database', 'none']
                log_test("groq_api_key has valid source", valid_source, 
                        f"Source: {groq_source}")
            
            print(f"\n    Full response: {json.dumps(data, indent=2)}")
        else:
            log_test("GET /admin/keys", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("GET /admin/keys", False, f"Exception: {str(e)}")
    
    # Test PUT /admin/keys - Set override
    print("\n--- Testing PUT /admin/keys (set override) ---")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/keys",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "groq_api_key": "test_override_key_abc123",
                "email_from": "Thinkovr <test@example.com>"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            log_test("PUT /admin/keys (set override) returns success", success, 
                    f"Response: {json.dumps(data)}")
            
            # Verify by GET again
            time.sleep(1)
            get_response = requests.get(
                f"{BASE_URL}/admin/keys",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            
            if get_response.status_code == 200:
                keys = get_response.json().get("keys", {})
                groq_entry = keys.get('groq_api_key', {})
                groq_source = groq_entry.get('source', '')
                groq_db_set = groq_entry.get('db_set', False)
                
                log_test("groq_api_key source changed to 'database'", 
                        groq_source == 'database', 
                        f"Source: {groq_source}, db_set: {groq_db_set}")
                
                email_entry = keys.get('email_from', {})
                email_source = email_entry.get('source', '')
                log_test("email_from source changed to 'database'", 
                        email_source == 'database', 
                        f"Source: {email_source}")
            else:
                log_test("Verify PUT /admin/keys", False, 
                        f"GET Status: {get_response.status_code}")
        else:
            log_test("PUT /admin/keys (set override)", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("PUT /admin/keys (set override)", False, f"Exception: {str(e)}")
    
    # Test PUT /admin/keys - Clear override
    print("\n--- Testing PUT /admin/keys (clear override) ---")
    try:
        response = requests.put(
            f"{BASE_URL}/admin/keys",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "groq_api_key": ""
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            log_test("PUT /admin/keys (clear override) returns success", success, 
                    f"Response: {json.dumps(data)}")
            
            # Verify by GET again
            time.sleep(1)
            get_response = requests.get(
                f"{BASE_URL}/admin/keys",
                headers={"Authorization": f"Bearer {admin_token}"},
                timeout=10
            )
            
            if get_response.status_code == 200:
                keys = get_response.json().get("keys", {})
                groq_entry = keys.get('groq_api_key', {})
                groq_source = groq_entry.get('source', '')
                groq_db_set = groq_entry.get('db_set', False)
                
                log_test("groq_api_key source back to 'env'", 
                        groq_source == 'env', 
                        f"Source: {groq_source}, db_set: {groq_db_set}")
            else:
                log_test("Verify clear override", False, 
                        f"GET Status: {get_response.status_code}")
        else:
            log_test("PUT /admin/keys (clear override)", False, 
                    f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("PUT /admin/keys (clear override)", False, f"Exception: {str(e)}")
    
    # Test regular user cannot access /admin/keys
    print("\n--- Testing Regular User Cannot Access /admin/keys ---")
    regular_email = generate_unique_email("regular")
    try:
        signup_response = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": regular_email, "password": "testpass123"},
            timeout=10
        )
        if signup_response.status_code == 200:
            regular_token = signup_response.json().get("token")
            
            # Try GET /admin/keys as regular user
            get_response = requests.get(
                f"{BASE_URL}/admin/keys",
                headers={"Authorization": f"Bearer {regular_token}"},
                timeout=10
            )
            
            is_forbidden_get = get_response.status_code == 403
            log_test("Regular User GET /admin/keys returns 403", is_forbidden_get, 
                    f"Status: {get_response.status_code}")
            
            # Try PUT /admin/keys as regular user
            put_response = requests.put(
                f"{BASE_URL}/admin/keys",
                headers={"Authorization": f"Bearer {regular_token}"},
                json={"groq_api_key": "hacker_attempt"},
                timeout=10
            )
            
            is_forbidden_put = put_response.status_code == 403
            log_test("Regular User PUT /admin/keys returns 403", is_forbidden_put, 
                    f"Status: {put_response.status_code}")
        else:
            log_test("Create Regular User for Keys Test", False, 
                    f"Status: {signup_response.status_code}")
    except Exception as e:
        log_test("Regular User /admin/keys Access", False, f"Exception: {str(e)}")

# ==================== 3. FRESH GROQ KEY WORKS ====================

def test_fresh_groq_key(admin_token):
    """Test that fresh Groq key works and groq_output starts with preamble"""
    print("\n" + "="*80)
    print("TEST SUITE: Fresh Groq Key Works")
    print("="*80)
    
    if not admin_token:
        log_test("Fresh Groq Key Tests", False, "No admin token available")
        return
    
    # Create a user and submit a wish
    print("\n--- Creating User and Submitting Wish ---")
    user_email = generate_unique_email("groqtest")
    try:
        signup_response = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": user_email, "password": "testpass123"},
            timeout=10
        )
        if signup_response.status_code == 200:
            user_token = signup_response.json().get("token")
            
            # Submit a wish
            wish_response = requests.post(
                f"{BASE_URL}/wish",
                headers={"Authorization": f"Bearer {user_token}"},
                json={
                    "tier": "spark",
                    "prompt": "I want to launch a mobile app for fitness tracking",
                    "context": {
                        "capital": "$3000",
                        "hours": "20 hours/week",
                        "skill": "Mobile Development",
                        "location": "Los Angeles, CA",
                        "fear": "Competition from established apps"
                    }
                },
                timeout=30
            )
            
            if wish_response.status_code == 200:
                data = wish_response.json()
                success = data.get("success", False)
                log_test("Wish submission returns success", success, 
                        f"Response: {json.dumps(data)}")
                
                # Wait for processing
                print("    Waiting for LLM processing...")
                time.sleep(5)
                
                # Get wishes as user (should NOT see groq_output)
                user_wishes_response = requests.get(
                    f"{BASE_URL}/wish",
                    headers={"Authorization": f"Bearer {user_token}"},
                    timeout=10
                )
                
                if user_wishes_response.status_code == 200:
                    user_wishes = user_wishes_response.json().get("wishes", [])
                    if user_wishes:
                        wish_id = user_wishes[0].get("id")
                        has_groq_output = "groq_output" in user_wishes[0]
                        log_test("User GET /wish does NOT leak groq_output", 
                                not has_groq_output, 
                                f"groq_output present: {has_groq_output}")
                        
                        # Admin fetches the wish to verify groq_output
                        print("\n--- Admin Fetching Wish to Verify Groq Output ---")
                        admin_wishes_response = requests.get(
                            f"{BASE_URL}/admin/wishes",
                            headers={"Authorization": f"Bearer {admin_token}"},
                            timeout=10
                        )
                        
                        if admin_wishes_response.status_code == 200:
                            admin_wishes = admin_wishes_response.json().get("wishes", [])
                            target_wish = None
                            for w in admin_wishes:
                                if w.get("id") == wish_id:
                                    target_wish = w
                                    break
                            
                            if target_wish:
                                groq_output = target_wish.get("groq_output", "")
                                
                                # Check that groq_output exists and is not empty
                                has_output = len(groq_output) > 0
                                log_test("Groq output exists and is not empty", has_output, 
                                        f"Output length: {len(groq_output)} chars")
                                
                                # Check that groq_output starts with preamble
                                stripped_output = groq_output.lstrip()
                                starts_with_assumptions = stripped_output.startswith("## [ASSUMPTIONS I AM MAKING]")
                                log_test("Groq output starts with '## [ASSUMPTIONS I AM MAKING]'", 
                                        starts_with_assumptions, 
                                        f"First 100 chars: {stripped_output[:100]}")
                                
                                # Check for all preamble sections
                                has_assumptions = "## [ASSUMPTIONS I AM MAKING]" in groq_output
                                has_why_wrong = "## [WHY THIS MIGHT BE WRONG]" in groq_output
                                has_least_viable = "## [LEAST VIABLE ATTEMPT]" in groq_output
                                
                                log_test("Groq output contains [ASSUMPTIONS I AM MAKING]", 
                                        has_assumptions, f"Found: {has_assumptions}")
                                log_test("Groq output contains [WHY THIS MIGHT BE WRONG]", 
                                        has_why_wrong, f"Found: {has_why_wrong}")
                                log_test("Groq output contains [LEAST VIABLE ATTEMPT]", 
                                        has_least_viable, f"Found: {has_least_viable}")
                                
                                # Print first 500 chars for inspection
                                print(f"\n    First 500 chars of groq_output:")
                                print(f"    {groq_output[:500]}")
                            else:
                                log_test("Find Wish in Admin Response", False, 
                                        f"Wish ID {wish_id} not found")
                        else:
                            log_test("Admin GET /admin/wishes", False, 
                                    f"Status: {admin_wishes_response.status_code}")
                    else:
                        log_test("Retrieve User Wishes", False, "No wishes found")
                else:
                    log_test("User GET /wish", False, 
                            f"Status: {user_wishes_response.status_code}")
            else:
                log_test("Submit Wish", False, 
                        f"Status: {wish_response.status_code}, Response: {wish_response.text}")
        else:
            log_test("Create User for Groq Test", False, 
                    f"Status: {signup_response.status_code}")
    except Exception as e:
        log_test("Fresh Groq Key Tests", False, f"Exception: {str(e)}")

# ==================== 4. REGRESSION TESTS ====================

def test_regression_free_mode_toggle(admin_token):
    """Test free mode toggle still works"""
    print("\n" + "="*80)
    print("REGRESSION TEST: Free Mode Toggle")
    print("="*80)
    
    if not admin_token:
        log_test("Free Mode Toggle Tests", False, "No admin token available")
        return
    
    # Enable free mode
    try:
        response = requests.put(
            f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"free_mode": True},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            free_mode_enabled = data.get("free_mode", False)
            log_test("Enable free_mode works", free_mode_enabled, 
                    f"Response: {json.dumps(data)}")
        else:
            log_test("Enable free_mode", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test("Enable free_mode", False, f"Exception: {str(e)}")
    
    # Disable free mode
    try:
        response = requests.put(
            f"{BASE_URL}/admin/settings",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"free_mode": False},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            free_mode_disabled = not data.get("free_mode", True)
            log_test("Disable free_mode works", free_mode_disabled, 
                    f"Response: {json.dumps(data)}")
        else:
            log_test("Disable free_mode", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test("Disable free_mode", False, f"Exception: {str(e)}")

def test_regression_pdf_download(admin_token):
    """Test PDF download endpoint returns valid PDF"""
    print("\n" + "="*80)
    print("REGRESSION TEST: PDF Download")
    print("="*80)
    
    if not admin_token:
        log_test("PDF Download Tests", False, "No admin token available")
        return
    
    # Get a delivered wish
    try:
        response = requests.get(
            f"{BASE_URL}/admin/wishes?status=delivered",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            wishes = response.json().get("wishes", [])
            if wishes:
                wish_id = wishes[0].get("id")
                
                # Admin can download PDF
                pdf_response = requests.get(
                    f"{BASE_URL}/admin/wishes/{wish_id}/pdf",
                    headers={"Authorization": f"Bearer {admin_token}"},
                    timeout=15
                )
                
                if pdf_response.status_code == 200:
                    content_type = pdf_response.headers.get("Content-Type")
                    is_pdf = content_type == "application/pdf"
                    has_content = len(pdf_response.content) > 0
                    starts_with_pdf = pdf_response.content[:4] == b'%PDF'
                    
                    log_test("PDF Content-Type is application/pdf", is_pdf, 
                            f"Content-Type: {content_type}")
                    log_test("PDF has content", has_content, 
                            f"Size: {len(pdf_response.content)} bytes")
                    log_test("PDF starts with %PDF", starts_with_pdf, 
                            f"First 4 bytes: {pdf_response.content[:4]}")
                else:
                    log_test("Admin PDF download", False, 
                            f"Status: {pdf_response.status_code}")
            else:
                print("    No delivered wishes found for PDF test")
                log_test("PDF Download Test", False, "No delivered wishes available")
        else:
            log_test("GET delivered wishes for PDF test", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test("PDF Download Test", False, f"Exception: {str(e)}")

def test_regression_dispatch(admin_token):
    """Test dispatch endpoint still works"""
    print("\n" + "="*80)
    print("REGRESSION TEST: Dispatch Endpoint")
    print("="*80)
    
    if not admin_token:
        log_test("Dispatch Tests", False, "No admin token available")
        return
    
    # Create a user and submit a wish
    user_email = generate_unique_email("dispatchtest")
    try:
        signup_response = requests.post(
            f"{BASE_URL}/auth/signup",
            json={"email": user_email, "password": "testpass123"},
            timeout=10
        )
        if signup_response.status_code == 200:
            user_token = signup_response.json().get("token")
            
            # Submit a wish
            wish_response = requests.post(
                f"{BASE_URL}/wish",
                headers={"Authorization": f"Bearer {user_token}"},
                json={
                    "tier": "spark",
                    "prompt": "Test dispatch functionality",
                    "context": {
                        "capital": "$1000",
                        "hours": "10 hours/week",
                        "skill": "Testing",
                        "location": "Test City",
                        "fear": "Test fear"
                    }
                },
                timeout=30
            )
            
            if wish_response.status_code == 200:
                print("    Wish submitted successfully")
                
                # Wait for processing
                time.sleep(5)
                
                # Get the wish ID
                wishes_response = requests.get(
                    f"{BASE_URL}/wish",
                    headers={"Authorization": f"Bearer {user_token}"},
                    timeout=10
                )
                
                if wishes_response.status_code == 200:
                    wishes = wishes_response.json().get("wishes", [])
                    if wishes:
                        wish_id = wishes[0].get("id")
                        
                        # Admin dispatches the wish
                        dispatch_response = requests.post(
                            f"{BASE_URL}/admin/wishes/{wish_id}/dispatch",
                            headers={"Authorization": f"Bearer {admin_token}"},
                            timeout=15
                        )
                        
                        if dispatch_response.status_code == 200:
                            data = dispatch_response.json()
                            success = data.get("success", False)
                            
                            log_test("Dispatch returns success", success, 
                                    f"Response: {json.dumps(data)}")
                            
                            # Verify wish status changed to delivered
                            time.sleep(2)
                            admin_wishes_response = requests.get(
                                f"{BASE_URL}/admin/wishes",
                                headers={"Authorization": f"Bearer {admin_token}"},
                                timeout=10
                            )
                            
                            if admin_wishes_response.status_code == 200:
                                admin_wishes = admin_wishes_response.json().get("wishes", [])
                                target_wish = None
                                for w in admin_wishes:
                                    if w.get("id") == wish_id:
                                        target_wish = w
                                        break
                                
                                if target_wish:
                                    status = target_wish.get("status")
                                    log_test("Wish status changed to 'delivered'", 
                                            status == "delivered", 
                                            f"Status: {status}")
                                else:
                                    log_test("Find dispatched wish", False, 
                                            "Wish not found")
                            else:
                                log_test("Verify dispatch status", False, 
                                        f"Status: {admin_wishes_response.status_code}")
                        else:
                            log_test("Dispatch wish", False, 
                                    f"Status: {dispatch_response.status_code}, Response: {dispatch_response.text}")
                    else:
                        log_test("Get wish for dispatch", False, "No wishes found")
                else:
                    log_test("Get wishes for dispatch", False, 
                            f"Status: {wishes_response.status_code}")
            else:
                log_test("Submit wish for dispatch test", False, 
                        f"Status: {wish_response.status_code}")
        else:
            log_test("Create user for dispatch test", False, 
                    f"Status: {signup_response.status_code}")
    except Exception as e:
        log_test("Dispatch Test", False, f"Exception: {str(e)}")

def test_regression_banking(admin_token):
    """Test banking endpoints still work"""
    print("\n" + "="*80)
    print("REGRESSION TEST: Banking Endpoints")
    print("="*80)
    
    if not admin_token:
        log_test("Banking Tests", False, "No admin token available")
        return
    
    # Test GET /admin/banking
    try:
        response = requests.get(
            f"{BASE_URL}/admin/banking",
            headers={"Authorization": f"Bearer {admin_token}"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            has_banking = "banking" in data
            log_test("GET /admin/banking works", has_banking, 
                    f"Response: {json.dumps(data)}")
        else:
            log_test("GET /admin/banking", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test("GET /admin/banking", False, f"Exception: {str(e)}")
    
    # Test PUT /admin/banking
    try:
        response = requests.put(
            f"{BASE_URL}/admin/banking",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "bank": "Capitec",
                "account_name": "Thinkovr Test",
                "account_number": "1234567890",
                "branch_code": "470010",
                "swift": "CABLZAJJ",
                "reference_note": "Include your order reference"
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            success = data.get("success", False)
            log_test("PUT /admin/banking works", success, 
                    f"Response: {json.dumps(data)}")
        else:
            log_test("PUT /admin/banking", False, 
                    f"Status: {response.status_code}")
    except Exception as e:
        log_test("PUT /admin/banking", False, f"Exception: {str(e)}")

# ==================== MAIN TEST RUNNER ====================

def run_all_tests():
    """Run all test suites"""
    print("\n" + "="*80)
    print("THINKOVR BACKEND API TEST SUITE")
    print("Regression Testing After UI/PDF Enhancements")
    print("="*80)
    print(f"Base URL: {BASE_URL}")
    print(f"Test Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)
    
    # 1. New admin credentials
    admin_token = test_new_admin_credentials()
    
    # 2. NEW Admin API Keys endpoint
    if admin_token:
        test_admin_api_keys_endpoint(admin_token)
    
    # 3. Fresh Groq key works
    if admin_token:
        test_fresh_groq_key(admin_token)
    
    # 4. Regression tests
    if admin_token:
        test_regression_free_mode_toggle(admin_token)
        test_regression_pdf_download(admin_token)
        test_regression_dispatch(admin_token)
        test_regression_banking(admin_token)
    
    # Print summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    print(f"Total Tests: {test_summary['total']}")
    print(f"Passed: {test_summary['passed']} ✅")
    print(f"Failed: {test_summary['failed']} ❌")
    print(f"Success Rate: {(test_summary['passed'] / test_summary['total'] * 100) if test_summary['total'] > 0 else 0:.1f}%")
    print("="*80)
    
    # Print failed tests
    if test_summary['failed'] > 0:
        print("\nFAILED TESTS:")
        for result in test_results:
            if not result['passed']:
                print(f"  ❌ {result['name']}")
                if result['details']:
                    print(f"     {result['details']}")
    
    print(f"\nTest Completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*80)

if __name__ == "__main__":
    run_all_tests()
