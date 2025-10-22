"use client";

import React, { useState, Suspense } from 'react';
import { useExcalidrawFramework } from '../core/ExcalidrawProvider';
import type { LayoutProps } from '../core/types';

// Lazy-load Excalidraw to avoid SSR issues and heavy initial bundles
const Excalidraw: React.LazyExoticComponent<React.ComponentType<any>> = React.lazy(async () => {
  // NOTE: using local shim to avoid pulling in workspace Excalidraw sources during build
  const mod = await import("../types/excalidraw-shim");
  return { default: (mod as any).default as React.ComponentType<any> };
});

interface ExcalidrawLayoutProps extends LayoutProps {
  layoutType?: 'canvas' | 'hybrid' | 'minimal';
  canvasId?: string;
  onViewToggle?: (view: 'canvas' | 'traditional') => void;
}

export const ExcalidrawLayout: React.FC<ExcalidrawLayoutProps> = ({
  children,
  layoutType = 'canvas',
  showHeader = true,
  showToolbar = true,
  showSidebar = false,
  canvasId,
  onViewToggle,
  headerComponent: HeaderComponent,
  toolbarComponent: ToolbarComponent,
  sidebarComponent: SidebarComponent,
}) => {
  const { user, isLoading, error } = useExcalidrawFramework();
  const [currentView, setCurrentView] = useState<'canvas' | 'traditional'>('canvas');

  // Auth guard
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Please sign in to access the canvas</div>
      </div>
    );
  }

  const handleViewToggle = (view: 'canvas' | 'traditional') => {
    setCurrentView(view);
    onViewToggle?.(view);
  };

  switch (layoutType) {
    case 'canvas':
      return <CanvasLayout
        showHeader={showHeader}
        showToolbar={showToolbar}
        showSidebar={showSidebar}
        HeaderComponent={HeaderComponent}
        ToolbarComponent={ToolbarComponent}
        SidebarComponent={SidebarComponent}
        canvasId={canvasId}
      />;

    case 'hybrid':
      return <HybridLayout
        currentView={currentView}
        onViewToggle={handleViewToggle}
        showHeader={showHeader}
        showToolbar={showToolbar}
        showSidebar={showSidebar}
        HeaderComponent={HeaderComponent}
        ToolbarComponent={ToolbarComponent}
        SidebarComponent={SidebarComponent}
        canvasId={canvasId}
      >
        {children}
      </HybridLayout>;

    case 'minimal':
      return <MinimalLayout canvasId={canvasId} />;

    default:
      return <CanvasLayout canvasId={canvasId} />;
  }
};

// Canvas-only layout
const CanvasLayout: React.FC<{
  showHeader?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  HeaderComponent?: React.ComponentType;
  ToolbarComponent?: React.ComponentType;
  SidebarComponent?: React.ComponentType;
  canvasId?: string;
}> = ({
  showHeader,
  showToolbar,
  showSidebar,
  HeaderComponent,
  ToolbarComponent,
  SidebarComponent,
  canvasId,
}) => {
  return (
    <div className="h-screen flex flex-col">
      {showHeader && (
        <header className="h-16 border-b flex items-center px-4 bg-white">
          {HeaderComponent ? <HeaderComponent /> : <DefaultHeader />}
        </header>
      )}

      <div className="flex-1 flex">
        {showSidebar && (
          <aside className="w-64 border-r bg-gray-50">
            {SidebarComponent ? <SidebarComponent /> : <DefaultSidebar />}
          </aside>
        )}

        <main className="flex-1 relative">
          {showToolbar && (
            <div className="absolute top-4 left-4 z-10">
              {ToolbarComponent ? <ToolbarComponent /> : <DefaultToolbar />}
            </div>
          )}

          <ExcalidrawCanvas canvasId={canvasId} />
        </main>
      </div>
    </div>
  );
};

// Hybrid layout with view toggle
const HybridLayout: React.FC<{
  children: React.ReactNode;
  currentView: 'canvas' | 'traditional';
  onViewToggle: (view: 'canvas' | 'traditional') => void;
  showHeader?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  HeaderComponent?: React.ComponentType;
  ToolbarComponent?: React.ComponentType;
  SidebarComponent?: React.ComponentType;
  canvasId?: string;
}> = ({
  children,
  currentView,
  onViewToggle,
  showHeader,
  showToolbar,
  showSidebar,
  HeaderComponent,
  ToolbarComponent,
  SidebarComponent,
  canvasId,
}) => {
  return (
    <div className="h-screen flex flex-col">
      {showHeader && (
        <header className="h-16 border-b flex items-center justify-between px-4 bg-white">
          <div>
            {HeaderComponent ? <HeaderComponent /> : <DefaultHeader />}
          </div>

          {/* View Toggle */}
          <div className="flex rounded-lg border p-1">
            <button
              onClick={() => onViewToggle('traditional')}
              className={`px-3 py-1 rounded text-sm ${
                currentView === 'traditional'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Traditional
            </button>
            <button
              onClick={() => onViewToggle('canvas')}
              className={`px-3 py-1 rounded text-sm ${
                currentView === 'canvas'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Canvas
            </button>
          </div>
        </header>
      )}

      <div className="flex-1">
        {currentView === 'traditional' ? (
          <div className="h-full">
            {children}
          </div>
        ) : (
          <CanvasLayout
            showHeader={false}
            showToolbar={showToolbar}
            showSidebar={showSidebar}
            ToolbarComponent={ToolbarComponent}
            SidebarComponent={SidebarComponent}
            canvasId={canvasId}
          />
        )}
      </div>
    </div>
  );
};

// Minimal layout (just canvas)
const MinimalLayout: React.FC<{ canvasId?: string }> = ({ canvasId }) => {
  return (
    <div className="h-screen w-screen">
      <ExcalidrawCanvas canvasId={canvasId} />
    </div>
  );
};

// Canvas component
const ExcalidrawCanvas: React.FC<{ canvasId?: string }> = ({ canvasId }) => {
  const { api } = useExcalidrawFramework();
  const [initialData, setInitialData] = useState(null);

  // Load canvas data if canvasId provided
  React.useEffect(() => {
    if (canvasId) {
      api.loadCanvas(canvasId);
    }
  }, [canvasId, api]);

  const handleChange = (elements: any, appState: any, files: any) => {
    // Notify plugin manager
    api.emit('elements:changed', elements);
    api.emit('appstate:changed', appState);
  };

  return (
    <div className="h-full w-full">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-full">
            <div className="text-lg">Loading Excalidraw...</div>
          </div>
        }
      >
        <Excalidraw
          initialData={initialData}
          onChange={handleChange}
          zenModeEnabled={false}
          viewModeEnabled={false}
        />
      </Suspense>
    </div>
  );
};

// Default components
const DefaultHeader: React.FC = () => (
  <div className="flex items-center space-x-4">
    <h1 className="text-xl font-semibold">Excalidraw</h1>
  </div>
);

const DefaultToolbar: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm border p-2">
    <div className="text-sm text-gray-500">Toolbar</div>
  </div>
);

const DefaultSidebar: React.FC = () => (
  <div className="p-4">
    <div className="text-sm text-gray-500">Sidebar</div>
  </div>
);