/**
 * Generates a structured execution flow representation
 * based on the project type and execution result.
 *
 * Returns:
 * - Array of steps the execution went through
 * - Each step has a label and status (success/error/warning)
 */
function generate(projectType, language, executionResult) {
    const flow = [];

    // ─── Project Setup ──────────────────────────────────────────────
    flow.push({ step: 'Project Upload', status: 'success', detail: `Received ${executionResult.projectType?.toUpperCase() || projectType.toUpperCase()} project files` });

    // ─── Project Analysis ───────────────────────────────────────────
    flow.push({ step: 'Project Detection', status: 'success', detail: `Detected: ${executionResult.projectType?.toUpperCase() || projectType.toUpperCase()}` });
    
    if (executionResult.framework && executionResult.framework !== 'none') {
        flow.push({ step: 'Framework Identification', status: 'success', detail: `Framework: ${executionResult.framework}` });
    }
    
    if (executionResult.entryFile) {
        flow.push({ step: 'Entry Point Found', status: 'success', detail: `Entry file: ${executionResult.entryFile}` });
    }

    // ─── Dependencies Setup ────────────────────────────────────────
    if (executionResult.executedCommands && executionResult.executedCommands[0].includes('install')) {
        flow.push({ step: 'Installing Dependencies', status: 'success', detail: executionResult.executedCommands[0] });
    }

    // ─── Application Execution ───────────────────────────────────────
    flow.push({ step: 'Starting Application', status: executionResult.success ? 'success' : 'error', detail: `Command: ${executionResult.executedCommands?.join(' && ') || 'Unknown'}` });
    
    if (executionResult.logs && executionResult.logs.trim()) {
        flow.push({ step: 'Application Output', status: 'success', detail: `Logs: ${executionResult.logs.split('\n')[0]}${executionResult.logs.split('\n').length > 1 ? '...' : ''}` });
    }

    // ─── Execution Summary ──────────────────────────────────────────
    flow.push({
        step: 'Execution Complete',
        status: executionResult.success ? 'success' : 'error',
        detail: `${executionResult.projectType?.toUpperCase() || projectType.toUpperCase()} project ${executionResult.success ? 'executed successfully' : 'execution failed'} in ${executionResult.executionTime || 0}ms`
    });

    return flow;
}

module.exports = { generate };
