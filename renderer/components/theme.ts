import { createContext, useEffect, useState } from 'react';
import merge from 'deepmerge';

export interface MenuItem {
    id?: number | string;
    label?: string;
    disabled?: boolean;
    hidden?: boolean;
    submenu?: MenuItem[];
    type?: 'normal' | 'separator' | 'submenu' | 'checkbox' | 'radio';
    checked?: boolean;
    icon?: string;
    before?: number | string;
    after?: number | string;
    accelerator?: string;
    click?: (menu: MenuItem, browser: object | undefined, e: Event) => void;
  }
  
  export type Platform = 'win32' | 'linux' | 'darwin';
  
  export interface ControlProps {
    onMinimize?: () => void;
    onMaximize?: () => void;
    onClose?: () => void;
    disableMaximize?: boolean;
    disableMinimize?: boolean;
    maximized?: boolean;
  }
  
  export interface WindowControlsProps extends ControlProps {
    focused?: boolean;
  }
  
  export interface TitleBarProps extends ControlProps {
    onDoubleClick?: (e: React.MouseEvent) => void;
    platform?: Platform;
    children?: React.ReactNode;
    menu?: MenuItem[];
    theme?: TitleBarTheme;
    icon?: React.ReactNode;
    iconSrc?: string;
    title?: string;
    currentWindow?: object;
  }
  
  export type Palette = 'light' | 'dark';
  export type Align = 'left' | 'center' | 'right';
  export interface TitleTheme {
    color?: string;
    align?: Align;
    fontFamily?: string;
    fontWeight?: number | "-moz-initial" | "inherit" | "initial" | "revert" | "unset" | "normal" | "bold" | "bolder" | "lighter";
  }
  
  export interface ColorMap {
    color?: string;
    background?: string;
  }
  
  export interface MenuButtonTheme {
    maxWidth?: number;
    default?: ColorMap;
    hover?: ColorMap;
    active?: ColorMap;
    disabledOpacity?: number;
  }
  
  export interface BarTheme {
    palette?: Palette;
    height?: number | string;
    color?: string;
    background?: string;
    borderBottom?: string;
    inActiveOpacity?: number;
    fontFamily?: string;
    icon?: IconTheme;
    title?: TitleTheme;
    button?: MenuButtonTheme;
  }
  
  export interface ControlButton {
    default?: ColorMap;
    hover?: ColorMap;
  }
  
  export type ControlsLayout = 'right' | 'left';
  
  export interface ControlsTheme {
    border?: string;
    borderRadius?: number | string;
    layout?: ControlsLayout;
    normal?: ControlButton;
    close?: ControlButton;
  }
  
  export interface MenuItemTheme {
    height?: number;
    disabledOpacity?: number;
    default?: ColorMap;
    active?: ColorMap;
  }
  
  export interface SeparatorTheme {
    color?: string;
  }
  
  export interface MenuHeaderTheme {
    show?: boolean;
    color?: string;
  }
  
  export interface AcceleratorTheme {
    color?: string;
  }
  
  export interface IconTheme {
    color?: string;
    width?: number;
    height?: number;
  }
  
  export interface StatusIconTheme {
    highlight?: boolean;
  }
  
  export interface ListTheme {
    minWidth?: number;
    maxWidth?: number;
    marginBottom?: number;
    background?: string;
    boxShadow?: string;
    zIndex?: number;
  }
  
  export interface OverlayTheme {
    background?: string;
    opacity?: number;
    zIndex?: number;
  }
  
  export type MenuStyle = 'default' | 'stacked' | 'vertical';
  
  export interface MenuTheme {
    palette?: Palette;
    style?: MenuStyle;
    item?: MenuItemTheme;
    separator?: SeparatorTheme;
    header?: MenuHeaderTheme;
    accelerator?: AcceleratorTheme;
    icon?: StatusIconTheme;
    list?: ListTheme;
    overlay?: OverlayTheme;
    marginRight?: number;
  }
  
  
  export interface TitleBarTheme {
    platform?: Platform;
    bar?: BarTheme;
    controls?: ControlsTheme;
    menu?: MenuTheme;
  }
  
  export interface MenuBarProps {
    menu?: MenuItem[];
    focused: boolean;
    currentWindow?: object;
  }
  
  export interface MenuItemProps {
    item: MenuItem;
    onClick: (e: any) => void;
    currentWindow?: object;
    depth: number;
    selectedPath: number[];
    dispatch: any;
    idx: number;
  }
  
  export interface HorizontalMenuProps {
    menu: MenuItem[];
    focused: boolean;
    menuBar: React.RefObject<HTMLElement>;
    currentWindow?: object;
  }
  
  export interface VerticalMenuProps {
    menu: MenuItem[];
    focused: boolean;
    currentWindow?: object;
  }
  
  export interface OverflowState {
    menu: MenuItem[];
    index: number;
    hide: boolean;
  }
  
  export type RectResult = {
    bottom: number;
    height: number;
    left: number;
    right: number;
    top: number;
    width: number;
  };
  
  export interface MenuListProps {
    menu: MenuItem[];
    currentWindow?: object;
    depth: number;
    selectedPath: number[];
    dispatch: any;
    subLabel?: string;
  }
  
  export interface FullMenuListProps extends MenuListProps {
    parentRef: React.MutableRefObject<HTMLElement | null>;
  }
  
  export interface MenuButtonProps {
    focused: boolean;
    currentWindow?: object;
    item: MenuItem;
    altKey: boolean;
    style?: object;
    idx: number;
    depth: number;
    selectedPath: number[];
    dispatch: any;
    icon?: JSX.Element;
  }
  
  export interface FullMenuBottonProps extends MenuButtonProps {
    myRef: React.RefObject<HTMLDivElement>;
  }
  
  export interface TitleProps {
    focused: boolean;
    hasIcon: boolean;
    hasMenu: boolean;
    children?: React.ReactNode;
  }
  
  export interface BarProps {
    onDoubleClick?: (e: React.MouseEvent) => void;
    children: React.ReactNode | React.ReactNodeArray;
    bottomBar?: boolean;
  }
  
  export interface WindowButtonProps {
    children: React.ReactNode;
    onClick: (e: React.MouseEvent) => void;
    close: boolean;
    controls: Required<ControlsTheme>;
    platform: Platform;
  }

const menuTheme = {
  dark: <MenuTheme>{
    palette: 'dark',
    style: 'default',
    item: <MenuItemTheme>{
      height: 30,
      disabledOpacity: 0.3,
      default: <ColorMap>{
        color: 'inherit',
        background: 'transparent'
      },
      active: <ColorMap>{
        color: '#fff',
        background: '#0372ef'
      }
    },
    separator: <SeparatorTheme>{
      color: '#e1e4e8'
    },
    header: <MenuHeaderTheme>{
      show: true,
      color: '#6a737d',
    },
    accelerator: <AcceleratorTheme>{
      color: '#6a737d',
    },
    icon: <StatusIconTheme>{
      highlight: true
    },
    list: <ListTheme>{
      minWidth: 200,
      maxWidth: 400,
      marginBottom: 10,
      background: 'rgb(48, 48, 48)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
      zIndex: 2001,
    },
    overlay: <OverlayTheme>{
      background: 'black',
      opacity: 0.4,
      zIndex: 2000
    },
    marginRight: 0
  },
  light: <MenuTheme>{
    palette: 'light',
    item: <MenuItemTheme>{
      default: <ColorMap>{
        color: '#24292e'
      }
    },
    list: <ListTheme>{
      background: '#fff',
    }
  },
  vertical: <MenuTheme>{
    style: 'vertical',
  },
  stacked: <MenuTheme>{
    style: 'stacked',
    marginRight: 200
  }
}

const controlsTheme = {
  dark: <ControlsTheme>{
    border: 'none',
    layout: 'right',
    borderRadius: 0,
    normal: <ControlButton>{
      default: <ColorMap>{
        color: 'inherit',
        background: 'transparent'
      },
      hover: <ColorMap>{
        color: '#fff',
        background: 'rgba(255,255,255,0.3)'
      }
    },
    close: <ControlButton>{
      default: <ColorMap>{
        color: 'inherit',
        background: 'transparent'
      },
      hover: <ColorMap>{
        color: '#fff',
        background: '#e81123'
      }
    }
  },
  light: <ControlsTheme>{
    color: '#000',
    normal: <ControlButton>{
      hover: <ColorMap>{
        background: 'rgba(0, 0, 0, 0.1)'
      },
    },
  },
  linux: <ControlsTheme>{
    border: '1px solid rgba(0,0,0,0.06)',
    borderRadius: '50%',
    close: <ControlButton>{
      hover: <ColorMap>{
        background: '#c85458'
      },
    }
  }
}

const barTheme = {
  dark: <BarTheme>{
    // light, dark
    palette: 'dark',
    height: '28px',
    color: '#fff',
    background: '#24292e',
    borderBottom: '1px solid #000',
    // dim menu bar & title color when window is not in focus
    inActiveOpacity: 0.6,
    // default fontFamily for titlebar eg: menus, menu buttons, and title
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif",
    icon: <IconTheme>{
      color: '#0372ef',
      width: 20,
      height: 20
    },
    title: <TitleTheme>{
      color: 'inherit',
      align: 'center',
      // overwritable fontFamily for just the app title
      fontFamily: 'inherit',
      fontWeight: 'normal',
    },
    button: <MenuButtonTheme>{
      maxWidth: 100,
      active: <ColorMap>{
        color: '#fff',
        background: 'rgb(48, 48, 48)',
      },
      default: <ColorMap>{
        color: 'inherit',
        background: 'transparent'
      },
      hover: <ColorMap>{
        color: 'inherit',
        background: 'rgba(255,255,255,0.3)'
      },
      disabledOpacity: 0.3
    },
  },
  light: <BarTheme>{
    palette: 'light',
    color: '#24292e',
    background: '#e8e8e8',
    borderBottom: '1px solid #d3d4d5',
    button: <MenuButtonTheme>{
      active: <ColorMap>{
        color: '#24292e',
        background: '#fff',
      },
      hover: <ColorMap>{
        background: 'rgba(0, 0, 0, 0.1)'
      }
    },
  },
  darwin: <BarTheme>{
    height: '22px',
  },
};

const getMenuTheme = (palette: Palette, menuStyle: MenuStyle = 'default'): MenuTheme => {
  let menu = menuTheme['dark']
  if (palette === 'light') {
    menu = merge(menu, menuTheme['light'])
  }
  if (menuStyle !== 'default') {
    menu = merge(menu, menuTheme[menuStyle])
  }
  return menu;
}

const getControlsTheme = (palette: Palette, platform: Platform): ControlsTheme => {
  let controls: ControlsTheme = controlsTheme['dark']
  if (palette === 'light') {
    controls = merge(controls, controlsTheme['light'])
  }
  if (platform === 'linux') {
    controls = merge(controls, controlsTheme['linux'])
  }
  return controls
}

const getBarTheme = (palette: Palette, platform: Platform): BarTheme => {
  let bar = barTheme['dark']
  if (palette === 'light') {
    bar = merge(bar, barTheme['light'])
  }
  if (platform === 'darwin') {
    bar = merge(bar, barTheme['darwin'])
  }
  return bar
}

const mergeTheme = (overrides?: TitleBarTheme, platform: Platform = 'win32'): Required<TitleBarTheme> => {
  let theme: TitleBarTheme = {
    platform
  };
  let paletteType: Palette = 'dark'
  if (overrides?.bar) {
    paletteType = overrides.bar.palette ?? 'dark';
    theme['bar'] = merge(getBarTheme(paletteType, platform), overrides.bar)
  } else {
    theme['bar'] = getBarTheme(paletteType, platform);
  }

  theme['controls'] = getControlsTheme(paletteType, platform)
  if (overrides?.controls) {
    theme['controls'] = merge(theme['controls'], overrides.controls)
  }

  let menuStyle: MenuStyle = 'default'
  if (overrides?.menu) {
    let menuPalette = overrides.menu.palette ?? paletteType
    menuStyle = overrides.menu.style ?? menuStyle
    theme['menu'] = merge(getMenuTheme(menuPalette, menuStyle), overrides.menu)
  } else {
    theme['menu'] = getMenuTheme(paletteType, menuStyle)
  }
  return theme as Required<TitleBarTheme>;
};

export const useTheme = (overrides?: TitleBarTheme, platform: Platform = 'win32'): Required<TitleBarTheme> => {
  const [currentTheme, setTheme] = useState(mergeTheme(overrides, platform));
  useEffect(() => {
    setTheme(mergeTheme(overrides, platform));
  }, [overrides, platform]);
  return currentTheme;
};

export const ThemeContext = createContext(mergeTheme());