// backend/controllers/analysisController.js

const { PythonShell } = require('python-shell');
const path = require('path');

// Helper to get the script path
const getScriptPath = (scriptName) => {
  // __dirname is .../controllers, so go up one level then into /scripts
  return path.join(__dirname, '..', 'scripts', scriptName);
};

// This points to the 'py' command we fixed earlier
const PYTHON_PATH = 'py'; 

exports.checkAffordability = async (req, res) => {
  const { item_cost, current_savings, monthly_savings, desired_date } = req.body;

  if (!item_cost || !current_savings || !monthly_savings || !desired_date) {
    return res.status(400).json({ message: "Missing required fields." });
  }

  const options = {
    mode: 'json',
    pythonPath: PYTHON_PATH,
    args: [item_cost, current_savings, monthly_savings, desired_date]
  };

  try {
    const results = await PythonShell.run(getScriptPath('affordability.py'), options);
    const result = results[0];

    if (result.error) {
      throw new Error(result.error);
    }
    res.json(result);
  } catch (err) {
    console.error("Python script error:", err);
    res.status(500).json({ message: "Error running analysis", error: err.message });
  }
};

exports.calculateBudgetRule = async (req, res) => {
  const { monthly_income } = req.body;

  if (!monthly_income) {
    return res.status(400).json({ message: "Missing monthly income." });
  }

  const options = {
    mode: 'json',
    pythonPath: PYTHON_PATH,
    args: [monthly_income]
  };

  try {
    const results = await PythonShell.run(getScriptPath('budget_rule.py'), options);
    const result = results[0];

    if (result.error) {
      throw new Error(result.error);
    }
    res.json(result);
  } catch (err) {
    console.error("Python script error:", err);
    res.status(500).json({ message: "Error running analysis", error: err.message });
  }
};