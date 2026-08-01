---
name: "catch-log"
description: "Enforce logging exceptions in catch blocks. Invoke when generating or editing code that contains try-catch statements."
---

# Catch Block Logging Rule

When generating or editing code, **every catch block MUST log or print the exception**. Never leave a catch block empty or silently swallow errors.

## Rules

1. **Always log the error** in the catch block using an appropriate method:
   - TypeScript/JavaScript: `console.error(error)` or `console.error(error.message)`
   - Python: `logger.exception(e)` or `print(f"Error: {e}")`
   - Java: `e.printStackTrace()` or `logger.error("...", e)`
   - Go: `log.Printf("error: %v", err)`
   - C#: `Console.Error.WriteLine(ex.Message)` or `logger.LogError(ex, "...")`

2. **Never use empty catch blocks** like:
   ```typescript
   try {
     // ...
   } catch {
     // BAD: silent failure
   }
   ```

3. **Never swallow errors without logging**:
   ```typescript
   try {
     // ...
   } catch (e) {
     // BAD: no logging
   }
   ```

4. **Correct pattern**:
   ```typescript
   try {
     // ...
   } catch (error) {
     console.error(error)
     // optional: handle the error, show toast, etc.
   }
   ```

5. If the catch block already has error handling (e.g., `showToast`), also add `console.error` for debugging:
   ```typescript
   try {
     await someApi()
   } catch (error) {
     console.error(error)
     showToast('操作失败')
   }
   ```
