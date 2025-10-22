"use client";

import React, { useState, useEffect } from 'react';
import type { ExcalidrawPlugin, PluginUIProps } from '../../core/types';
import { AICanvasController } from '../../core/ai-interaction/AICanvasController';
import { ObjectManager } from '../../core/canvas-objects/ObjectManager';

/**
 * Marketing Collaboration Plugin
 *
 * Use Case: AI agent collaborates with marketer on canvas
 * - Import images, products, website previews
 * - AI suggests improvements and variations
 * - Group and organize marketing materials
 * - Export to various platforms
 */
export const MarketingCollaborationPlugin: ExcalidrawPlugin = {
  id: 'marketing-collaboration',
  name: 'AI Marketing Collaborator',
  version: '1.0.0',
  type: 'ai-chat',

  capabilities: {
    requiresAuth: true,
    requiresNetwork: true,
    permissions: ['canvas:read', 'canvas:write', 'ai-access', 'file-upload'],
  },

  ui: {
    toolbar: [MarketingToolbarButton],
    sidebar: [MarketingSidebar],
    contextMenu: [
      {
        id: 'ai-improve-design',
        label: 'AI: Improve this design',
        onClick: (context) => {
          context.framework.emit('marketing:improve-selection', {
            selectedIds: context.canvas.appState.selectedElementIds || [],
          });
        },
        condition: (context) => {
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
      {
        id: 'generate-variations',
        label: 'AI: Generate variations',
        onClick: (context) => {
          context.framework.emit('marketing:generate-variations', {
            selectedIds: context.canvas.appState.selectedElementIds || [],
          });
        },
        condition: (context) => {
          return (context.canvas.appState.selectedElementIds?.length || 0) > 0;
        },
      },
      {
        id: 'export-selection',
        label: 'Export to platform...',
        onClick: (context) => {
          context.framework.emit('marketing:export-selection', {
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
    defaultImageSize: { width: 300, height: 200 },
    supportedPlatforms: ['facebook-ads', 'instagram', 'shopify', 'mailchimp'],
  },
};

const MarketingToolbarButton: React.FC<PluginUIProps> = () => {
  return (
    <button
      className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-md hover:from-pink-600 hover:to-purple-600"
      title="AI Marketing Collaborator"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
        />
      </svg>
      <span>Marketing AI</span>
    </button>
  );
};

const MarketingSidebar: React.FC<PluginUIProps> = ({ context }) => {
  const [aiController, setAIController] = useState<AICanvasController | null>(null);
  const [campaign, setCampaign] = useState('');
  const [activeCampaign, setActiveCampaign] = useState(false);
  const [importedAssets, setImportedAssets] = useState<number>(0);

  useEffect(() => {
    const controller = new AICanvasController(
      context.framework,
      'marketing-collaboration',
      `campaign_${Date.now()}`,
      new ObjectManager({ strategy: 'grid', columns: 3, padding: 30 })
    );
    setAIController(controller);
  }, [context.framework]);

  const startCampaign = () => {
    if (!campaign.trim() || !aiController) return;
    setActiveCampaign(true);

    // Create chat window for campaign planning
    aiController.createChatWindow(
      [
        {
          id: '1',
          role: 'assistant',
          content: `Great! Let's work on "${campaign}"\n\nI can help you:\n• Import product images\n• Create ad variations\n• Organize assets\n• Export to platforms\n\nWhat would you like to start with?`,
          timestamp: new Date(),
        },
      ],
      { x: 50, y: 50 }
    );

    // Create AI agent avatar
    aiController.createAgentAvatar(
      'Marketing Assistant',
      `Working on: ${campaign}`,
      { x: 550, y: 50 }
    );
  };

  const importProducts = () => {
    if (!aiController) return;

    // Simulate importing products
    const products = [
      { name: 'Summer Dress', price: '$49.99', image: 'dress.jpg' },
      { name: 'Beach Sandals', price: '$29.99', image: 'sandals.jpg' },
      { name: 'Sunglasses', price: '$39.99', image: 'sunglasses.jpg' },
      { name: 'Beach Bag', price: '$34.99', image: 'bag.jpg' },
    ];

    products.forEach((product, idx) => {
      aiController.createCard(
        product.name,
        `Price: ${product.price}`,
        [
          { label: 'SKU', value: `PROD-${1000 + idx}` },
          { label: 'Status', value: 'In Stock' },
        ],
        undefined,
        undefined
      );
    });

    setImportedAssets(products.length);
  };

  const generateAdVariations = () => {
    if (!aiController) return;

    // Create variations as image cards
    const variations = ['Bright', 'Minimal', 'Bold'];
    variations.forEach((style) => {
      aiController.createCard(
        `${style} Ad Variation`,
        `AI-generated ${style.toLowerCase()} style`,
        [{ label: 'Style', value: style }],
        undefined,
        undefined
      );
    });
  };

  const importOptions = [
    {
      label: 'Shopify Products',
      icon: '🛍️',
      action: importProducts,
    },
    {
      label: 'Upload Images',
      icon: '📸',
      action: () => console.log('Upload images'),
    },
    {
      label: 'Website Preview',
      icon: '🌐',
      action: () => {
        if (aiController) {
          aiController.createWebsitePreview(
            'https://example.com',
            'Landing Page Preview'
          );
        }
      },
    },
    {
      label: 'Stock Photos',
      icon: '🖼️',
      action: () => {
        if (aiController) {
          aiController.createImage(
            'https://via.placeholder.com/400x300',
            'Stock photo',
            { width: 400, height: 300 }
          );
          setImportedAssets((prev) => prev + 1);
        }
      },
    },
  ];

  const aiActions = [
    {
      label: 'Generate Ad Copy',
      icon: '✍️',
      action: () => {
        if (aiController) {
          aiController.createTextBlock(
            `🎉 Summer Sale!\n\nGet 30% off all beach essentials.\n\nLimited time only!`,
            'plain'
          );
        }
      },
    },
    {
      label: 'Create Variations',
      icon: '🎨',
      action: generateAdVariations,
    },
    {
      label: 'A/B Test Ideas',
      icon: '📊',
      action: () => {
        if (aiController) {
          ['Version A', 'Version B', 'Version C'].forEach((version) => {
            aiController.createCard(
              version,
              'AI-generated test variation',
              [
                { label: 'CTR Prediction', value: `${Math.random() * 5 + 1}%` },
                { label: 'Confidence', value: 'High' },
              ]
            );
          });
        }
      },
    },
  ];

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-pink-50 to-purple-50">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <h3 className="font-semibold text-gray-800">Marketing Collaborator</h3>
        <p className="text-xs text-gray-600 mt-1">
          {activeCampaign ? `📋 ${campaign}` : 'No active campaign'}
        </p>
      </div>

      {/* Campaign Setup */}
      {!activeCampaign && (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="E.g., Summer Sale 2024"
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            onClick={startCampaign}
            disabled={!campaign.trim()}
            className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-md font-medium hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
          >
            Start Campaign
          </button>
        </div>
      )}

      {/* Active Campaign */}
      {activeCampaign && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-2xl font-bold text-purple-600">{importedAssets}</div>
              <div className="text-xs text-gray-600">Assets</div>
            </div>
            <div className="bg-white p-3 rounded shadow-sm">
              <div className="text-2xl font-bold text-pink-600">
                {context.canvas.elements.length}
              </div>
              <div className="text-xs text-gray-600">Objects</div>
            </div>
          </div>

          {/* Import Section */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Import Assets</div>
            <div className="grid grid-cols-2 gap-2">
              {importOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={option.action}
                  className="flex flex-col items-center p-3 bg-white rounded border hover:border-purple-500 hover:shadow transition-all"
                >
                  <span className="text-2xl mb-1">{option.icon}</span>
                  <span className="text-xs text-center">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Actions */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">AI Actions</div>
            <div className="space-y-2">
              {aiActions.map((action) => (
                <button
                  key={action.label}
                  onClick={action.action}
                  className="w-full flex items-center space-x-2 px-3 py-2 bg-white rounded border hover:border-purple-500 hover:shadow transition-all"
                >
                  <span className="text-lg">{action.icon}</span>
                  <span className="text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export Section */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Export To</div>
            <div className="space-y-1">
              {['Facebook Ads', 'Instagram', 'Shopify', 'Mailchimp'].map((platform) => (
                <button
                  key={platform}
                  className="w-full px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm rounded hover:from-pink-600 hover:to-purple-600"
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* End Campaign */}
          <button
            onClick={() => setActiveCampaign(false)}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300"
          >
            End Campaign
          </button>
        </div>
      )}
    </div>
  );
};
