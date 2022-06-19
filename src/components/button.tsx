import React from 'react';
import { WindowButtonProps, ColorMap } from './theme';

const WindowButton = ({
  children,
  onClick,
  close,
  controls,
  platform
}: WindowButtonProps) => {
  let config: ColorMap;

  const width = platform === 'win32' ? '100%' : '20px';
  const height = platform === 'win32' ? '100%' : '20px';
  return (
    <div>
      <div
        style={{
          width,
          height,
        }}
        onClick={onClick}
        onMouseOver={() => { config = close ?  controls.close.hover! : controls.normal.hover! }}
        onMouseLeave={() => { config = close ? controls.close.default! : controls.normal.default! }}
      >
        {children}
      </div>
    </div>
  )
};

export default WindowButton;