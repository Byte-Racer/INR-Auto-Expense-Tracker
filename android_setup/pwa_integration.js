/**
 * PWA JS Integration Stub
 * Add this to your main script (e.g., `src/main.js` or `index.html`) so the native Android WebView has an endpoint.
 */

// Define the global function expected by the Android evaluateJavascript code
window.onNativeTransaction = function (type, amount, last4) {
  console.log(
    `[Native Transaction Received] Type: ${"$"}{type}, Amount: ${"$"}{amount}, Last 4: ${"$"}{last4}`,
  );

  // Parse the amount to a number
  const parsedAmount = parseFloat(amount.replace(/,/g, ""));
  if (isNaN(parsedAmount)) {
    console.error("Failed to parse transaction amount.");
    return;
  }

  // Hook into your balance update logic here!
  // Example:
  // if (type === 'debit') {
  //    expenseStore.addExpense(parsedAmount, `Auto-detected ending in ${"$"}{last4}`);
  // } else if (type === 'credit') {
  //    incomeStore.addIncome(parsedAmount, `Auto-detected ending in ${"$"}{last4}`);
  // }
};
