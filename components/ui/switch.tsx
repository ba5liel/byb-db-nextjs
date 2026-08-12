'use client'

import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'

import { cn } from '@/lib/utils'

function Switch({
  className,
  size = 'default',
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: 'default' | 'lg'
}) {
  const large = size === 'lg'

  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex shrink-0 items-center rounded-full border border-transparent shadow-xs transition-all outline-none',
        'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'dark:data-[state=unchecked]:bg-input/80',
        'disabled:cursor-not-allowed disabled:opacity-50',
        large ? 'h-7 w-[3.25rem]' : 'h-[1.15rem] w-8',
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block rounded-full bg-background shadow-sm ring-0 transition-transform',
          'dark:data-[state=unchecked]:bg-foreground dark:data-[state=checked]:bg-primary-foreground',
          large
            ? 'size-6 data-[state=checked]:translate-x-[1.4rem] data-[state=unchecked]:translate-x-0.5'
            : 'size-4 data-[state=checked]:translate-x-[calc(100%-2px)] data-[state=unchecked]:translate-x-0',
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
