"use client";

import React, { useState, useEffect } from 'react';
import type { ExcalidrawPlugin, PluginUIProps } from '../../core/types';
import { AICanvasController } from '../../core/ai-interaction/AICanvasController';
import { ObjectManager } from '../../core/canvas-objects/ObjectManager';

/**
 * Coding Collaboration Plugin
 *
 * Use Case: AI agent collaborates with developer on canvas
 * - Chat window for conversation
 * - VM window showing terminal/execution
 * - Code snippets and documentation
 * - Test results and outputs
 */
export const CodingCollaborationPlugin: ExcalidrawPlugin = {
  id: 'coding-collaboration',
  name: 'AI Coding Collaborator',
  version: '1.0.0',
  type: 'ai-chat',

  capabilities: {
    requiresAuth: true,
    requiresNetwork: true,
    permissions: ['canvas:read', 'canvas:write', 'ai-access'],
  },

  ui: {
    toolbar: [CodingToolbarButton],
    sidebar: [CodingSidebar],
    contextMenu: [
      {
        id: 'run-code',
        label: 'AI: Run this code',
        onClick: (context) => {
          context.framework.emit('coding:run-selection', {
            selectedIds: context.canvas.appState.selectedElementIds || [],
          });
        },
        condition: (context) => {
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
      {
        id: 'explain-code',
        label: 'AI: Explain this code',
        onClick: (context) => {
          context.framework.emit('coding:explain-selection', {
            selectedIds: context.canvas.appState.selectedElementIds || [],
          });
        },
        condition: (context) => {
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
      {
        id: 'debug-code',
        label: 'AI: Debug this',
        onClick: (context) => {
          context.framework.emit('coding:debug-selection', {
            selectedIds: context.canvas.appState.selectedElementIds || [],
          });
        },
        condition: (context) => {
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
    ],
  },

  config: {
    defaultLanguage: 'typescript',
    autoRunTests: true,
    showVMOutput: true,
  },
};

const CodingToolbarButton: React.FC<PluginUIProps> = () => {
  return (
    <button
      className="flex items-center space-x-2 px-3 py-2 bg-gray-900 text-green-400 rounded-md hover:bg-gray-800 font-mono text-sm"
      title="AI Coding Collaborator"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
      <span>Code AI</span>
    </button>
  );
};

const CodingSidebar: React.FC<PluginUIProps> = ({ context }) => {
  const [aiController, setAIController] = useState<AICanvasController | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [currentTask, setCurrentTask] = useState('');
  const [vmWindows, setVMWindows] = useState<string[]>([]);

  useEffect(() => {
    const controller = new AICanvasController(
      context.framework,
      'coding-collaboration',
      `coding_${Date.now()}`,
      new ObjectManager({ strategy: 'grid', columns: 2 })
    );
    setAIController(controller);
  }, [context.framework]);

  const startCodingSession = async () => {
    if (!aiController || !currentTask) return;

    setSessionActive(true);

    // Create chat window for conversation
    const chatWindow = aiController.createChatWindow(
      [
        {
          id: '1',
          role: 'system',
          content: `Coding Session Started\nTask: ${currentTask}`,
          timestamp: new Date(),
        },
      ],
      { x: 50, y: 50 }
    );

    // Create VM window for execution
    const vmWindow = aiController.createVMWindow(
      'npm test',
      ['$ npm test', '', 'Running tests...'],
      { x: 500, y: 50 }
    );

    setVMWindows([vmWindow.id]);

    // Simulate AI working
    setTimeout(() => {
      aiController.updateVMWindow(vmWindow.id, [
        '$ npm test',
        '',
        '> test',
        '> jest',
        '',
        'PASS  src/components/Button.test.tsx',
        '  ✓ renders correctly (23ms)',
        '  ✓ handles click events (15ms)',
        '',
        'Test Suites: 1 passed, 1 total',
        'Tests:       2 passed, 2 total',
        'Snapshots:   0 total',
        'Time:        2.341s',
      ]);

      // Add chat message
      aiController.addChatMessage(
        chatWindow.id,
        'assistant',
        'Tests are passing! I can help you:\n\n1. Add more test coverage\n2. Refactor components\n3. Fix any issues\n\nWhat would you like to work on?'
      );
    }, 2000);
  };

  const quickActions = [
    {
      label: 'Run Tests',
      action: () => {
        if (!aiController) return;
        const vm = aiController.createVMWindow('npm test', ['$ npm test', 'Running...']);
        setVMWindows((prev) => [...prev, vm.id]);
      },
    },
    {
      label: 'Type Check',
      action: () => {
        if (!aiController) return;
        const vm = aiController.createVMWindow('tsc --noEmit', ['$ tsc --noEmit', 'Checking...']);
        setVMWindows((prev) => [...prev, vm.id]);
      },
    },
    {
      label: 'Lint Code',
      action: () => {
        if (!aiController) return;
        const vm = aiController.createVMWindow('eslint .', ['$ eslint .', 'Linting...']);
        setVMWindows((prev) => [...prev, vm.id]);
      },
    },
    {
      label: 'Build Project',
      action: () => {
        if (!aiController) return;
        const vm = aiController.createVMWindow('npm run build', ['$ npm run build', 'Building...']);
        setVMWindows((prev) => [...prev, vm.id]);
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <h3 className="font-mono font-semibold text-green-400">Code Collaborator</h3>
        <p className="text-xs text-gray-400 mt-1">
          {sessionActive ? '● Active Session' : '○ Inactive'}
        </p>
      </div>

      {/* Session Setup */}
      {!sessionActive && (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">
              What are we working on?
            </label>
            <textarea
              value={currentTask}
              onChange={(e) => setCurrentTask(e.target.value)}
              placeholder="E.g., Add user authentication, fix login bug, write tests..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-green-500"
              rows={3}
            />
          </div>
          <button
            onClick={startCodingSession}
            disabled={!currentTask.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Start Coding Session
          </button>
        </div>
      )}

      {/* Active Session */}
      {sessionActive && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Task */}
          <div className="bg-gray-800 p-3 rounded border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Current Task</div>
            <div className="text-sm">{currentTask}</div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="text-xs text-gray-400 mb-2">Quick Actions</div>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((qa) => (
                <button
                  key={qa.label}
                  onClick={qa.action}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-xs hover:bg-gray-700 hover:border-green-600"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          </div>

          {/* VM Windows */}
          <div>
            <div className="text-xs text-gray-400 mb-2">
              Active VMs ({vmWindows.length})
            </div>
            <div className="space-y-1">
              {vmWindows.map((id, idx) => (
                <div
                  key={id}
                  className="text-xs bg-gray-800 px-2 py-1 rounded border border-gray-700 font-mono"
                >
                  VM {idx + 1}: {id.slice(0, 12)}...
                </div>
              ))}
            </div>
          </div>

          {/* AI Suggestions */}
          <div className="bg-green-900 bg-opacity-20 p-3 rounded border border-green-800">
            <div className="text-xs text-green-400 font-medium mb-2">💡 AI Suggestions</div>
            <ul className="text-xs space-y-1 text-gray-300">
              <li>• Tests are passing - good coverage!</li>
              <li>• Consider adding error boundaries</li>
              <li>• Type definitions could be more specific</li>
            </ul>
          </div>

          {/* End Session */}
          <button
            onClick={() => setSessionActive(false)}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
          >
            End Session
          </button>
        </div>
      )}
    </div>
  );
};
