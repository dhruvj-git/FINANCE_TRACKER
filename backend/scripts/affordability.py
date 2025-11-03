import sys
import json
from datetime import datetime
try:
    from dateutil.relativedelta import relativedelta
except ImportError:
    print(json.dumps({"error": "Missing Python library: 'python-dateutil' is not installed."}))
    sys.exit(1)

def check_affordability(item_cost, current_savings, monthly_savings, desired_date_str):
    try:
        # --- 1. Parse Inputs ---
        item_cost = float(item_cost)
        current_savings = float(current_savings)
        monthly_savings = float(monthly_savings)
        
        # Handle case where user saves nothing
        if monthly_savings <= 0:
            if current_savings >= item_cost:
                return {"affordable": True, "message": "You can afford this now with your current savings."}
            else:
                return {"affordable": False, "message": "You are not saving money monthly, so you will not be able to afford this item."}

        desired_date = datetime.strptime(desired_date_str, '%Y-%m-%d')
        today = datetime.now()

        # --- 2. Calculate Projected Savings ---
        # Calculate months between today and desired date
        r = relativedelta(desired_date, today)
        months_remaining = r.months + (r.years * 12)

        # If the date is in the past, treat as 0 months
        if months_remaining < 0:
            months_remaining = 0

        projected_savings = current_savings + (monthly_savings * months_remaining)

        # --- 3. Check Affordability ---
        if projected_savings >= item_cost:
            return {"affordable": True, "message": "Based on your projections, you can afford this!"}
        else:
            # --- 4. Calculate New Date ---
            shortfall = item_cost - current_savings
            # If current savings already cover it, but date was in the past
            if shortfall <= 0:
                 return {"affordable": True, "message": "You can afford this now with your current savings."}

            months_needed = -(-shortfall // monthly_savings) # Ceiling division
            
            # Calculate the new affordable date
            new_affordable_date = today + relativedelta(months=int(months_needed))
            
            return {
                "affordable": False,
                "months_needed": int(months_needed),
                "new_date": new_affordable_date.strftime('%B %Y') # e.g., "January 2026"
            }

    except Exception as e:
        # Send error back as JSON
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        # Read inputs from command line arguments
        item_cost = sys.argv[1]
        current_savings = sys.argv[2]
        monthly_savings = sys.argv[3]
        desired_date_str = sys.argv[4]

        # Calculate result
        result = check_affordability(item_cost, current_savings, monthly_savings, desired_date_str)
        
        # Print result as a JSON string to stdout
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Python script execution failed: {e}"}))