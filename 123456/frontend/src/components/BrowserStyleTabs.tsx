import React from 'react';
import './BrowserStyleTabs.css';

export interface TabItem<T = string> {
  id: T;
  label: string;
  icon?: React.ComponentType<any>;
  count?: number;
}

interface BrowserStyleTabsProps<T = string> {
  tabs: TabItem<T>[];
  activeTab: T;
  onTabChange: (tabId: T) => void;
  ariaLabel?: string;
  children?: React.ReactNode;
}

export function BrowserStyleTabs<T extends string>({
  tabs,
  activeTab,
  onTabChange,
  ariaLabel = 'Dashboard Navigation Tabs',
  children
}: BrowserStyleTabsProps<T>) {
  return (
    <div className="chrome-tabs-wrapper">
      {/* Top Chrome Tab Bar */}
      <div className="chrome-tabs-bar" role="tablist" aria-label={ariaLabel}>
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              type="button"
              className={`chrome-tab ${isActive ? 'chrome-tab-active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <span className="chrome-tab-inner">
                {Icon && (
                  <Icon
                    size={15}
                    style={{
                      color: isActive ? '#0B3B70' : '#526784',
                      flexShrink: 0
                    }}
                  />
                )}
                <span className="chrome-tab-label">
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className={`chrome-tab-count ${isActive ? 'chrome-tab-count-active' : ''}`}>
                      ({tab.count})
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Connected Content Panel */}
      {children && (
        <div
          className="chrome-tabs-content"
          role="tabpanel"
          id={`tabpanel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
