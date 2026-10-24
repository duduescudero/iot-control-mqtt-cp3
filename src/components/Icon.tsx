import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
export type IconName = 'dashboard' | 'history' | 'settings' | 'temperature' | 'humidity' | 'bulb' | 'power' | 'wifi' | 'sun' | 'moon' | 'arrowUp' | 'arrowDown' | 'close' | 'chevron' | 'check' | 'info' | 'logo';
export function Icon({ name, size = 24, color = 'currentColor' }: { name: IconName; size?: number; color?: string }) {
  const paths: Partial<Record<IconName, string>> = {
    temperature: 'M9 14.8V5a3 3 0 0 1 6 0v9.8a5 5 0 1 1-6 0ZM12 8v9',
    humidity: 'M12 3C9 7 5 11 5 15a7 7 0 0 0 14 0c0-4-4-8-7-12ZM9 16a3 3 0 0 0 3 3',
    bulb: 'M9 18h6m-5 3h4M8.5 14.8a6 6 0 1 1 7 0c-.9.7-1.5 1.4-1.5 3.2h-4c0-1.8-.6-2.5-1.5-3.2Z',
    power: 'M12 3v9M7 5a9 9 0 1 0 10 0', wifi: 'M3 8a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0M9 16a5 5 0 0 1 6 0M12 20h.01',
    moon: 'M20.5 13A9 9 0 0 1 11 3.5 9 9 0 1 0 20.5 13Z', sun: 'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
    arrowUp: 'M12 20V4m-6 6 6-6 6 6', arrowDown: 'M12 4v16m-6-6 6 6 6-6', close: 'm6 6 12 12M18 6 6 18', chevron: 'm9 5 7 7-7 7', check: 'm5 12 4 4L19 6', info: 'M12 11v6m0-10h.01',
    history: 'M3 11a9 9 0 1 1 2 7M3 5v6h6m3-4v5l3 2', settings: 'M4 7h16M4 17h16M8 4v6m8 4v6', logo: 'M5 8h5v8h9M5 8V4m14 12v4M10 12h9',
  };
  return <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" accessibilityElementsHidden>
    {name === 'dashboard' ? <><Rect x={3} y={3} width={7} height={7} rx={2}/><Rect x={14} y={3} width={7} height={7} rx={2}/><Rect x={3} y={14} width={7} height={7} rx={2}/><Rect x={14} y={14} width={7} height={7} rx={2}/></> : <Path d={paths[name] ?? ''}/>}
    {name === 'sun' && <Circle cx={12} cy={12} r={4}/>}{name === 'info' && <Circle cx={12} cy={12} r={9}/>}
    {name === 'logo' && <><Circle cx={5} cy={4} r={1.5}/><Circle cx={19} cy={12} r={1.5}/><Circle cx={19} cy={20} r={1.5}/></>}
    {name === 'settings' && <><Circle cx={8} cy={7} r={2}/><Circle cx={16} cy={17} r={2}/></>}
  </Svg>;
}
