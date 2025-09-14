import {
  Home, Users, Package, FileText, Settings, Menu, LogOut,
  ChevronDown, ChevronRight, Shield, Beef, DollarSign,
  ShoppingCart, TrendingUp, RotateCcw, Truck, UserCheck, Key,
  Building2, ArrowLeft, Plus, Search, Filter, Download, Eye, Edit, Trash2, Syringe,
  BarChart3, Receipt, Database, Zap, Globe, Lock, Bell, Mail,
  Calendar, Clock, MapPin, Phone, CreditCard, Bookmark,
  Tag, Archive, Folder, FolderOpen, Star, Heart, Flag,
  AlertCircle, CheckCircle, XCircle, Info, HelpCircle,
  Layers, Grid, List, Table, PieChart, LineChart, Activity,
  Cpu, HardDrive, Wifi, Bluetooth, Battery, Power,
  Camera, Image, Video, Music, Headphones, Mic,
  Printer, Monitor, Keyboard, Mouse, Smartphone,
  Tablet, Laptop, Server, Cloud, CloudDownload, CloudUpload
} from 'lucide-react';

/**
 * Mapping icon string ke komponen Lucide React
 * Digunakan untuk render icon dynamic dari backend
 */
export const ICON_MAPPING = {
  // Navigation & Layout
  'home': Home,
  'menu': Menu,
  'grid': Grid,
  'layers': Layers,
  'list': List,
  'table': Table,
  
  // Business & Office
  'building': Building2,
  'users': Users,
  'user-check': UserCheck,
  'package': Package,
  'shopping-cart': ShoppingCart,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  'receipt': Receipt,
  'credit-card': CreditCard,
  
  // Data & Analytics
  'database': Database,
  'bar-chart': BarChart3,
  'pie-chart': PieChart,
  'line-chart': LineChart,
  'activity': Activity,
  
  // Documents & Files
  'file-text': FileText,
  'folder': Folder,
  'folder-open': FolderOpen,
  'archive': Archive,
  'bookmark': Bookmark,
  
  // System & Security
  'settings': Settings,
  'system': Settings,
  'parameter': Settings,
  'shield': Shield,
  'lock': Lock,
  'key': Key,
  'zap': Zap,
  
  // Communication
  'mail': Mail,
  'phone': Phone,
  'bell': Bell,
  'globe': Globe,
  
  // Medical & Health (untuk sistem peternakan)
  'syringe': Syringe,
  'beef': Beef,
  'heart': Heart,
  
  // Time & Calendar
  'calendar': Calendar,
  'clock': Clock,
  
  // Location
  'map-pin': MapPin,
  'truck': Truck,
  
  // Actions
  'plus': Plus,
  'search': Search,
  'filter': Filter,
  'download': Download,
  'eye': Eye,
  'edit': Edit,
  'trash-2': Trash2,
  'rotate-ccw': RotateCcw,
  'arrow-left': ArrowLeft,
  'logout': LogOut,
  
  // Status & Indicators
  'check-circle': CheckCircle,
  'x-circle': XCircle,
  'alert-circle': AlertCircle,
  'info': Info,
  'help-circle': HelpCircle,
  'star': Star,
  'flag': Flag,
  'tag': Tag,
  
  // Chevrons
  'chevron-down': ChevronDown,
  'chevron-right': ChevronRight,
  
  // Technology
  'cpu': Cpu,
  'hard-drive': HardDrive,
  'wifi': Wifi,
  'bluetooth': Bluetooth,
  'battery': Battery,
  'power': Power,
  'server': Server,
  'cloud': Cloud,
  'cloud-download': CloudDownload,
  'cloud-upload': CloudUpload,
  
  // Media
  'camera': Camera,
  'image': Image,
  'video': Video,
  'music': Music,
  'headphones': Headphones,
  'mic': Mic,
  
  // Devices
  'printer': Printer,
  'monitor': Monitor,
  'keyboard': Keyboard,
  'mouse': Mouse,
  'smartphone': Smartphone,
  'tablet': Tablet,
  'laptop': Laptop
};

/**
 * Get icon component berdasarkan string name
 * @param {string} iconName - Nama icon (contoh: 'home', 'users')
 * @param {object} props - Props untuk icon component
 * @returns {JSX.Element|null} Icon component atau null jika tidak ditemukan
 */
export const getIconComponent = (iconName, props = {}) => {
  if (!iconName) return null;
  
  // Normalize icon name (lowercase, replace spaces/underscores with hyphens)
  const normalizedName = iconName
    .toLowerCase()
    .replace(/[_\s]/g, '-')
    .trim();
  
  const IconComponent = ICON_MAPPING[normalizedName];
  
  if (!IconComponent) {
    console.warn(`⚠️ Icon '${iconName}' not found in mapping. Using default Home icon.`);
    return Home;
  }
  
  return IconComponent;
};

/**
 * Render icon component dengan props default
 * @param {string} iconName - Nama icon
 * @param {object} customProps - Custom props untuk icon
 * @returns {JSX.Element} Rendered icon component
 */
export const renderIcon = (iconName, customProps = {}) => {
  const IconComponent = getIconComponent(iconName);
  
  const defaultProps = {
    className: 'w-5 h-5',
    ...customProps
  };
  
  return <IconComponent {...defaultProps} />;
};

/**
 * Get list semua icon yang tersedia
 * @returns {string[]} Array nama icon yang tersedia
 */
export const getAvailableIcons = () => {
  return Object.keys(ICON_MAPPING).sort();
};

/**
 * Check apakah icon tersedia
 * @param {string} iconName - Nama icon
 * @returns {boolean} True jika icon tersedia
 */
export const isIconAvailable = (iconName) => {
  if (!iconName) return false;
  
  const normalizedName = iconName
    .toLowerCase()
    .replace(/[_\s]/g, '-')
    .trim();
    
  return ICON_MAPPING.hasOwnProperty(normalizedName);
};

export default {
  ICON_MAPPING,
  getIconComponent,
  renderIcon,
  getAvailableIcons,
  isIconAvailable
};
