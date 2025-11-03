import sys
import json

def calculate_budget_rule(monthly_income):
    try:
        income = float(monthly_income)
        
        needs = income * 0.50
        wants = income * 0.30
        savings = income * 0.20
        
        return {
            "needs": needs,
            "wants": wants,
            "savings": savings
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        monthly_income = sys.argv[1]
        result = calculate_budget_rule(monthly_income)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Python script execution failed: {e}"}))