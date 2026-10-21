import React from 'react'
import logo from '../../assets/indotech-logo.jpg'

/** Official INDO TECH logo (red bar, white wordmark). The collapsed sidebar shows it scaled to the rail. */
export const Logo: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => (
  <img
    src={logo}
    alt="INDO TECH"
    width={720}
    height={120}
    className={collapsed ? 'h-auto w-12 shrink-0 rounded-[2px]' : 'h-8 w-auto shrink-0 rounded-[3px]'}
  />
)
