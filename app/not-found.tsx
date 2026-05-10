"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { HouseSimpleIcon, SpinnerIcon } from '@phosphor-icons/react'

const Error = () => {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleRedirect = () => {
    setIsLoading(true)
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }

  return (
    <div className='grid min-h-screen text-white grid-cols-1 lg:grid-cols-2'>
      <div className='flex flex-col items-center justify-center px-4 py-8 text-center'>
        <h2 className='mb-6 text-5xl '>Blurred!</h2>
        <h3 className='mb-1.5 text-3xl '>Can&apos;t see anything...!</h3>
        <p className='text-white/50 mb-6 max-w-sm'>
          The page you&apos;re looking for isn&apos;t found.
        </p>

        <Button
          size='lg'
          className='rounded-lg text-base'
          disabled={isLoading}
          onClick={handleRedirect}
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="mr-2 h-4 w-4 animate-spin" />
              Redirecting...
            </>
          ) : (
            <>
              <HouseSimpleIcon className="mr-2 h-4 w-4" />
              Home
            </>
          )}
        </Button>
      </div>

      <div className='relative flex items-center justify-center p-8 max-lg:hidden'>
        <div className='relative w-full max-w-[367px] aspect-square bg-white/5 backdrop-blur-sm border border-white/5 flex items-center justify-center overflow-hidden' />
      </div>
    </div>
  )
}

export default Error