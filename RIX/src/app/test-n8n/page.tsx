'use client';

import { N8NWorkflowManager } from '@/components/n8n/n8n-workflow-manager';

export default function TestN8NPage() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">N8N Workflow Manager Test</h1>
                <p className="text-muted-foreground">
                    Test der N8N Workflow Manager Komponente mit Mock-Daten
                </p>
            </div>

            <N8NWorkflowManager
                onWorkflowSelect={(workflow) => {
                    console.log('Selected workflow:', workflow);
                    alert(`Workflow ausgewählt: ${workflow.name}`);
                }}
                autoRefresh={true}
            />
        </div>
    );
} 