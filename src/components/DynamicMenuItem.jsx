import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Circle, Dot } from 'lucide-react';
import { getIconComponent } from '../utils/iconMapping';

/**
 * Komponen untuk render menu item dynamic
 * Mendukung nested menu dengan unlimited depth
 */
const DynamicMenuItem = ({
  item,
  shouldShowExpanded,
  expandedMenus,
  onToggleMenu,
  depth = 0
}) => {
  const location = useLocation();
  
  // Get icon component dari mapping
  const IconComponent = getIconComponent(item.icon);
  
  // Check apakah menu ini atau child-nya yang aktif
  const isMenuActive = (menuItem) => {
    if (menuItem.url) {
      return location.pathname === menuItem.url;
    }
    if (menuItem.children && menuItem.children.length > 0) {
      return menuItem.children.some(child => isMenuActive(child));
    }
    return false;
  };
  
  const isActive = isMenuActive(item);
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedMenus[item.id] || expandedMenus[item.nama];
  
  // Styling berdasarkan depth untuk indentasi dan visual hierarchy
  const getIndentClass = (currentDepth) => {
    const baseIndent = currentDepth * 8; // 8 = 2rem in Tailwind
    return `ml-${Math.min(baseIndent, 32)}`; // Max 32 (8rem)
  };

  // Get hierarchy indicator based on depth
  const getHierarchyIndicator = (currentDepth) => {
    if (currentDepth === 0) return null;
    
    const indicators = [
      <Circle key="level1" className="w-1.5 h-1.5 text-emerald-400" />,
      <Dot key="level2" className="w-1 h-1 text-emerald-300" />,
      <div key="level3" className="w-1 h-1 bg-emerald-200 rounded-full" />
    ];
    
    return indicators[Math.min(currentDepth - 1, 2)] || indicators[2];
  };
  
  // Handle click menu
  const handleMenuClick = () => {
    if (hasChildren) {
      onToggleMenu(item.id || item.nama, depth);
    }
  };

  if (hasChildren) {
    // Menu dengan submenu
    // Check if this menu also has a URL (child+parent case)
    const hasUrl = item.url && item.url !== '#';
    
    return (
      <li>
        <div>
          {hasUrl ? (
            // Child+Parent: Menu has both children AND URL
            <div className="flex items-center">
              <Link
                to={item.url}
                className={`flex-1 flex items-center px-3 py-2.5 rounded-l-lg sidebar-item-hover transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-900 text-white shadow-lg'
                    : 'text-emerald-200 hover:bg-emerald-700/50 hover:text-white'
                } ${depth > 0 ? getIndentClass(depth) : ''}`}
              >
                <div className="flex items-center flex-1">
                  {/* Hierarchy indicator */}
                  {depth > 0 && (
                    <div className="mr-2 flex-shrink-0">
                      {getHierarchyIndicator(depth)}
                    </div>
                  )}
                  
                  {/* Icon with enhanced styling */}
                  {IconComponent && (
                    <div className={`flex-shrink-0 ${depth === 0 ? 'p-1 bg-emerald-700/30 rounded-md' : ''}`}>
                      <IconComponent className={`${depth === 0 ? 'w-5 h-5' : 'w-4 h-4'} transition-colors duration-200`} />
                    </div>
                  )}
                  
                  {shouldShowExpanded && (
                    <div className="flex items-center ml-3">
                      <span className={`font-medium sidebar-content-fade sidebar-text-slide transition-colors duration-200 ${
                        depth === 0 ? 'text-sm font-semibold' : 'text-sm'
                      }`}>
                        {item.nama}
                      </span>
                      {item.badge && (
                        <span className="ml-2 bg-emerald-100 text-emerald-600 text-xs px-2 py-1 rounded-full font-medium">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
              {shouldShowExpanded && (
                <button
                  onClick={handleMenuClick}
                  className={`px-2 py-2.5 rounded-r-lg sidebar-item-hover transition-all duration-200 ${
                    isActive
                      ? 'bg-emerald-900 text-white'
                      : 'text-emerald-200 hover:bg-emerald-700/50 hover:text-white'
                  }`}
                  title="Toggle submenu"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
                  )}
                </button>
              )}
            </div>
          ) : (
            // Regular Parent: Menu only has children, no URL
            <button
              onClick={handleMenuClick}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg sidebar-item-hover transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-900 text-white shadow-lg'
                  : 'text-emerald-200 hover:bg-emerald-700/50 hover:text-white'
              } ${depth > 0 ? getIndentClass(depth) : ''}`}
            >
              <div className="flex items-center">
                {/* Hierarchy indicator */}
                {depth > 0 && (
                  <div className="mr-2 flex-shrink-0">
                    {getHierarchyIndicator(depth)}
                  </div>
                )}
                
                {/* Icon with enhanced styling */}
                {IconComponent && (
                  <div className={`flex-shrink-0 ${depth === 0 ? 'p-1 bg-emerald-700/30 rounded-md' : ''}`}>
                    <IconComponent className={`${depth === 0 ? 'w-5 h-5' : 'w-4 h-4'} transition-colors duration-200`} />
                  </div>
                )}
                
                {shouldShowExpanded && (
                  <div className="flex items-center ml-3">
                    <span className={`font-medium sidebar-content-fade sidebar-text-slide transition-colors duration-200 ${
                      depth === 0 ? 'text-sm font-semibold' : 'text-sm'
                    }`}>
                      {item.nama}
                    </span>
                    {item.badge && (
                      <span className="ml-2 bg-emerald-100 text-emerald-600 text-xs px-2 py-1 rounded-full font-medium">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {shouldShowExpanded && (
                <div className="flex items-center">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-emerald-200 flex-shrink-0 transition-transform duration-200" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-emerald-200 flex-shrink-0 transition-transform duration-200" />
                  )}
                </div>
              )}
            </button>
          )}
          
          {/* Submenu with enhanced styling */}
          {shouldShowExpanded && isExpanded && (
            <div className="mt-1 ml-2 border-l-2 border-emerald-600/30 pl-2">
              <ul className="space-y-1 submenu-slide-down">
                {item.children.map((child, childIndex) => (
                  <DynamicMenuItem
                    key={child.id || child.nama || childIndex}
                    item={child}
                    shouldShowExpanded={shouldShowExpanded}
                    expandedMenus={expandedMenus}
                    onToggleMenu={onToggleMenu}
                    depth={depth + 1}
                  />
                ))}
              </ul>
            </div>
          )}
        </div>
      </li>
    );
  } else {
    // Menu langsung (leaf node)
    const menuContent = (
      <div className="flex items-center">
        {/* Hierarchy indicator */}
        {depth > 0 && (
          <div className="mr-2 flex-shrink-0">
            {getHierarchyIndicator(depth)}
          </div>
        )}
        
        {/* Icon with enhanced styling */}
        {IconComponent && (
          <div className={`flex-shrink-0 ${depth === 0 ? 'p-1 bg-emerald-700/30 rounded-md' : ''}`}>
            <IconComponent className={`${depth === 0 ? 'w-5 h-5' : 'w-4 h-4'} transition-colors duration-200`} />
          </div>
        )}
        
        {shouldShowExpanded && (
          <span className={`ml-3 font-medium sidebar-content-fade sidebar-text-slide transition-colors duration-200 ${
            depth === 0 ? 'text-sm font-semibold' : 'text-sm'
          }`}>
            {item.nama}
          </span>
        )}
        {item.badge && shouldShowExpanded && (
          <span className="ml-2 bg-emerald-100 text-emerald-600 text-xs px-2 py-1 rounded-full font-medium">
            {item.badge}
          </span>
        )}
      </div>
    );

    return (
      <li>
        {item.url ? (
          <Link
            to={item.url}
            className={`flex items-center px-3 py-2.5 rounded-lg sidebar-item-hover transition-all duration-200 ${
              isActive
                ? 'bg-emerald-900 text-white shadow-lg'
                : 'text-emerald-200 hover:bg-emerald-700/50 hover:text-white'
            } ${depth > 0 ? getIndentClass(depth) : ''}`}
            onClick={() => {
              // Navigation handled by React Router Link
            }}
          >
            {menuContent}
          </Link>
        ) : (
          <div
            className={`flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-emerald-900 text-white shadow-lg'
                : 'text-emerald-200'
            } ${depth > 0 ? getIndentClass(depth) : ''}`}
          >
            {menuContent}
          </div>
        )}
      </li>
    );
  }
};

/**
 * Komponen untuk render daftar menu dynamic
 */
export const DynamicMenuList = ({
  menuItems,
  shouldShowExpanded,
  expandedMenus,
  onToggleMenu
}) => {
  if (!menuItems || menuItems.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="text-emerald-300 text-sm">
          {shouldShowExpanded ? 'Tidak ada menu tersedia' : '...'}
        </div>
      </div>
    );
  }

  return (
    <ul className="space-y-2 px-2">
      {menuItems.map((item, index) => (
        <DynamicMenuItem
          key={item.id || item.nama || index}
          item={item}
          shouldShowExpanded={shouldShowExpanded}
          expandedMenus={expandedMenus}
          onToggleMenu={onToggleMenu}
          depth={0}
        />
      ))}
    </ul>
  );
};

export default DynamicMenuItem;
